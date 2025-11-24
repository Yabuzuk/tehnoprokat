# 🔍 Диагностика проблемы с Push-уведомлениями

## Шаг 1: Выполните check-logs.sql

Скопируйте и выполните в Supabase SQL Editor:

```sql
-- Проверка логов
SELECT 
  created_at,
  status,
  error_message
FROM push_notification_log 
ORDER BY created_at DESC 
LIMIT 5;
```

## Шаг 2: Выполните детальный тест

```sql
-- Сначала выполните fix-push-detailed.sql
-- Затем запустите детальный тест:
SELECT * FROM test_push_detailed('c2135ae8-e722-4945-8c21-8db317a950d8');
```

## Возможные ошибки и решения

### Ошибка: "extension "http" does not exist"

**Решение:**
1. Supabase Dashboard → Database → Extensions
2. Найдите `http` (или `pg_net`)
3. Нажмите Enable
4. Повторите тест

### Ошибка: "Token not found"

**Решение:**
```sql
-- Проверьте токены
SELECT * FROM push_tokens WHERE user_id = 'c2135ae8-e722-4945-8c21-8db317a950d8';
```

Если токенов нет - переустановите приложение и войдите заново.

### Ошибка: "HTTP 401: Unauthorized"

**Проблема:** Неверный Firebase Server Key

**Решение:**
1. Откройте `android/app/google-services.json`
2. Найдите `current_key`
3. Обновите ключ в SQL:

```sql
-- Обновите ключ в функции
CREATE OR REPLACE FUNCTION send_push_via_firebase(...)
...
  firebase_key TEXT := 'ВАШ_НОВЫЙ_КЛЮЧ';
...
```

### Ошибка: "HTTP 400: InvalidRegistration"

**Проблема:** Токен устройства неверный или устарел

**Решение:**
1. Удалите старый токен:
```sql
DELETE FROM push_tokens WHERE user_id = 'c2135ae8-e722-4945-8c21-8db317a950d8';
```

2. Переустановите приложение
3. Войдите заново

### Ошибка: "function http(...) does not exist"

**Проблема:** HTTP расширение не установлено

**Решение:**

Попробуйте альтернативное расширение `pg_net`:

```sql
-- Включите pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Используйте pg_net вместо http
CREATE OR REPLACE FUNCTION send_push_via_firebase_pgnet(
  p_token TEXT,
  p_title TEXT,
  p_body TEXT
)
RETURNS BOOLEAN
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
        'body', p_body
      )
    )
  ) INTO request_id;
  
  RETURN request_id IS NOT NULL;
END;
$$;
```

## Быстрая проверка всего

```sql
-- Выполните все проверки сразу
DO $$
DECLARE
  http_exists BOOLEAN;
  pgnet_exists BOOLEAN;
  token_count INTEGER;
  log_count INTEGER;
BEGIN
  -- Проверка расширений
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'http') INTO http_exists;
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO pgnet_exists;
  
  RAISE NOTICE '=== ПРОВЕРКА РАСШИРЕНИЙ ===';
  RAISE NOTICE 'HTTP: %', CASE WHEN http_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'PG_NET: %', CASE WHEN pgnet_exists THEN '✅' ELSE '❌' END;
  
  -- Проверка токенов
  SELECT COUNT(*) INTO token_count FROM push_tokens;
  RAISE NOTICE '=== ТОКЕНЫ ===';
  RAISE NOTICE 'Всего токенов: %', token_count;
  
  -- Проверка логов
  SELECT COUNT(*) INTO log_count FROM push_notification_log;
  RAISE NOTICE '=== ЛОГИ ===';
  RAISE NOTICE 'Всего попыток: %', log_count;
  
  -- Последняя ошибка
  IF log_count > 0 THEN
    RAISE NOTICE '=== ПОСЛЕДНЯЯ ОШИБКА ===';
    RAISE NOTICE '%', (
      SELECT error_message 
      FROM push_notification_log 
      WHERE status = 'error' 
      ORDER BY created_at DESC 
      LIMIT 1
    );
  END IF;
END $$;
```