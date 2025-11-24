-- Создание функции для отправки webhook при изменении заказов
CREATE OR REPLACE FUNCTION notify_order_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_token TEXT;
  webhook_payload JSONB;
BEGIN
  -- Если статус заказа изменился на accepted, in_progress, completed или cancelled
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('accepted', 'in_progress', 'completed', 'cancelled') THEN
    
    -- Получаем токен пользователя
    SELECT token INTO user_token
    FROM push_tokens
    WHERE user_id = NEW.user_id
    LIMIT 1;
    
    IF user_token IS NOT NULL THEN
      -- Формируем payload для webhook
      webhook_payload := json_build_object(
        'token', user_token,
        'title', CASE NEW.status
          WHEN 'accepted' THEN '🚚 Заказ принят'
          WHEN 'in_progress' THEN '🚛 Водитель в пути'
          WHEN 'completed' THEN '✅ Заказ выполнен'
          WHEN 'cancelled' THEN '❌ Заказ отменен'
        END,
        'body', CASE NEW.status
          WHEN 'accepted' THEN 'Ваш заказ принят водителем'
          WHEN 'in_progress' THEN 'Водитель выехал к вам'
          WHEN 'completed' THEN 'Ваш заказ успешно выполнен'
          WHEN 'cancelled' THEN 'Ваш заказ был отменен'
        END,
        'data', json_build_object(
          'orderId', NEW.id::text,
          'route', '/user/orders',
          'status', NEW.status
        )
      );
      
      -- Отправляем webhook (это нужно настроить в Supabase Dashboard)
      -- Webhook URL будет вызывать нашу Edge Function
      PERFORM pg_notify('push_notification', webhook_payload::text);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создание триггера
DROP TRIGGER IF EXISTS trigger_notify_order_webhook ON orders;
CREATE TRIGGER trigger_notify_order_webhook
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_webhook();

-- Функция для тестирования уведомлений
CREATE OR REPLACE FUNCTION test_notification_for_user(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  user_token TEXT;
  result TEXT;
BEGIN
  -- Получаем токен пользователя
  SELECT token INTO user_token
  FROM push_tokens
  WHERE user_id = p_user_id
  LIMIT 1;
  
  IF user_token IS NULL THEN
    RETURN 'Токен не найден для пользователя ' || p_user_id::text;
  END IF;
  
  -- Отправляем тестовое уведомление
  PERFORM pg_notify('push_notification', json_build_object(
    'token', user_token,
    'title', '🧪 Тестовое уведомление из БД',
    'body', 'Проверка работы уведомлений через триггер',
    'data', json_build_object('test', true)
  )::text);
  
  RETURN 'Тестовое уведомление отправлено для токена: ' || LEFT(user_token, 20) || '...';
END;
$$;