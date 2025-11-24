-- Проверка последней ошибки
SELECT 
  created_at,
  status,
  error_message,
  title,
  body
FROM push_notification_log 
ORDER BY created_at DESC 
LIMIT 3;