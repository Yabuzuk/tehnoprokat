import { useEffect, useState } from 'react'
import { notificationService } from '@/services/notifications'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Проверяем текущее разрешение
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission()
    setPermission(Notification.permission)
    return granted
  }

  return {
    permission,
    requestPermission,
    showNotification: notificationService.showNotification.bind(notificationService),
    notifyOrderCreated: notificationService.notifyOrderCreated.bind(notificationService),
    notifyOrderAccepted: notificationService.notifyOrderAccepted.bind(notificationService),
    notifyOrderCompleted: notificationService.notifyOrderCompleted.bind(notificationService),
    notifyNewOrder: notificationService.notifyNewOrder.bind(notificationService)
  }
}