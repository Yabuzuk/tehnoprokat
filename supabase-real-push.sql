-- Функция для РЕАЛЬНОЙ отправки push-уведомлений через Supabase Edge Function
CREATE OR REPLACE FUNCTION send_real_push_notification(
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
  user_token TEXT;
  edge_response TEXT;
  http_status INTEGER;
  supabase_url TEXT := 'https://pmebqzbjtdmbaoqjfbev.supabase.co';
  service_role_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZWJxemJqdGRtYmFvcWpmYmV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU0NzE5MSwiZXhwIjoyMDQ4MTIzMTkxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
BEGIN
  -- Получаем токен пользователя или водителя
  IF p_user_id IS NOT NULL THEN
    SELECT token INTO user_token 
    FROM push_tokens 
    WHERE user_id = p_user_id 
    LIMIT 1;
  ELSIF p_driver_id IS NOT NULL THEN
    SELECT token INTO user_token 
    FROM push_tokens 
    WHERE driver_id = p_driver_id 
    LIMIT 1;
  END IF;
  
  -- Если токен не найден
  IF user_token IS NULL THEN
    INSERT INTO push_notification_log (
      user_id, driver_id, title, body, data, status, error_message, created_at
    ) VALUES (
      p_user_id, p_driver_id, p_title, p_body, p_data, 'error', 'Token not found', NOW()
    );
    RETURN FALSE;
  END IF;
  
  -- Отправляем через Supabase Edge Function
  SELECT status, content INTO http_status, edge_response
  FROM http((
    'POST',
    supabase_url || '/functions/v1/send-push-notification',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_role_key)
    ],
    'application/json',
    json_build_object(
      'token', user_token,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )::text
  ));
  
  -- Логируем результат
  INSERT INTO push_notification_log (
    user_id, driver_id, title, body, data, status, error_message, created_at
  ) VALUES (
    p_user_id, p_driver_id, p_title, p_body, p_data, 
    CASE WHEN http_status = 200 THEN 'sent' ELSE 'error' END,
    CASE WHEN http_status != 200 THEN 'HTTP ' || http_status || ': ' || edge_response ELSE NULL END,
    NOW()
  );
  
  RETURN http_status = 200;
  
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

-- Обновляем триггер для использования реальной отправки
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
      PERFORM send_real_push_notification(
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
    PERFORM send_real_push_notification(
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

-- Пересоздаем триггер
DROP TRIGGER IF EXISTS trigger_auto_send_push_notifications ON orders;
CREATE TRIGGER trigger_auto_send_push_notifications
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_send_push_notifications();

-- Функция для тестирования РЕАЛЬНЫХ уведомлений
CREATE OR REPLACE FUNCTION test_real_push_notification(
  p_user_id UUID,
  p_title TEXT DEFAULT 'Тест с сервера',
  p_body TEXT DEFAULT 'Реальное серверное уведомление'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT send_real_push_notification(
    p_title,
    p_body,
    p_user_id,
    NULL,
    '{"test": true}'::jsonb
  ) INTO result;
  
  IF result THEN
    RETURN 'Реальное уведомление отправлено успешно!';
  ELSE
    RETURN 'Ошибка отправки реального уведомления';
  END IF;
END;
$$;

-- Включаем HTTP расширение (если не включено)
CREATE EXTENSION IF NOT EXISTS http;