-- Проверка Firebase конфигурации
-- Project ID из google-services.json: newagent-c434a

-- Тест 1: Legacy API
SELECT 
  'Legacy API Test' as test_name,
  status,
  LEFT(content, 200) as response
FROM http((
  'POST',
  'https://fcm.googleapis.com/fcm/send',
  ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('Authorization', 'key=AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU')
  ],
  'application/json',
  json_build_object(
    'to', (SELECT token FROM push_tokens LIMIT 1),
    'notification', json_build_object(
      'title', 'Test',
      'body', 'Test message'
    )
  )::text
));

-- Если 404, проверьте что Server Key правильный
-- Получите новый Server Key:
-- 1. https://console.firebase.google.com/project/newagent-c434a/settings/cloudmessaging
-- 2. Cloud Messaging API (Legacy) → Server key