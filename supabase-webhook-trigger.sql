-- Создание функции для отправки HTTP запроса к Edge Function
CREATE OR REPLACE FUNCTION send_push_via_webhook(
  p_title TEXT,
  p_body TEXT,
  p_user_id UUID DEFAULT NULL,
  p_driver_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  result BOOLEAN := FALSE;
BEGIN
  -- URL вашей Edge Function (замените на реальный)
  webhook_url := 'https://your-project.supabase.co/functions/v1/send-push-notification';
  
  -- Формируем payload
  payload := jsonb_build_object(
    'user_id', p_user_id,
    'driver_id', p_driver_id,
    'title', p_title,
    'body', p_body,
    'data', p_data
  );
  
  -- Отправляем через pg_notify для обработки внешним сервисом
  PERFORM pg_notify('push_notification_channel', payload::text);
  
  -- Логируем в таблицу
  INSERT INTO push_notification_log (
    user_id, driver_id, title, body, data, status, created_at
  ) VALUES (
    p_user_id, p_driver_id, p_title, p_body, p_data, 'sent', NOW()
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Логируем ошибку
    INSERT INTO push_notification_log (
      user_id, driver_id, title, body, data, status, error_message, created_at
    ) VALUES (
      p_user_id, p_driver_id, p_title, p_body, p_data, 'error', SQLERRM, NOW()
    );
    RETURN FALSE;
END;
$$;

-- Создание таблицы для логов уведомлений
CREATE TABLE IF NOT EXISTS push_notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  driver_id UUID,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Функция-триггер для автоматической отправки уведомлений
CREATE OR REPLACE FUNCTION auto_send_push_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Уведомления при изменении статуса заказа
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Уведомления пользователю о смене статуса
    IF NEW.status IN ('accepted', 'in_progress', 'completed', 'cancelled') THEN
      PERFORM send_push_via_webhook(
        CASE NEW.status
          WHEN 'accepted' THEN '🚚 Заказ принят'
          WHEN 'in_progress' THEN '🚛 Водитель в пути'
          WHEN 'completed' THEN '✅ Заказ выполнен'
          WHEN 'cancelled' THEN '❌ Заказ отменен'
        END,
        CASE NEW.status
          WHEN 'accepted' THEN 'Ваш заказ принят водителем'
          WHEN 'in_progress' THEN 'Водитель выехал к вам'
          WHEN 'completed' THEN 'Ваш заказ успешно выполнен'
          WHEN 'cancelled' THEN 'Ваш заказ был отменен'
        END,
        NEW.user_id,
        NULL,
        jsonb_build_object(
          'orderId', NEW.id::text,
          'route', '/user/orders',
          'status', NEW.status
        )
      );
    END IF;
  END IF;
  
  -- Уведомления водителям о новых заказах
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Отправляем уведомление всем водителям подходящего типа
    PERFORM send_push_via_webhook(
      '🔥 Новый заказ!',
      CASE NEW.service_type
        WHEN 'water_delivery' THEN 'Доставка воды - ' || NEW.address
        WHEN 'septic_pumping' THEN 'Откачка септика - ' || NEW.address
        ELSE 'Новый заказ - ' || NEW.address
      END,
      NULL,
      d.id,
      jsonb_build_object(
        'orderId', NEW.id::text,
        'route', '/driver/dashboard',
        'serviceType', NEW.service_type
      )
    )
    FROM drivers d
    WHERE d.status = 'active'
      AND NEW.service_type = ANY(d.service_type);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создание триггера на таблицу orders
DROP TRIGGER IF EXISTS trigger_auto_send_push_notifications ON orders;
CREATE TRIGGER trigger_auto_send_push_notifications
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_send_push_notifications();

-- Функция для ручного тестирования
CREATE OR REPLACE FUNCTION test_push_notification_manual(
  p_user_id UUID,
  p_title TEXT DEFAULT 'Тестовое уведомление',
  p_body TEXT DEFAULT 'Проверка серверных уведомлений'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT send_push_via_webhook(
    p_title,
    p_body,
    p_user_id,
    NULL,
    '{"test": true}'::jsonb
  ) INTO result;
  
  IF result THEN
    RETURN 'Уведомление отправлено успешно';
  ELSE
    RETURN 'Ошибка отправки уведомления';
  END IF;
END;
$$;