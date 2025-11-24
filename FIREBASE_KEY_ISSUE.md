# 🔥 Проблема с Firebase Server Key

## Причина 404 ошибки

Firebase Legacy API (`/fcm/send`) возвращает 404, что означает:
1. ❌ Server Key неверный или неактивен
2. ❌ Cloud Messaging API (Legacy) отключен в проекте
3. ❌ Нужно использовать новый FCM v1 API

## ✅ Решение 1: Получить правильный Server Key

1. Откройте [Firebase Console](https://console.firebase.google.com/project/newagent-c434a/settings/cloudmessaging)
2. Найдите раздел **Cloud Messaging API (Legacy)**
3. Если видите кнопку **Enable** - нажмите её
4. Скопируйте **Server key**
5. Выполните SQL:

```sql
-- Обновите ключ
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
  firebase_key TEXT := 'ВАШ_НОВЫЙ_SERVER_KEY'; -- ЗАМЕНИТЕ ЗДЕСЬ
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
      'notification', json_build_object(
        'title', p_title,
        'body', p_body
      ),
      'data', p_data
    )::text
  ));
  
  RETURN QUERY SELECT 
    http_status_code = 200,
    http_status_code,
    firebase_response;
END;
$$;
```

## ✅ Решение 2: Использовать FCM v1 API (рекомендуется)

Это требует OAuth2 токен, поэтому проще через Edge Function:

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/pmebqzbjtdmbaoqjfbev/functions)
2. Создайте новую функцию `send-push`
3. Вставьте код:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, title, body, data } = await req.json()
    
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': 'key=AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: { title, body },
        data: data || {}
      }),
    })

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ success: response.ok, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

4. Deploy
5. Обновите SQL:

```sql
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
    edge_response;
END;
$$;
```

## 🎯 Быстрое решение (без Firebase)

Используйте локальные уведомления через Capacitor:

```sql
-- Просто логируем в БД, а клиент показывает локальное уведомление
CREATE OR REPLACE FUNCTION send_push_notification(
  p_title TEXT,
  p_body TEXT,
  p_user_id UUID DEFAULT NULL,
  p_driver_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Просто логируем
  INSERT INTO push_notification_log (
    user_id, driver_id, title, body, data, status, created_at
  ) VALUES (
    p_user_id, p_driver_id, p_title, p_body, p_data, 'logged', NOW()
  );
  
  RETURN TRUE;
END;
$$;
```

Затем в клиенте слушайте изменения через Realtime (уже работает).

## 📞 Что делать сейчас

**Вариант A (быстро):** Используйте Решение 2 (Edge Function)
**Вариант B (надежно):** Получите новый Server Key из Firebase Console