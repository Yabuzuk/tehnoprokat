const express = require('express')
const admin = require('firebase-admin')
const cors = require('cors')

// Инициализация Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "newagent-c434a",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com"
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const app = express()
app.use(cors())
app.use(express.json())

// Корневой маршрут для проверки статуса
app.get('/', (req, res) => {
  res.json({ 
    status: 'Push notification server is running',
    endpoints: [
      'POST /api/send-notification',
      'POST /api/send-notification-multi',
      'POST /api/webhook/order-status'
    ]
  })
})

// Отправка push-уведомления
app.post('/api/send-notification', async (req, res) => {
  try {
    const { token, title, body, data } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    const message = {
      notification: {
        title: title || 'Уведомление',
        body: body || 'У вас новое уведомление'
      },
      data: data || {},
      token: token,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'orders'
        }
      }
    }

    const response = await admin.messaging().send(message)
    console.log('Notification sent:', response)
    
    res.json({ success: true, messageId: response })
  } catch (error) {
    console.error('Error sending notification:', error)
    res.status(500).json({ error: error.message })
  }
})

// Отправка уведомлений нескольким пользователям
app.post('/api/send-notification-multi', async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'Tokens array is required' })
    }

    const message = {
      notification: {
        title: title || 'Уведомление',
        body: body || 'У вас новое уведомление'
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'orders'
        }
      }
    }

    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      ...message
    })

    console.log(`${response.successCount} notifications sent successfully`)
    
    res.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    res.status(500).json({ error: error.message })
  }
})

// Webhook для Supabase (отправка уведомлений при изменении статуса заказа)
app.post('/api/webhook/order-status', async (req, res) => {
  try {
    const { order_id, status, user_token, driver_token } = req.body

    const statusMessages = {
      accepted: { title: '✅ Заказ принят', body: 'Водитель принял ваш заказ' },
      in_progress: { title: '🚚 Водитель в пути', body: 'Водитель направляется к вам' },
      completed: { title: '✨ Заказ выполнен', body: 'Спасибо за использование нашего сервиса!' },
      cancelled: { title: '❌ Заказ отменен', body: 'Ваш заказ был отменен' }
    }

    const notification = statusMessages[status]
    
    if (user_token && notification) {
      await admin.messaging().send({
        notification,
        data: { order_id: String(order_id), status },
        token: user_token,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'orders'
          }
        }
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: error.message })
  }
})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Push notification server running on port ${PORT}`)
})
