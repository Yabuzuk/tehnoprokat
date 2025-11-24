// Firebase Cloud Functions для отправки push-уведомлений
// Этот файл нужно развернуть на Firebase Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Функция для отправки уведомления пользователю
exports.sendNotificationToUser = functions.https.onCall(async (data, context) => {
  const { token, title, body, data: notificationData } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Token is required');
  }

  const message = {
    token: token,
    notification: {
      title: title,
      body: body,
    },
    data: notificationData || {},
    android: {
      notification: {
        sound: 'default',
        priority: 'high',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

// Функция для отправки уведомлений всем водителям
exports.sendNotificationToDrivers = functions.https.onCall(async (data, context) => {
  const { tokens, title, body, data: notificationData } = data;

  if (!tokens || tokens.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Tokens array is required');
  }

  const message = {
    tokens: tokens,
    notification: {
      title: title,
      body: body,
    },
    data: notificationData || {},
    android: {
      notification: {
        sound: 'default',
        priority: 'high',
      },
    },
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log('Successfully sent messages:', response);
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount 
    };
  } catch (error) {
    console.error('Error sending messages:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notifications');
  }
});