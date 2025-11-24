-- Создание функции для отправки push-уведомлений через HTTP запрос
CREATE OR REPLACE FUNCTION send_push_notification(
  p_token TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status INTEGER;
BEGIN
  -- Отправляем HTTP запрос к Firebase FCM
  SELECT status INTO response_status
  FROM http((
    'POST',
    'https://fcm.googleapis.com/fcm/send',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'key=AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU')
    ],
    'application/json',
    json_build_object(
      'to', p_token,
      'notification', json_build_object(
        'title', p_title,
        'body', p_body,
        'icon', '/water.png',
        'badge', '/water.png'
      ),
      'data', p_data
    )::text
  ));
  
  -- Логируем результат
  INSERT INTO push_logs (token_prefix, title, body, status, created_at)
  VALUES (
    LEFT(p_token, 20) || '...',
    p_title,
    p_body,
    response_status,
    NOW()
  );
  
  RETURN response_status BETWEEN 200 AND 299;
EXCEPTION
  WHEN OTHERS THEN
    -- Логируем ошибку
    INSERT INTO push_logs (token_prefix, title, body, status, error_message, created_at)
    VALUES (
      LEFT(p_token, 20) || '...',
      p_title,
      p_body,
      0,
      SQLERRM,
      NOW()
    );
    RETURN FALSE;
END;
$$;

-- Создание таблицы для логов push-уведомлений
CREATE TABLE IF NOT EXISTS push_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_prefix TEXT,
  title TEXT,
  body TEXT,
  status INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Функция-триггер для отправки уведомлений при изменении заказов
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_token TEXT;
  driver_token TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Если статус заказа изменился
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Уведомления для пользователя
    IF NEW.status IN ('accepted', 'in_progress', 'completed', 'cancelled') THEN
      -- Получаем токен пользователя
      SELECT token INTO user_token
      FROM push_tokens
      WHERE user_id = NEW.user_id
      LIMIT 1;
      
      IF user_token IS NOT NULL THEN
        -- Определяем текст уведомления
        CASE NEW.status
          WHEN 'accepted' THEN
            notification_title := '🚚 Заказ принят';
            notification_body := 'Ваш заказ принят водителем';
          WHEN 'in_progress' THEN
            notification_title := '🚛 Водитель в пути';
            notification_body := 'Водитель выехал к вам';
          WHEN 'completed' THEN
            notification_title := '✅ Заказ выполнен';
            notification_body := 'Ваш заказ успешно выполнен';
          WHEN 'cancelled' THEN
            notification_title := '❌ Заказ отменен';
            notification_body := 'Ваш заказ был отменен';
        END CASE;
        
        -- Отправляем уведомление пользователю
        PERFORM send_push_notification(
          user_token,
          notification_title,
          notification_body,
          json_build_object(
            'orderId', NEW.id::text,
            'route', '/user/orders',
            'status', NEW.status
          )::jsonb
        );
      END IF;
    END IF;
    
    -- Уведомления для водителей о новых заказах
    IF OLD.status IS NULL AND NEW.status = 'pending' THEN
      -- Получаем токены всех активных водителей для данного типа услуги
      FOR driver_token IN
        SELECT pt.token
        FROM push_tokens pt
        JOIN drivers d ON d.id = pt.driver_id
        WHERE d.status = 'active'
          AND NEW.service_type = ANY(d.service_type)
      LOOP
        -- Отправляем уведомление о новом заказе
        PERFORM send_push_notification(
          driver_token,
          '🔥 Новый заказ!',
          CASE NEW.service_type
            WHEN 'water_delivery' THEN 'Доставка воды - ' || NEW.address
            WHEN 'septic_pumping' THEN 'Откачка септика - ' || NEW.address
            ELSE 'Новый заказ - ' || NEW.address
          END,
          json_build_object(
            'orderId', NEW.id::text,
            'route', '/driver/dashboard',
            'serviceType', NEW.service_type
          )::jsonb
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создание триггера на таблицу orders
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON orders;
CREATE TRIGGER trigger_notify_order_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Включаем расширение http для HTTP запросов (если не включено)
-- CREATE EXTENSION IF NOT EXISTS http;

-- Функция для ручной отправки тестового уведомления
CREATE OR REPLACE FUNCTION test_push_notification(
  p_user_id UUID,
  p_title TEXT DEFAULT 'Тестовое уведомление',
  p_body TEXT DEFAULT 'Проверка работы push-уведомлений'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_token TEXT;
  result BOOLEAN;
BEGIN
  -- Получаем токен пользователя
  SELECT token INTO user_token
  FROM push_tokens
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF user_token IS NULL THEN
    RAISE NOTICE 'Токен не найден для пользователя %', p_user_id;
    RETURN FALSE;
  END IF;
  
  -- Отправляем уведомление
  SELECT send_push_notification(
    user_token,
    p_title,
    p_body,
    '{"test": true}'::jsonb
  ) INTO result;
  
  RETURN result;
END;
$$;