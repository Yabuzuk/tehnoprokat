import { useState, useEffect } from 'react'
import { safeNotificationService } from '@/services/notificationsSafe'

export function useNotificationsSafe() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('granted')

  useEffect(() => {
    setPermission('granted')
  }, [])

  const requestPermission = async () => {
    const granted = await safeNotificationService.requestPermission()
    setPermission('granted')
    return granted
  }

  return {
    permission,
    requestPermission,
    showNotification: safeNotificationService.showNotification.bind(safeNotificationService),
    notifyOrderCreated: safeNotificationService.notifyOrderCreated.bind(safeNotificationService),
    notifyOrderAccepted: safeNotificationService.notifyOrderAccepted.bind(safeNotificationService),
    notifyOrderCompleted: safeNotificationService.notifyOrderCompleted.bind(safeNotificationService),
    notifyNewOrder: safeNotificationService.notifyNewOrder.bind(safeNotificationService)
  }
}