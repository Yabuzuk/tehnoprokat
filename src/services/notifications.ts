import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

export interface NotificationPayload {
  title: string
  body: string
  data?: any
}

class NotificationService {
  private isInitialized = false

  async initialize() {
    console.log('🚀 Инициализация уведомлений...', {
      isNative: Capacitor.isNativePlatform(),
      isInitialized: this.isInitialized
    })
    
    if (!Capacitor.isNativePlatform()) {
      console.log('⚠️ Не мобильная платформа')
      return
    }
    
    if (this.isInitialized) {
      console.log('🔄 Повторная регистрация для обновления тоCaена')
      await PushNotifications.register()
      return
    }

    try {
      // Запрашиваем разрешение на уведомления
      console.log('🔔 Запрос разрешений...')
      const permission = await PushNotifications.requestPermissions()
      console.log('🔔 Разрешения:', permission)
      
      if (permission.receive === 'granted') {
        // Регистрируем устройство для push-уведомлений
        console.log('📱 Регистрация устройства...')
        await PushNotifications.register()
        
        // Удаляем старые слушатели
        await PushNotifications.removeAllListeners()
        
        // Слушаем события
        PushNotifications.addListener('registration', (token) => {
          console.log('✅ Push registration success, token: ' + token.value)
          this.saveToken(token.value)
        })

        PushNotifications.addListener('registrationError', (error) => {
          console.error('❌ Error on registration: ' + JSON.stringify(error))
        })

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ', notification)
          this.handleNotificationReceived(notification)
        })

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', notification)
          this.handleNotificationAction(notification)
        })

        this.isInitialized = true
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error)
    }
  }

  private async saveToken(token: string) {
    // Сохраняем токен в localStorage
    localStorage.setItem('push_token', token)
    console.log('💾 Сохранение токена:', token.substring(0, 20) + '...')
    
    // Отправляем сообщение для сохранения токена
    window.dispatchEvent(new CustomEvent('pushTokenReceived', { 
      detail: { token } 
    }))
    
    console.log('📤 Токен отправлен для сохранения')
  }

  private handleNotificationReceived(notification: any) {
    // Показываем локальное уведомление если приложение активно
    if (notification.title && notification.body) {
      this.showLocalNotification(notification.title, notification.body)
    }
  }

  private handleNotificationAction(notification: any) {
    // Обрабатываем нажатие на уведомление
    const data = notification.notification.data
    if (data?.route) {
      // Перенаправляем на нужную страницу
      window.location.hash = data.route
    }
  }

  private async showMobileNotification(payload: NotificationPayload) {
    try {
      // Запрашиваем разрешения на локальные уведомления
      const permission = await LocalNotifications.requestPermissions()
      
      if (permission.display === 'granted') {
        // Показываем локальное уведомление
        await LocalNotifications.schedule({
          notifications: [
            {
              title: payload.title,
              body: payload.body,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: new Date(Date.now() + 1000) }, // Через 1 секунду
              sound: 'default',
              attachments: undefined,
              actionTypeId: '',
              extra: payload.data
            }
          ]
        })
        console.log('✅ Локальное уведомление запланировано')
      } else {
        console.log('⚠️ Нет разрешения на локальные уведомления')
      }
    } catch (error) {
      console.error('❌ Ошибка показа локального уведомления:', error)
    }
  }

  private showLocalNotification(title: string, body: string) {
    // Показываем браузерное уведомление для веб-версии
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }

  // Локальные уведомления для тестирования
  async showTestNotification(payload: NotificationPayload) {
    console.log('📢 Показ уведомления:', payload)
    
    if (Capacitor.isNativePlatform()) {
      // На мобильном показываем через Capacitor
      console.log('📱 Mobile notification:', payload)
      
      // Показываем локальное уведомление
      await this.showMobileNotification(payload)
    } else {
      // В браузере показываем обычное уведомление
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(payload.title, { body: payload.body })
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            new Notification(payload.title, { body: payload.body })
          }
        }
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('push_token')
  }
}

export const notificationService = new NotificationService()