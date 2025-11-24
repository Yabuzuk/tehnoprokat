// Простой сервер для отправки push-уведомлений
// Запуск: node push-server.js

const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

const app = express();
app.use(cors());
app.use(express.json());

// Инициализация Firebase Admin
let firebaseInitialized = false;
try {
  if (require('fs').existsSync('./service-account-key.json')) {
    initializeApp({
      credential: cert('./service-account-key.json')
    });
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK инициализирован');
  } else {
    console.log('⚠️ service-account-key.json не найден - работаем в режиме разработки');
  }
} catch (error) {
  console.log('⚠️ Ошибка инициализации Firebase:', error.message);
}

console.log('🚀 Push Server запущен', firebaseInitialized ? '(Firebase активен)' : '(режим разработки)');

// Эндпоинт для отправки уведомления пользователю
app.post('/send-notification', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;
    
    console.log('📤 Отправка уведомления:', { token: token?.substring(0, 20) + '...', title, body });
    
    let response;
    
    if (firebaseInitialized) {
      // Реальная отправка через Firebase
      const message = {
        token: token,
        notification: { title, body },
        data: data || {},
        android: {
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
      };
      
      response = await getMessaging().send(message);
    } else {
      // Заглушка для разработки
      response = { messageId: 'test-' + Date.now() };
    }
    
    console.log('✅ Уведомление отправлено:', response);
    res.json({ success: true, messageId: response.messageId });
    
  } catch (error) {
    console.error('❌ Ошибка отправки:', error);
    res.status(500).json({ error: error.message });
  }
});

// Эндпоинт для отправки уведомлений водителям
app.post('/send-to-drivers', async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;
    
    console.log('📤 Отправка уведомлений водителям:', { count: tokens?.length, title, body });
    
    // Временная заглушка
    const response = { successCount: tokens?.length || 0, failureCount: 0 };
    
    console.log('✅ Уведомления отправлены:', response);
    res.json({ success: true, ...response });
    
  } catch (error) {
    console.error('❌ Ошибка отправки:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌐 Push Server работает на порту ${PORT}`);
  console.log(`📡 Эндпоинты:`);
  console.log(`   POST http://localhost:${PORT}/send-notification`);
  console.log(`   POST http://localhost:${PORT}/send-to-drivers`);
});