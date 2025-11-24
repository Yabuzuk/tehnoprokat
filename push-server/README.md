# Push Server для Водовозка

## Деплой на Vercel

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в Vercel:
```bash
vercel login
```

3. Задеплойте:
```bash
cd push-server
vercel --prod
```

4. Скопируйте URL (например: `https://push-server-xxx.vercel.app`)

## Обновите SQL функцию

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
    'https://ВАШ-URL.vercel.app/api/send-push',
    ARRAY[
      http_header('Content-Type', 'application/json')
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

## Тест

```sql
SELECT test_push_notification('USER_ID');
```