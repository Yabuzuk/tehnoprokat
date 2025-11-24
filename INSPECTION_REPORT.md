# 🔍 Отчет инспекции проекта - Push-уведомления

## ❌ Критические проблемы

### 1. **Edge Function не развернута**
- **Проблема**: Edge Function создана локально, но не развернута на Supabase
- **Ошибка в логах**: `POST https://pmebqzbjtdmbaoqjfbev.supabase.co/functions/v1/send-push-notification 400 (Bad Request)`
- **Решение**: Развернуть функцию через Supabase Dashboard

### 2. **Неверный Service Role Key в SQL**
- **Файл**: `supabase-real-push.sql:17`
- **Проблема**: Service Role Key выглядит как заглушка: `'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZWJxemJqdGRtYmFvcWpmYmV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU0NzE5MSwiZXhwIjoyMDQ4MTIzMTkxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'`
- **Решение**: Получить настоящий Service Role Key из Supabase Dashboard

### 3. **CORS блокирует прямые запросы к Firebase**
- **Ошибка**: `Access to fetch at 'https://fcm.googleapis.com/fcm/send' from origin 'https://localhost' has been blocked by CORS`
- **Причина**: Прямые запросы к Firebase FCM API из браузера запрещены
- **Решение**: Использовать только серверные методы (Edge Function или SQL)

### 4. **RLS политики блокируют доступ к push_tokens**
- **Файл**: `push-tokens-table.sql:48-70`
- **Проблема**: RLS использует `auth.uid()`, но в приложении нет Supabase Auth
- **Текущая аутентификация**: Простая через таблицы `users` и `drivers` без auth.users
- **Решение**: Отключить RLS или изменить политики

### 5. **HTTP расширение может быть не установлено**
- **Файл**: `supabase-real-push.sql:183`
- **Проблема**: `CREATE EXTENSION IF NOT EXISTS http;` может не сработать без прав
- **Решение**: Установить через Supabase Dashboard → Database → Extensions

## ⚠️ Средние проблемы

### 6. **Дублирование логики уведомлений**
- **Файлы**: 
  - `src/hooks/useNotifications.ts` - Realtime подписки
  - `src/hooks/useOrders.ts` - Отправка уведомлений
  - `supabase-real-push.sql` - Триггеры БД
- **Проблема**: Уведомления отправляются и из клиента, и из триггеров БД
- **Риск**: Дублирование уведомлений

### 7. **Неправильная обработка ошибок Edge Function**
- **Файл**: `src/hooks/useOrders.ts:149-165`
- **Проблема**: Код пытается использовать SQL fallback, но не проверяет, что Edge Function действительно недоступна
- **Решение**: Улучшить логику fallback

### 8. **Отсутствие логирования в таблице**
- **Проблема**: Таблица `push_notification_log` используется в SQL, но не создана
- **Решение**: Создать таблицу для логов

## ℹ️ Информационные замечания

### 9. **Firebase Server Key корректный**
- ✅ Ключ из `google-services.json` совпадает с ключом в коде
- ✅ API Key: `AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU`
- ✅ Project ID: `newagent-c434a`

### 10. **Токены успешно сохраняются**
- ✅ Логи показывают: `✅ Токен сохранен в Supabase`
- ✅ Token: `c4bf5nmHQzKCEoxAa3rXdx:APA91bF...`

### 11. **Realtime подписки работают**
- ✅ `👤 Статус подписки пользователя: SUBSCRIBED`
- ✅ `🚚 Статус подписки новых заказов: SUBSCRIBED`

## 🔧 План исправления (приоритет)

### Шаг 1: Создать таблицу логов
```sql
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
```

### Шаг 2: Отключить RLS на push_tokens
```sql
ALTER TABLE push_tokens DISABLE ROW LEVEL SECURITY;
```

### Шаг 3: Получить настоящий Service Role Key
1. Открыть Supabase Dashboard
2. Settings → API
3. Скопировать `service_role` key (secret)
4. Обновить в `supabase-real-push.sql`

### Шаг 4: Развернуть Edge Function через Dashboard
1. Открыть Supabase Dashboard → Edge Functions
2. Создать новую функцию `send-push-notification`
3. Скопировать код из `supabase/functions/send-push-notification/index.ts`
4. Deploy

### Шаг 5: Установить HTTP расширение
1. Supabase Dashboard → Database → Extensions
2. Найти `http`
3. Enable

### Шаг 6: Выполнить обновленный SQL скрипт
- Выполнить `supabase-real-push.sql` в SQL Editor

### Шаг 7: Убрать дублирование
- Оставить только триггеры БД для отправки уведомлений
- Убрать отправку из `useOrders.ts`

## 📊 Текущая архитектура

```
Клиент (React)
    ↓
    ├─→ Supabase Client (создание заказа)
    │       ↓
    │   PostgreSQL (INSERT/UPDATE orders)
    │       ↓
    │   Trigger (auto_send_push_notifications)
    │       ↓
    │   SQL Function (send_real_push_notification)
    │       ↓
    │   Edge Function (send-push-notification) ❌ НЕ РАЗВЕРНУТА
    │       ↓
    │   Firebase FCM API
    │       ↓
    │   Устройство пользователя
    │
    └─→ useOrders.ts (sendOrderStatusNotification) ❌ ДУБЛИРОВАНИЕ
            ↓
        Edge Function ❌ 400 ERROR
            ↓
        Firebase API ❌ CORS ERROR
```

## 🎯 Рекомендуемая архитектура

```
Клиент (React)
    ↓
Supabase Client (создание заказа)
    ↓
PostgreSQL (INSERT/UPDATE orders)
    ↓
Trigger (auto_send_push_notifications)
    ↓
Edge Function (send-push-notification) ✅
    ↓
Firebase FCM API
    ↓
Устройство пользователя
```

## 🚀 Быстрое решение (без Edge Function)

Если Edge Function не получается развернуть, можно использовать только SQL:

1. Установить HTTP расширение
2. Получить Service Role Key
3. Обновить SQL функцию
4. Убрать клиентскую отправку уведомлений

Это будет работать, но менее надежно, чем Edge Function.