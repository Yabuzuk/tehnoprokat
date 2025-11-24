// Безопасный сервис уведомлений для Capacitor

export class SafeNotificationService {
  private static instance: SafeNotificationService
  
  static getInstance(): SafeNotificationService {
    if (!SafeNotificationService.instance) {
      SafeNotificationService.instance = new SafeNotificationService()
    }
    return SafeNotificationService.instance
  }

  async init() {
    // Ничего не делаем в Capacitor
    console.log('SafeNotificationService initialized')
  }

  async requestPermission(): Promise<boolean> {
    console.log('Permission requested (safe mode)')
    return true
  }

  showNotification(title: string, options?: any) {
    console.log(`Notification: ${title}`, options?.body || '')
    return null
  }

  notifyOrderCreated(orderType: string) {
    console.log(`Order created: ${orderType}`)
  }

  notifyOrderAccepted(driverName: string) {
    console.log(`Order accepted by: ${driverName}`)
  }

  notifyOrderCompleted() {
    console.log('Order completed')
  }

  notifyNewOrder(orderType: string, address: string) {
    console.log(`New order: ${orderType} at ${address}`)
  }

  async sendBackgroundNotification(title: string, body: string, tag?: string) {
    console.log(`Background notification: ${title} - ${body}`)
  }
}

export const safeNotificationService = SafeNotificationService.getInstance()