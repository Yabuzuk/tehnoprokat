-- ИСПРАВЛЕНИЕ: Firebase FCM v1 API
-- Старый URL (deprecated): https://fcm.googleapis.com/fcm/send
-- Новый URL: https://fcm.googleapis.com/v1/projects/PROJECT_ID/messages:send

-- Удаляем старую функцию
DROP FUNCTION IF EXISTS send_push_via_firebase(text,text,text,jsonb);

-- Создаем новую с правильным возвратом
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
  firebase_key TEXT := 'AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU';
  payload TEXT;
BEGIN
  -- Формируем payload
  payload := json_build_object(
    'to', p_token,
    'priority', 'high',
    'notification', json_build_object(
      'title', p_title,
      'body', p_body,
      'sound', 'default',
      'click_action', 'FCM_PLUGIN_ACTIVITY'
    ),
    'data', p_data
  )::text;
  
  -- Отправляем через Legacy FCM API
  SELECT status, content INTO http_status_code, firebase_response
  FROM http((
    'POST',
    'https://fcm.googleapis.com/fcm/send',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'key=' || firebase_key)
    ],
    'application/json',
    payload
  ));
  
  RETURN QUERY SELECT 
    http_status_code = 200,
    http_status_code,
    COALESCE(firebase_response, 'No response');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      FALSE,
      0,
      'Exception: ' || SQLERRM;
END;
$$;

-- Тест прямого запроса
DO $$
DECLARE
  test_result RECORD;
  test_token TEXT;
BEGIN
  -- Получаем токен
  SELECT token INTO test_token 
  FROM push_tokens 
  WHERE user_id = 'c2135ae8-e722-4945-8c21-8db317a950d8'::uuid 
  LIMIT 1;
  
  IF test_token IS NULL THEN
    RAISE NOTICE '❌ Токен не найден';
    RETURN;
  END IF;
  
  RAISE NOTICE '📱 Токен: %', LEFT(test_token, 30) || '...';
  
  -- Тестируем отправку
  SELECT * INTO test_result
  FROM send_push_via_firebase(
    test_token,
    'Тест Firebase',
    'Проверка нового URL'
  );
  
  RAISE NOTICE '📊 Статус: %', test_result.http_status;
  RAISE NOTICE '📋 Ответ: %', test_result.response;
  
  IF test_result.success THEN
    RAISE NOTICE '✅ Успешно!';
  ELSE
    RAISE NOTICE '❌ Ошибка: HTTP %', test_result.http_status;
  END IF;
END $$;