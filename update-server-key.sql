-- Обновление Firebase Server Key
DROP FUNCTION IF EXISTS send_push_via_firebase(text,text,text,jsonb);

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

-- Тест с новым ключом
DO $$
DECLARE
  test_result RECORD;
  test_token TEXT;
BEGIN
  SELECT token INTO test_token FROM push_tokens LIMIT 1;
  
  IF test_token IS NULL THEN
    RAISE NOTICE '❌ Токен не найден';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔑 Тест нового Server Key...';
  RAISE NOTICE '📱 Токен: %', LEFT(test_token, 30) || '...';
  
  SELECT * INTO test_result
  FROM send_push_via_firebase(
    test_token,
    '🎉 Тест успешен!',
    'Новый Server Key работает'
  );
  
  RAISE NOTICE '📊 HTTP Status: %', test_result.http_status;
  RAISE NOTICE '📋 Response: %', LEFT(test_result.response, 200);
  
  IF test_result.success THEN
    RAISE NOTICE '✅ УСПЕШНО! Push-уведомления работают!';
  ELSE
    RAISE NOTICE '❌ Ошибка: HTTP %', test_result.http_status;
  END IF;
END $$;

-- Финальный тест функции
SELECT test_push_notification('c2135ae8-e722-4945-8c21-8db317a950d8');