// Тест отправки push-уведомления
const testToken = 'ei4z2b1rRDq8iikL3-ZLmk:APA91bGNBF_J9xJwcJJXmS8UTWT07H_vZui7K5GOGci4p23CZ59xTqPXVjQyU_Nq9WfktEUw8Bh52LrxFono4PoiqFNWojcS2jUSh-KznAALgUXbtIX8WvE'

fetch('http://localhost:3002/api/send-notification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: testToken,
    title: '🧪 Тестовое уведомление',
    body: 'Проверка работы push-уведомлений',
    data: { test: 'true' }
  })
})
.then(res => res.json())
.then(data => console.log('✅ Результат:', data))
.catch(err => console.error('❌ Ошибка:', err))