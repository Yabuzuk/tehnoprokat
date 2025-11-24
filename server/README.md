# Push Notification Server

Сервер для отправки push-уведомлений через Firebase Cloud Messaging (FCM).

## Установка

1. Установите зависимости:
```bash
cd server
npm install
```

2. Получите Firebase Service Account Key:
   - Откройте [Firebase Console](https://console.firebase.google.com/)
   - Выберите проект
   - Перейдите в Project Settings → Service Accounts
   - Нажмите "Generate new private key"
   - Сохраните файл как `firebase-service-account.json` в папке `server/`

3. Запустите сервер:
```bash
npm start
```

## API Endpoints

### POST /api/send-notification
Отправка уведомления одному пользователю

**Body:**
```json
{
  "token": "fcm_device_token",
  "title": "Заголовок",
  "body": "Текст уведомления",
  "data": {
    "order_id": "123",
    "status": "accepted"
  }
}
```

### POST /api/send-notification-multi
Отправка уведомлений нескольким пользователям

**Body:**
```json
{
  "tokens": ["token1", "token2", "token3"],
  "title": "Заголовок",
  "body": "Текст уведомления",
  "data": {}
}
```

### POST /api/webhook/order-status
Webhook для автоматической отправки уведомлений при изменении статуса заказа

**Body:**
```json
{
  "order_id": "123",
  "status": "accepted",
  "user_token": "fcm_token",
  "driver_token": "fcm_token"
}
```

**Статусы:**
- `accepted` - Заказ принят
- `in_progress` - Водитель в пути
- `completed` - Заказ выполнен
- `cancelled` - Заказ отменен

## Интеграция с Supabase

Создайте Edge Function в Supabase для автоматической отправки уведомлений:

```sql
-- Создайте функцию в Supabase SQL Editor
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Вызов вашего push-сервера через HTTP
  PERFORM net.http_post(
    url := 'https://your-server.com/api/webhook/order-status',
    body := json_build_object(
      'order_id', NEW.id,
      'status', NEW.status,
      'user_token', (SELECT fcm_token FROM users WHERE id = NEW.user_id),
      'driver_token', (SELECT fcm_token FROM drivers WHERE id = NEW.driver_id)
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создайте триггер
CREATE TRIGGER order_status_notification
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_order_status_change();
```

## Деплой

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

### Railway
```bash
railway init
railway up
```

### VPS
```bash
# Установите PM2
npm install -g pm2

# Запустите сервер
pm2 start push-server.js --name push-server
pm2 save
pm2 startup
```
