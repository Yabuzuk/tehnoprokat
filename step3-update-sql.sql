-- Удаляем старую функцию
DROP FUNCTION IF EXISTS send_push_via_firebase(text,text,text,jsonb);

-- Создаём новую, которая использует Edge Function
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
  SELECT status, content INTO http_status_code, edge_response
  FROM http((
    'POST',
    'https://pmebqzbjtdmbaoqjfbev.supabase.co/functions/v1/send-push',
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
END;
$$;