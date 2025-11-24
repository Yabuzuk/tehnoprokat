-- ПРОСТОЕ РЕШЕНИЕ: Только логирование в БД
-- Клиент получит через Realtime и покажет локальное уведомление

DROP FUNCTION IF EXISTS send_push_via_firebase(text,text,text,jsonb);
DROP FUNCTION IF EXISTS send_push_notification(text,text,uuid,uuid,jsonb);

-- Упрощённая функция - только логирование
CREATE FUNCTION send_push_notification(
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
  -- Просто логируем в БД
  INSERT INTO push_notification_log (
    user_id, driver_id, title, body, data, status, created_at
  ) VALUES (
    p_user_id, p_driver_id, p_title, p_body, p_data, 'logged', NOW()
  );
  
  RETURN TRUE;
END;
$$;

-- Тест
SELECT send_push_notification(
  'Тест локальных уведомлений',
  'Работает через Realtime',
  'c2135ae8-e722-4945-8c21-8db317a950d8'::uuid
);