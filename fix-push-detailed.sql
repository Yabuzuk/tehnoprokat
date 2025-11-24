-- Улучшенная функция с детальным логированием
CREATE OR REPLACE FUNCTION send_push_via_firebase(
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
  firebase_key TEXT := 'AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU';
BEGIN
  -- Отправляем через Firebase FCM API
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
      'notification', json_build_object(
        'title', p_title,
        'body', p_body,
        'icon', '/water.png',
        'badge', '/water.png',
        'click_action', 'FCM_PLUGIN_ACTIVITY'
      ),
      'data', p_data
    )::text
  ));
  
  RETURN QUERY SELECT 
    http_status_code = 200,
    http_status_code,
    firebase_response;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      FALSE,
      0,
      'Exception: ' || SQLERRM;
END;
$$;

-- Обновленная функция отправки с детальным логированием
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
  
  -- Логируем результат с деталями
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
      ELSE 'HTTP ' || send_status || ': ' || COALESCE(send_response, 'No response')
    END,
    NOW()
  );
  
  RETURN send_success;
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO push_notification_log (
      user_id, driver_id, title, body, data, status, error_message, created_at
    ) VALUES (
      p_user_id, p_driver_id, p_title, p_body, p_data, 'error', 'Exception: ' || SQLERRM, NOW()
    );
    RETURN FALSE;
END;
$$;

-- Функция для детального теста
CREATE OR REPLACE FUNCTION test_push_detailed(p_user_id UUID)
RETURNS TABLE(
  step TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_token TEXT;
  http_result RECORD;
BEGIN
  -- Шаг 1: Проверка HTTP расширения
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
    RETURN QUERY SELECT 
      'HTTP Extension'::TEXT,
      '✅ OK'::TEXT,
      'HTTP extension is installed'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'HTTP Extension'::TEXT,
      '❌ ERROR'::TEXT,
      'HTTP extension is NOT installed'::TEXT;
    RETURN;
  END IF;
  
  -- Шаг 2: Проверка токена
  SELECT token INTO user_token 
  FROM push_tokens 
  WHERE user_id = p_user_id 
  LIMIT 1;
  
  IF user_token IS NOT NULL THEN
    RETURN QUERY SELECT 
      'Token Check'::TEXT,
      '✅ OK'::TEXT,
      'Token found: ' || LEFT(user_token, 30) || '...'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'Token Check'::TEXT,
      '❌ ERROR'::TEXT,
      'Token not found for user: ' || p_user_id::TEXT;
    RETURN;
  END IF;
  
  -- Шаг 3: Тест Firebase API
  SELECT * INTO http_result
  FROM send_push_via_firebase(
    user_token,
    'Детальный тест',
    'Проверка Firebase API',
    '{"test": true}'::jsonb
  );
  
  IF http_result.success THEN
    RETURN QUERY SELECT 
      'Firebase API'::TEXT,
      '✅ OK'::TEXT,
      'HTTP ' || http_result.http_status || ': ' || http_result.response;
  ELSE
    RETURN QUERY SELECT 
      'Firebase API'::TEXT,
      '❌ ERROR'::TEXT,
      'HTTP ' || http_result.http_status || ': ' || http_result.response;
  END IF;
  
END;
$$;