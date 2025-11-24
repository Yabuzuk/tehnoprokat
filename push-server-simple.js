const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Инициализация Firebase Admin SDK
const serviceAccount = {
  "type": "service_account",
  "project_id": "newagent-c434a",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@newagent-c434a.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40newagent-c434a.iam.gserviceaccount.com"
};

// Временно используем простую заглушку для тестирования
let firebaseInitialized = false;

try {
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount)
  // });
  // firebaseInitialized = true;
  console.log('🔥 Firebase Admin SDK готов (заглушка)');
} catch (error) {
  console.log('⚠️ Firebase Admin SDK не настроен, используем заглушку');
}

// Эндпоинт для отправки уведомлений
app.post('/send-notification', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        error: 'Missing required fields: token, title, body'
      });
    }

    console.log('📤 Получен запрос на отправку уведомления:');
    console.log('  Token:', token.substring(0, 20) + '...');
    console.log('  Title:', title);
    console.log('  Body:', body);

    if (firebaseInitialized) {
      // Реальная отправка через Firebase Admin SDK
      const message = {
        notification: {
          title,
          body
        },
        data: data || {},
        token
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Уведомление отправлено:', response);

      res.json({
        success: true,
        messageId: response,
        message: 'Push notification sent successfully'
      });
    } else {
      // Заглушка для тестирования
      console.log('🧪 ТЕСТОВЫЙ РЕЖИМ: уведомление "отправлено"');
      
      res.json({
        success: true,
        messageId: 'test-' + Date.now(),
        message: 'Push notification sent successfully (test mode)',
        debug: {
          title,
          body,
          tokenPrefix: token.substring(0, 20) + '...',
          note: 'Это тестовый режим. Настройте Firebase Admin SDK для реальной отправки.'
        }
      });
    }

  } catch (error) {
    console.error('❌ Ошибка отправки уведомления:', error);
    
    res.status(500).json({
      error: 'Failed to send push notification',
      details: error.message
    });
  }
});

// Проверка здоровья сервера
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    firebase: firebaseInitialized ? 'connected' : 'test-mode',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Push-сервер запущен на порту ${PORT}`);
  console.log(`📡 Эндпоинт: http://localhost:${PORT}/send-notification`);
  console.log(`💚 Проверка: http://localhost:${PORT}/health`);
});