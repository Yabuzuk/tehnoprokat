-- ========================================
-- БЫСТРОЕ ИСПРАВЛЕНИЕ PUSH-УВЕДОМЛЕНИЙ
-- ========================================

-- Шаг 1: Создать таблицу логов
CREATE TABLE IF NOT EXISTS push_notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  driver_id UUID,
  title TEXT,
  body TEXT,
  data JSONB,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_notification_log_created_at 
  ON push_notification_log(created_at DESC);

-- Шаг 2: Отключить RLS на push_tokens (т.к. нет Supabase Auth)
ALTER TABLE push_tokens DISABLE ROW LEVEL SECURITY;

-- Шаг 3: Включить HTTP расширение
CREATE EXTENSION IF NOT EXISTS http;

-- Шаг 4: Простая функция отправки через Firebase (без Edge Function)
CREATE OR REPLACE FUNCTION send_push_via_firebase(
  p_token TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  firebase_response TEXT;
  http_status INTEGER;
  firebase_key TEXT := 'AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU';
BEGIN
  -- Отправляем через Firebase FCM API
  SELECT status, content INTO http_status, firebase_response
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
        'body', p_body,
        'icon', '/water.png',
        'badge', '/water.png',
        'click_action', 'FCM_PLUGIN_ACTIVITY'
      ),
      'data', p_data
    )::text
  ));
  
  RETURN http_status = 200;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Firebase error: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Шаг 5: Обновленная функция отправки уведомлений
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
  send_result BOOLEAN;
BEGIN
  -- Получаем токен
  IF p_user_id IS NOT NULL THEN
    SELECT token INTO user_token 
    FROM push_tokens 
    WHERE user_id = p_user_id 
    ORDER BY updated_at DESC
    LIMIT 1;
  ELSIF p_driver_id IS NOT NULL THEN
    SELECT token INTO user_token 
    FROM push_tokens 
    WHERE driver_id = p_driver_id 
    ORDER BY updated_at DESC
    LIMIT 1;
  END IF;
  
  -- Если токен не найден
  IF user_token IS NULL THEN
    INSERT INTO push_notification_log (
      user_id, driver_id, title, body, data, status, error_message, created_at
    ) VALUES (
      p_user_id, p_driver_id, p_title, p_body, p_data, 'error', 'Token not found', NOW()
    );
    RETURN FALSE;
  END IF;
  
  -- Отправляем через Firebase
  send_result := send_push_via_firebase(user_token, p_title, p_body, p_data);
  
  -- Логируем результат
  INSERT INTO push_notification_log (
    user_id, driver_id, title, body, data, status, error_message, created_at
  ) VALUES (
    p_user_id, p_driver_id, p_title, p_body, p_data, 
    CASE WHEN send_result THEN 'sent' ELSE 'error' END,
    CASE WHEN NOT send_result THEN 'Firebase send failed' ELSE NULL END,
    NOW()
  );
  
  RETURN send_result;
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO push_notification_log (
      user_id, driver_id, title, body, data, status, error_message, created_at
    ) VALUES (
      p_user_id, p_driver_id, p_title, p_body, p_data, 'error', SQLERRM, NOW()
    );
    RETURN FALSE;
END;
$$;

