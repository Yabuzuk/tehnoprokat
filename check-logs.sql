-- Проверка логов push-уведомлений
SELECT 
  created_at,
  user_id,
  driver_id,
  title,
  body,
  status,
  error_message
FROM push_notification_log 
ORDER BY created_at DESC 
LIMIT 10;

-- Проверка токенов
SELECT 
  user_id,
  driver_id,
  LEFT(token, 30) || '...' as token_preview,
  device_type,
  updated_at
FROM push_tokens 
ORDER BY updated_at DESC;

-- Проверка HTTP расширения
SELECT * FROM pg_extension WHERE extname = 'http';

-- Тест HTTP запроса напрямую
SELECT 
  status,
  content
FROM http((
  'POST',
  'https://fcm.googleapis.com/fcm/send',
  ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('Authorization', 'key=AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU')
  ],
  'application/json',
  json_build_object(
    'to', (SELECT token FROM push_tokens WHERE user_id = 'c2135ae8-e722-4945-8c21-8db317a950d8'::uuid LIMIT 1),
    'notification', json_build_object(
      'title', 'Прямой тест',
      'body', 'Тест HTTP запроса'
    )
  )::text
));