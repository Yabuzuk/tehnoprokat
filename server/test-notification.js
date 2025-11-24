// Тестовая отправка уведомления
// Использование: node test-notification.js YOUR_FCM_TOKEN

const token = process.argv[2]

if (!token) {
  console.log('Использование: node test-notification.js YOUR_FCM_TOKEN')
  process.exit(1)
}

fetch('http://localhost:3002/api/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: token,
    title: '🎉 Тестовое уведомление',
    body: 'Push-уведомления работают!',
    data: { test: 'true' }
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Уведомление отправлено:', data)
})
.catch(err => {
  console.error('❌ Ошибка:', err.message)
})
