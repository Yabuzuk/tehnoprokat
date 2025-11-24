-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ
-- Обновляем обе функции с правильными типами

DROP FUNCTION IF EXISTS send_push_via_firebase(text,text,text,jsonb);
DROP FUNCTION IF EXISTS send_push_notification(text,text,uuid,uuid,jsonb);

-- Функция отправки через Firebase
CREATE FUNCTION send_push_via_firebase(
  p_token TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(success BOOLEAN, http_status INTEGER, response TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  firebase_response TEXT;
  http_status_code INTEGER;
  firebase_key TEXT := 'AAAAlZPBDzs:APA91bHtNJeIx0YLsCSQ95x6gafsT2ADwbx7IIfICKFWIh_b21wG6zTvEp9zYOeN-JMe-7GttOA5LFfkosbvSyVJ2plPZNnj-FqL64HMrTCTQPAHlJS3J6iKSwtbjO8C6p6EHgzcIYOW';
BEGIN
  SELECT status, content INTO http_status_code, firebase_response
  FROM http((
    'POST',
    'https://fcm.googleapis.com/fcm/send',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'key=' || firebase_key)
    ],
    'application/json',
    json_build_object(
      'to', p_token,
      'priority', 'high',
      'notification', json_build_object(
        'title', p_title,
        'body', p_body,
        'sound', 'default',
        'click_action', 'FCM_PLUGIN_ACTIVITY'
      ),
      'data', p_data
    )::text
  ));
  
  RETURN QUERY SELECT 
    http_status_code = 200,
    http_status_code,
    COALESCE(firebase_response, 'No response');
END;
$$;

-- Функция отправки уведомлений
CREATE FUNCTION send_push_notification(
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
  send_success BOOLEAN;
  send_status INTEGER;
  send_response TEXT;
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
  
  -- Отправляем через Firebase
  SELECT * INTO send_success, send_status, send_response
  FROM send_push_via_firebase(user_token, p_title, p_body, p_data);
  
  -- Логируем результат
  INSERT INTO push_notification_log (
    user_id, driver_id, title, body, data, status, error_message, created_at
  ) VALUES (
    p_user_id, 
    p_driver_id, 
    p_title, 
    p_body, 
    p_data, 
    CASE WHEN send_success THEN 'sent' ELSE 'error' END,
    CASE 
      WHEN send_success THEN NULL
      ELSE 'HTTP ' || send_status || ': ' || LEFT(send_response, 200)
    END,
    NOW()
  );
  
  RETURN send_success;
  
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

-- Тест
SELECT test_push_notification('c2135ae8-e722-4945-8c21-8db317a950d8');