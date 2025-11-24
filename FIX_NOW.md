# ⚡ СРОЧНОЕ ИСПРАВЛЕНИЕ

## Выполните эти SQL команды по порядку:

### 1. Проверьте логи (скопируйте в SQL Editor):

```sql
SELECT 
  created_at,
  status,
  error_message
FROM push_notification_log 
ORDER BY created_at DESC 
LIMIT 5;
```

**Скопируйте сюда результат error_message**

---

### 2. Если ошибка "extension http does not exist":

```sql
-- Попробуйте включить HTTP
CREATE EXTENSION IF NOT EXISTS http;

-- Если не работает, используйте pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;
```

Затем выполните **весь файл** `fix-push-pgnet.sql`

---

### 3. Если ошибка "Token not found":

```sql
-- Проверьте токены
SELECT 
  user_id,
  LEFT(token, 30) || '...' as token
FROM push_tokens 
WHERE user_id = 'c2135ae8-e722-4945-8c21-8db317a950d8';
```

Если пусто - переустановите приложение и войдите заново.

---

### 4. Если ошибка "HTTP 401" или "HTTP 400":

Проблема с Firebase ключом. Выполните:

```sql
-- Проверьте прямой запрос к Firebase
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
  '{"to":"TEST","notification":{"title":"Test","body":"Test"}}'::text
));
```

Если статус 401 - ключ неверный. Получите новый из Firebase Console.

---

### 5. Детальный тест:

```sql
-- Выполните сначала fix-push-detailed.sql
-- Затем:
SELECT * FROM test_push_detailed('c2135ae8-e722-4945-8c21-8db317a950d8');
```

---

## 🎯 Быстрое решение (если ничего не помогает):

Используйте Supabase Edge Function вместо SQL:

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/pmebqzbjtdmbaoqjfbev/functions)
2. Нажмите **New Function**
3. Имя: `send-push-notification`
4. Вставьте код из `supabase/functions/send-push-notification/index.ts`
5. Deploy

Затем обновите SQL:

```sql
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
BEGIN
  -- Получаем токен
  IF p_user_id IS NOT NULL THEN
    SELECT token INTO user_token FROM push_tokens WHERE user_id = p_user_id LIMIT 1;
  ELSIF p_driver_id IS NOT NULL THEN
    SELECT token INTO user_token FROM push_tokens WHERE driver_id = p_driver_id LIMIT 1;
  END IF;
  
  IF user_token IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Вызываем Edge Function через pg_net
  PERFORM net.http_post(
    url := 'https://pmebqzbjtdmbaoqjfbev.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub'
    ),
    body := jsonb_build_object(
      'token', user_token,
      'title', p_title,
      'body', p_body,
      'data', p_data
    )
  );
  
  RETURN TRUE;
END;
$$;
```

---

## 📞 Что мне нужно от вас:

Выполните команду из пункта 1 и пришлите мне **error_message** из логов.