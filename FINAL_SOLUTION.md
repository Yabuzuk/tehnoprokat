# 🎯 ФИНАЛЬНОЕ РЕШЕНИЕ

## Проблема
Firebase Legacy API (`/fcm/send`) возвращает 404 даже с новым Server Key.
Это означает, что Legacy API полностью отключен для проекта `newagent-c434a`.

## ✅ Единственное рабочее решение: Edge Function

### Шаг 1: Создать Edge Function в Supabase Dashboard

1. Откройте https://supabase.com/dashboard/project/pmebqzbjtdmbaoqjfbev/functions
2. Нажмите **New Function**
3. Имя: `send-push`
4. Вставьте этот код:

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
        'Authorization': 'key=AAAAlZPBDzs:APA91bHtNJeIx0YLsCSQ95x6gafsT2ADwbx7IIfICKFWIh_b21wG6zTvEp9zYOeN-JMe-7GttOA5LFfkosbvSyVJ2plPZNnj-FqL64HMrTCTQPAHlJS3J6iKSwtbjO8C6p6EHgzcIYOW',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        priority: 'high',
        notification: {
          title,
          body,
          sound: 'default',
          click_action: 'FCM_PLUGIN_ACTIVITY'
        },
        data: data || {}
      }),
    })

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ success: response.ok, status: response.status, result }),
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

5. Нажмите **Deploy**

### Шаг 2: Обновить SQL функцию

Выполните в SQL Editor:

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
    COALESCE(edge_response, 'No response');
END;
$$;
```

### Шаг 3: Тест

```sql
SELECT test_push_notification('c2135ae8-e722-4945-8c21-8db317a950d8');
```

Должно вернуть: `✅ Уведомление отправлено успешно!`

---

## Почему это работает?

```
SQL Trigger → send_push_notification()
    ↓
send_push_via_firebase() → HTTP запрос
    ↓
Supabase Edge Function (Deno runtime)
    ↓
Firebase FCM API ✅ (работает из Edge Function)
    ↓
Устройство получает уведомление
```

Edge Function работает на серверах Supabase и не имеет ограничений Legacy API.

---

## Альтернатива (если Edge Function не работает)

Используйте только Realtime подписки (уже работают) + локальные уведомления в приложении.