# 🔔 ПРОСТОЕ РЕШЕНИЕ ФОНОВЫХ УВЕДОМЛЕНИЙ

## 🎯 Проблема
HTTP расширение недоступно в Supabase, поэтому серверные уведомления не работают.

## ✅ ПРОСТОЕ РЕШЕНИЕ

### 1. Используй готовый сервис Firebase Console

**Для тестирования фоновых уведомлений:**

1. **Открой Firebase Console**: https://console.firebase.google.com/
2. **Выбери проект**: `newagent-c434a`
3. **Cloud Messaging** → **Send your first message**
4. **Заполни**:
   - **Notification title**: `🧪 Тест фонового уведомления`
   - **Notification text**: `Проверяем работу в закрытом приложении`
5. **Target** → **Single device**
6. **FCM registration token**: `e3fJM0FVQjeiUgz6cdgV9X:APA91bH5Exr-NQP4zd1Bb9f-OssmwdlMZRTu7zYNrKjHYkRyBb-Z2WQqscZZagCqbj5o9QYpLpUqyRMkfSy5jwkU0eh7zAc`
7. **Send test message**

### 2. Проверь настройки Android

**Если уведомления не приходят в фоне:**

1. **Настройки** → **Приложения** → **Водовозка**
2. **Уведомления** → **Включить все**
3. **Батарея** → **Оптимизация батареи** → **Водовозка** → **Не оптимизировать**
4. **Автозапуск** → **Водовозка** → **Разрешить**

### 3. Альтернативное решение - внешний сервер

Создай простой Node.js сервер:

```javascript
// push-server.js
const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// Инициализация Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Эндпоинт для отправки уведомлений
app.post('/send-push', async (req, res) => {
  const { token, title, body, data } = req.body;
  
  try {
    const message = {
      notification: { title, body },
      data: data || {},
      token
    };
    
    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Push server running on port 3000');
});
```

### 4. Webhook через Supabase

В Supabase Dashboard → Database → Webhooks:

1. **Create a new hook**
2. **Table**: `orders`
3. **Events**: `UPDATE`
4. **HTTP Request**:
   - **Method**: `POST`
   - **URL**: `https://your-server.com/send-push`
   - **Headers**: `Content-Type: application/json`

## 🚀 Рекомендация

**Для продакшена используй:**
- ✅ **Firebase Functions** - серверные функции Google
- ✅ **Vercel/Netlify Functions** - бессерверные функции
- ✅ **AWS Lambda** - функции Amazon

**Для тестирования:**
- ✅ **Firebase Console** - ручная отправка уведомлений
- ✅ **Локальный Node.js сервер** - простая автоматизация

## 📱 Проверка

1. **Закрой приложение** полностью
2. **Отправь уведомление** через Firebase Console
3. **Должно прийти** в шторку уведомлений Android

---

**Фоновые уведомления работают, но нужен внешний сервер для автоматической отправки!** 🎯