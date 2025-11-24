// Скрипт для проверки Firebase Server Key
const FIREBASE_SERVER_KEY = 'AIzaSyAH6yQWf32M41oLhscegD8HTvrGlbjgPRU'
const TEST_TOKEN = 'c4bf5nmHQzKCEoxAa3rXdx:APA91bFJtEEpjU-2ikaP_VMUDR1MBzAYcLI48-nL80Zr2z4GlSloSVUKit_o0BRZ8c-DKuhn9lV3ExRWxWUoNjlSc1rK-9DylaWmlIaYgeFYxTfjkSiJW2k'

async function testFirebaseKey() {
  try {
    console.log('🔑 Тестирование Firebase Server Key...')
    
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`
      },
      body: JSON.stringify({
        to: TEST_TOKEN,
        notification: {
          title: 'Тест ключа',
          body: 'Проверка Firebase Server Key'
        }
      })
    })
    
    const result = await response.json()
    
    console.log('📊 Статус ответа:', response.status)
    console.log('📋 Результат:', result)
    
    if (response.ok && result.success === 1) {
      console.log('✅ Firebase Server Key работает!')
    } else if (response.status === 401) {
      console.log('❌ Firebase Server Key неверный (401 Unauthorized)')
    } else if (response.status === 400 && result.error === 'InvalidRegistration') {
      console.log('⚠️ Ключ правильный, но токен устройства неверный')
    } else {
      console.log('❌ Ошибка:', result)
    }
    
  } catch (error) {
    console.error('❌ Ошибка сети:', error)
  }
}

// Запуск в Node.js: node check-firebase-key.js
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch')
  testFirebaseKey()
} else {
  // Browser environment
  testFirebaseKey()
}