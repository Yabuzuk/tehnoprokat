-- Создание функции для автоматической отправки push-уведомлений
CREATE OR REPLACE FUNCTION send_push_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    user_token TEXT;
    driver_tokens TEXT[];
    notification_title TEXT;
    notification_body TEXT;
    service_name TEXT;
BEGIN
    -- Определяем тип услуги
    SELECT CASE 
        WHEN NEW.service_type = 'water_delivery' THEN 'Доставка воды'
        WHEN NEW.service_type = 'septic_pumping' THEN 'Откачка септика'
        ELSE 'Услуга'
    END INTO service_name;

    -- Если заказ только создан - уведомляем водителей
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Получаем токены водителей с нужным типом услуги
        SELECT array_agg(fcm_token) INTO driver_tokens
        FROM drivers 
        WHERE status = 'approved' 
        AND fcm_token IS NOT NULL
        AND service_type @> ARRAY[NEW.service_type];

        IF array_length(driver_tokens, 1) > 0 THEN
            -- Отправляем уведомления водителям через Edge Function
            PERFORM net.http_post(
                url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_token', true) || '"}',
                body := json_build_object(
                    'tokens', driver_tokens,
                    'title', '🔥 Новый заказ!',
                    'body', service_name || ' - ' || NEW.address,
                    'data', json_build_object('orderId', NEW.id, 'route', '/driver/dashboard')
                )::text
            );
        END IF;
    END IF;

    -- Если статус изменился - уведомляем пользователя
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Получаем токен пользователя
        SELECT fcm_token INTO user_token
        FROM users 
        WHERE id = NEW.user_id;

        -- Определяем сообщение по статусу
        SELECT CASE NEW.status
            WHEN 'accepted' THEN '✅ Заказ принят'
            WHEN 'in_progress' THEN '🚚 Водитель в пути'
            WHEN 'completed' THEN '✨ Заказ выполнен'
            WHEN 'cancelled' THEN '❌ Заказ отменен'
            ELSE 'Статус заказа изменен'
        END INTO notification_title;

        SELECT CASE NEW.status
            WHEN 'accepted' THEN 'Водитель принял ваш заказ'
            WHEN 'in_progress' THEN 'Водитель направляется к вам'
            WHEN 'completed' THEN 'Спасибо за использование нашего сервиса!'
            WHEN 'cancelled' THEN 'Ваш заказ был отменен'
            ELSE 'Проверьте статус в приложении'
        END INTO notification_body;

        IF user_token IS NOT NULL THEN
            -- Отправляем уведомление пользователю
            PERFORM net.http_post(
                url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_token', true) || '"}',
                body := json_build_object(
                    'token', user_token,
                    'title', notification_title,
                    'body', notification_body,
                    'data', json_build_object('orderId', NEW.id, 'status', NEW.status, 'route', '/user/orders')
                )::text
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера на таблицу orders
DROP TRIGGER IF EXISTS orders_push_notification_trigger ON orders;
CREATE TRIGGER orders_push_notification_trigger
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION send_push_notification_trigger();