-- Шаг 6: Триггер для автоматической отправки уведомлений
CREATE OR REPLACE FUNCTION auto_send_push_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Уведомления при изменении статуса заказа
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Уведомления пользователю о смене статуса
    IF NEW.status IN ('accepted', 'in_progress', 'completed', 'cancelled') THEN
      PERFORM send_push_notification(
        CASE NEW.status
          WHEN 'accepted' THEN '🚚 Заказ принят'
          WHEN 'in_progress' THEN '🚛 Водитель в пути'
          WHEN 'completed' THEN '✅ Заказ выполнен'
          WHEN 'cancelled' THEN '❌ Заказ отменен'
        END,
        CASE NEW.status
          WHEN 'accepted' THEN 'Ваш заказ принят водителем'
          WHEN 'in_progress' THEN 'Водитель выехал к вам'
          WHEN 'completed' THEN 'Ваш заказ успешно выполнен'
          WHEN 'cancelled' THEN 'Ваш заказ был отменен'
        END,
        NEW.user_id,
        NULL,
        jsonb_build_object(
          'orderId', NEW.id::text,
          'route', '/user/orders',
          'status', NEW.status
        )
      );
    END IF;
  END IF;
  
  -- Уведомления водителям о новых заказах
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Отправляем уведомление всем водителям подходящего типа
    PERFORM send_push_notification(
      '🔥 Новый заказ!',
      CASE NEW.service_type
        WHEN 'water_delivery' THEN 'Доставка воды - ' || NEW.address
        WHEN 'septic_pumping' THEN 'Откачка септика - ' || NEW.address
        ELSE 'Новый заказ - ' || NEW.address
      END,
      NULL,
      d.id,
      jsonb_build_object(
        'orderId', NEW.id::text,
        'route', '/driver/dashboard',
        'serviceType', NEW.service_type
      )
    )
    FROM drivers d
    WHERE d.status = 'active'
      AND NEW.service_type = ANY(d.service_type);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Пересоздаем триггер
DROP TRIGGER IF EXISTS trigger_auto_send_push_notifications ON orders;
CREATE TRIGGER trigger_auto_send_push_notifications
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_send_push_notifications();

-- Шаг 7: Функция для тестирования
CREATE OR REPLACE FUNCTION test_push_notification(
  p_user_id UUID,
  p_title TEXT DEFAULT 'Тест уведомления',
  p_body TEXT DEFAULT 'Это тестовое уведомление с сервера'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result BOOLEAN;
  token_exists BOOLEAN;
BEGIN
  -- Проверяем наличие токена
  SELECT EXISTS(
    SELECT 1 FROM push_tokens WHERE user_id = p_user_id
  ) INTO token_exists;
  
  IF NOT token_exists THEN
    RETURN '❌ Токен не найден для пользователя: ' || p_user_id::text;
  END IF;
  
  -- Отправляем уведомление
  SELECT send_push_notification(
    p_title,
    p_body,
    p_user_id,
    NULL,
    '{"test": true}'::jsonb
  ) INTO result;
  
  IF result THEN
    RETURN '✅ Уведомление отправлено успешно!';
  ELSE
    RETURN '❌ Ошибка отправки уведомления. Проверьте логи: SELECT * FROM push_notification_log ORDER BY created_at DESC LIMIT 5;';
  END IF;
END;
$$;

-- Шаг 8: Проверка настройки
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ПРОВЕРКА НАСТРОЙКИ PUSH-УВЕДОМЛЕНИЙ';
  RAISE NOTICE '========================================';
  
  -- Проверка HTTP расширения
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
    RAISE NOTICE '✅ HTTP расширение установлено';
  ELSE
    RAISE NOTICE '❌ HTTP расширение НЕ установлено';
  END IF;
  
  -- Проверка таблиц
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_tokens') THEN
    RAISE NOTICE '✅ Таблица push_tokens существует';
  ELSE
    RAISE NOTICE '❌ Таблица push_tokens НЕ существует';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_notification_log') THEN
    RAISE NOTICE '✅ Таблица push_notification_log существует';
  ELSE
    RAISE NOTICE '❌ Таблица push_notification_log НЕ существует';
  END IF;
  
  -- Проверка функций
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_push_notification') THEN
    RAISE NOTICE '✅ Функция send_push_notification существует';
  ELSE
    RAISE NOTICE '❌ Функция send_push_notification НЕ существует';
  END IF;
  
  -- Проверка триггера
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_auto_send_push_notifications') THEN
    RAISE NOTICE '✅ Триггер trigger_auto_send_push_notifications существует';
  ELSE
    RAISE NOTICE '❌ Триггер trigger_auto_send_push_notifications НЕ существует';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Для теста выполните:';
  RAISE NOTICE 'SELECT test_push_notification(''YOUR_USER_ID'');';
  RAISE NOTICE '========================================';
END $$;