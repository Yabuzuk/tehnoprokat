import { supabase } from './supabase'

const PUSH_SERVER_URL = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:3002'

export const fcmService = {
  // Сохранить FCM токен в базу
  async saveToken(userId: string, token: string, userType: 'user' | 'driver') {
    const table = userType === 'user' ? 'users' : 'drivers'
    const { error } = await supabase
      .from(table)
      .update({ fcm_token: token })
      .eq('id', userId)
    
    if (error) console.error('Error saving FCM token:', error)
  },

  // Отправить уведомление через сервер
  async sendNotification(token: string, title: string, body: string, data?: any) {
    try {
      const response = await fetch(`${PUSH_SERVER_URL}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, title, body, data })
      })
      return await response.json()
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }
}
