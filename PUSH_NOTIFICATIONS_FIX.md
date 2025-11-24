# Исправление Push-уведомлений

## Проблема
Push-уведомления не работают из-за CORS ошибок при прямом обращении к Firebase FCM API из браузера/мобильного приложения.

## Решение
Используем Supabase Edge Function для отправки уведомлений через серверную среду.

## Шаги для исправления

### 1. Деплой Edge Function

```bash
# Установка Supabase CLI (если не установлен)
npm install -g supabase

# Логин в Supabase
supabase login

# Деплой функции
supabase functions deploy send-push-notification --project-ref pmebqzbjtdmbaoqjfbev
```

Или запустите готовый скрипт:
```bash
deploy-edge-function.bat
```

### 2. Выполнение SQL скрипта

Выполните SQL скрипт `supabase-real-push.sql` в Supabase SQL Editor:

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/pmebqzbjtdmbaoqjfbev)
2. Перейдите в SQL Editor
3. Скопируйте и выполните содержимое файла `supabase-real-push.sql`

### 3. Проверка работы

После деплоя Edge Function и выполнения SQL:

1. **Тест Edge Function**: Откройте в браузере
   ```
   https://pmebqzbjtdmbaoqjfbev.supabase.co/functions/v1/send-push-notification
   ```

2. **Тест SQL функции**: Выполните в SQL Editor
   ```sql
   SELECT test_real_push_notification('c2135ae8-e722-4945-8c21-8db317a950d8');
   ```

3. **Тест в приложении**: Создайте заказ и примите его водителем

### 4. Логи и отладка

Проверьте логи в:
- **Edge Function**: Supabase Dashboard → Functions → Logs
- **SQL функция**: Таблица `push_notification_log`
- **Браузер**: Console (F12)

## Структура решения

### Edge Function (`supabase/functions/send-push-notification/index.ts`)
- Принимает запросы с токеном и данными уведомления
- Отправляет через Firebase FCM API
- Обрабатывает CORS
- Возвращает результат

### SQL функция (`send_real_push_notification`)
- Fallback для Edge Function
- Получает токен из базы данных
- Отправляет через HTTP расширение PostgreSQL
- Логирует результаты

### Клиентский код (`useOrders.ts`)
1. Пытается отправить через Edge Function
2. При ошибке использует SQL функцию
3. Логирует все попытки

## Проверка Firebase Server Key

Убедитесь, что Firebase Server Key корректный:
```
AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU
```

Если ключ неверный, обновите его в:
- `supabase/functions/send-push-notification/index.ts`
- `supabase-real-push.sql`

## Тестирование

### Быстрый тест через SQL
```sql
-- Тест отправки уведомления
SELECT send_real_push_notification(
  'Тест заголовок',
  'Тест сообщение', 
  'c2135ae8-e722-4945-8c21-8db317a950d8'::uuid
);

-- Проверка логов
SELECT * FROM push_notification_log ORDER BY created_at DESC LIMIT 5;
```

### Тест через Edge Function
```bash
curl -X POST \
  https://pmebqzbjtdmbaoqjfbev.supabase.co/functions/v1/send-push-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "token": "DEVICE_TOKEN",
    "title": "Тест",
    "body": "Тестовое уведомление"
  }'
```

## Ожидаемый результат

После исправления:
- ✅ Edge Function работает без CORS ошибок
- ✅ SQL функция как надежный fallback
- ✅ Уведомления доставляются на устройства
- ✅ Логирование всех попыток отправки
- ✅ Автоматические уведомления при изменении статуса заказов