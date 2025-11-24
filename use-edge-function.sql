-- БЫСТРОЕ РЕШЕНИЕ: Использовать Edge Function вместо прямого Firebase API
-- Edge Function обходит проблему с Server Key

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
  edge_response TEXT;
  http_status_code INTEGER;
BEGIN
  -- Вызываем Edge Function
  SELECT status, content INTO http_status_code, edge_response
  FROM http((
    'POST',
    'https://pmebqzbjtdmbaoqjfbev.supabase.co/functions/v1/send-push-notification',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZWJxemJqdGRtYmFvcWpmYmV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTkyNDksImV4cCI6MjA3OTI3NTI0OX0.QmIOZ_wxv68OcZ2zx8kYDD-J6EIQ3DL11j4w62GnTfY')
    ],
    'application/json',
    json_build_object(
      'token', p_token,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )::text
  ));
  
  RETURN QUERY SELECT 
    http_status_code = 200,
    http_status_code,
    COALESCE(edge_response, 'No response');
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      FALSE,
      0,
      'Exception: ' || SQLERRM;
END;
$$;

-- Тест Edge Function
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
  
  RAISE NOTICE '📱 Тест Edge Function...';
  
  SELECT * INTO test_result
  FROM send_push_via_firebase(
    test_token,
    'Тест Edge Function',
    'Проверка через Supabase'
  );
  
  RAISE NOTICE '📊 HTTP Status: %', test_result.http_status;
  RAISE NOTICE '📋 Response: %', test_result.response;
  
  IF test_result.success THEN
    RAISE NOTICE '✅ Edge Function работает!';
  ELSIF test_result.http_status = 404 THEN
    RAISE NOTICE '❌ Edge Function не найдена. Создайте её в Dashboard → Functions';
  ELSE
    RAISE NOTICE '❌ Ошибка: %', test_result.response;
  END IF;
END $$;