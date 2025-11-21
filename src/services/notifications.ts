// Сервис для работы с push-уведомлениями

export class NotificationService {
  private static instance: NotificationService
  private registration: ServiceWorkerRegistration | null = null
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Инициализация Service Worker
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/tehnoprokat/sw.js')
        console.log('Service Worker зарегистрирован')
      } catch (error) {
        console.error('Ошибка регистрации Service Worker:', error)
      }
    }
  }

  // Запрос разрешения на уведомления
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Браузер не поддерживает уведомления')
      return false
    }

    await this.init()
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // Отправка локального уведомления
  showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/tehnoprokat/water.png',
        badge: '/tehnoprokat/water.png',
        ...options
      })

      // Автозакрытие через 5 секунд
      setTimeout(() => notification.close(), 5000)
      
      return notification
    }
  }

  // Уведомления для разных событий
  notifyOrderCreated(orderType: string) {
    this.showNotification('Заказ создан!', {
      body: `Ваш заказ на ${orderType === 'water_delivery' ? 'доставку воды' : 'откачку септика'} принят в обработку`,
      tag: 'order-created'
    })
  }

  notifyOrderAccepted(driverName: string) {
    this.showNotification('Заказ принят водителем!', {
      body: `Водитель ${driverName} принял ваш заказ`,
      tag: 'order-accepted'
    })
  }

  notifyOrderCompleted() {
    this.showNotification('Заказ выполнен!', {
      body: 'Ваш заказ успешно выполнен. Спасибо за использование нашего сервиса!',
      tag: 'order-completed'
    })
  }

  notifyNewOrder(orderType: string, address: string) {
    this.showNotification('Новый заказ!', {
      body: `${orderType === 'water_delivery' ? 'Доставка воды' : 'Откачка септика'} по адресу: ${address}`,
      tag: 'new-order'
    })
  }

  // Отправка фонового уведомления через Service Worker
  async sendBackgroundNotification(title: string, body: string, tag?: string) {
    if (this.registration && 'showNotification' in this.registration) {
      await this.registration.showNotification(title, {
        body,
        icon: '/tehnoprokat/water.png',
        badge: '/tehnoprokat/water.png',
        tag: tag || 'background',
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'Открыть' },
          { action: 'close', title: 'Закрыть' }
        ]
      })
    }
  }
}

export const notificationService = NotificationService.getInstance()

// Автоинициализация
notificationService.init()