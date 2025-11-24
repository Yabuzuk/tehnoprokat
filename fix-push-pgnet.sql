-- ========================================
-- АЛЬТЕРНАТИВНОЕ РЕШЕНИЕ С PG_NET
-- (если HTTP расширение не работает)
-- ========================================

-- Включить pg_net расширение
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Функция отправки через pg_net
CREATE OR REPLACE FUNCTION send_push_via_pgnet(
  p_token TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id BIGINT;
BEGIN
  SELECT net.http_post(
    url := 'https://fcm.googleapis.com/fcm/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'key=AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU'
    ),
    body := jsonb_build_object(
      'to', p_token,
      'notification', jsonb_build_object(
        'title', p_title,
        'body', p_body,
        'icon', '/water.png',
        'badge', '/water.png',
        'click_action', 'FCM_PLUGIN_ACTIVITY'
      ),
      'data', p_data
    )
  ) INTO request_id;
  
  RETURN request_id;
END;
$$;

-- Обновленная функция отправки уведомлений
CREATE OR REPLACE FUNCTION send_push_notification(
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
  request_id BIGINT;
BEGIN
  -- Получаем токен
  IF p_user_id IS NOT NULL THEN
    SELECT token INTO user_token 
    FROM push_tokens 
    WHERE user_id = p_user_id 
    ORDER BY updated_at DESC
    LIMIT 1;
  ELSIF p_driver_id IS NOT NULL THEN
    SELECT token INTO user_token 
    FROM push_tokens 
    WHERE driver_id = p_driver_id 
    ORDER BY updated_at DESC
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
  
  -- Отправляем через pg_net
  request_id := send_push_via_pgnet(user_token, p_title, p_body, p_data);
  
  -- Логируем результат
  INSERT INTO push_notification_log (
    user_id, driver_id, title, body, data, status, error_message, created_at
  ) VALUES (
    p_user_id, 
    p_driver_id, 
    p_title, 
    p_body, 
    p_data, 
    CASE WHEN request_id IS NOT NULL THEN 'sent' ELSE 'error' END,
    CASE WHEN request_id IS NULL THEN 'pg_net request failed' ELSE 'Request ID: ' || request_id END,
    NOW()
  );
  
  RETURN request_id IS NOT NULL;
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO push_notification_log (
      user_id, driver_id, title, body, data, status, error_message, created_at
    ) VALUES (
      p_user_id, p_driver_id, p_title, p_body, p_data, 'error', SQLERRM, NOW()
    );
    RETURN FALSE;
END;
$$;

-- Проверка pg_net
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE '✅ pg_net установлен и готов к использованию';
  ELSE
    RAISE NOTICE '❌ pg_net НЕ установлен. Включите в Dashboard → Database → Extensions';
  END IF;
END $$;