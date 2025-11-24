import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { notificationService } from '@/services/notifications'
import { supabase } from '@/services/supabase'

export function useNotifications() {
  const { isAuthenticated, role, user, driver } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    console.log('🔔 Настройка уведомлений для:', { role, userId: user?.id, driverId: driver?.id })
    
    // Инициализируем уведомления
    notificationService.initialize()
    
    // Слушаем получение push-токена
    const handleTokenReceived = async (event: Event) => {
      const customEvent = event as CustomEvent
      const { token } = customEvent.detail
      await savePushToken(token)
    }
    
    window.addEventListener('pushTokenReceived', handleTokenReceived)
    
    // Подписываемся на изменения заказов в реальном времени
    const setupRealtimeSubscriptions = () => {
      if (role === 'user' && user) {
        // Пользователь: слушаем изменения своих заказов
        console.log('👤 Подписка на заказы пользователя:', user.id)
        
        const userOrdersSubscription = supabase
          .channel('user_orders')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('🔔 Получено обновление заказа:', payload)
              const order = payload.new as any
              handleOrderStatusChange(order)
              // Обновляем кэш через событие
              window.dispatchEvent(new CustomEvent('invalidateOrders'))
            }
          )
          .subscribe((status) => {
            console.log('👤 Статус подписки пользователя:', status)
          })

        return () => {
          userOrdersSubscription.unsubscribe()
        }
      }

      if (role === 'driver' && driver) {
        // Водитель: слушаем новые заказы и изменения принятых заказов
        console.log('🚚 Подписка на новые заказы для водителя:', driver.id, driver.service_type)
        
        const newOrdersSubscription = supabase
          .channel('new_orders')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'orders',
              filter: `service_type=in.(${driver.service_type.join(',')})`
            },
            (payload) => {
              console.log('🔥 Новый заказ получен:', payload)
              const order = payload.new as any
              handleNewOrder(order)
              // Обновляем кэш через событие
              window.dispatchEvent(new CustomEvent('invalidateOrders'))
            }
          )
          .subscribe((status) => {
            console.log('🚚 Статус подписки новых заказов:', status)
          })

        const driverOrdersSubscription = supabase
          .channel('driver_orders')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `driver_id=eq.${driver.id}`
            },
            (payload) => {
              const order = payload.new as any
              handleDriverOrderUpdate(order)
              // Обновляем кэш через событие
              window.dispatchEvent(new CustomEvent('invalidateOrders'))
            }
          )
          .subscribe()

        return () => {
          newOrdersSubscription.unsubscribe()
          driverOrdersSubscription.unsubscribe()
        }
      }
    }

    const cleanup = setupRealtimeSubscriptions()
    
    // Добавляем резервный polling на случай проблем с Realtime
    const pollInterval = setInterval(() => {
      if (role === 'user' && user) {
        // Проверяем обновления заказов каждые 10 секунд
        checkForOrderUpdates(user.id)
      }
    }, 10000)
    
    return () => {
      window.removeEventListener('pushTokenReceived', handleTokenReceived)
      if (cleanup) cleanup()
      clearInterval(pollInterval)
    }
  }, [isAuthenticated, role, user, driver])

  const handleOrderStatusChange = (order: any) => {
    console.log('🔔 Статус заказа изменен:', order)
    
    const statusMessages = {
      accepted: 'Ваш заказ принят водителем',
      in_progress: 'Водитель выехал к вам',
      completed: 'Заказ выполнен',
      cancelled: 'Заказ отменен'
    }

    const message = statusMessages[order.status as keyof typeof statusMessages]
    if (message) {
      notificationService.showTestNotification({
        title: 'Статус заказа изменен',
        body: message,
        data: { route: '/user/orders', orderId: order.id }
      })
    }
  }

  const handleNewOrder = (order: any) => {
    console.log('🔥 Новый заказ получен:', order)
    
    const serviceNames = {
      water_delivery: 'Доставка воды',
      septic_pumping: 'Откачка септика'
    }

    notificationService.showTestNotification({
      title: 'Новый заказ!',
      body: `${serviceNames[order.service_type as keyof typeof serviceNames]} - ${order.address}`,
      data: { route: '/driver/dashboard', orderId: order.id }
    })
  }

  const handleDriverOrderUpdate = (order: any) => {
    // Уведомления для водителя о изменениях в его заказах
    if (order.status === 'cancelled') {
      notificationService.showTestNotification({
        title: 'Заказ отменен',
        body: 'Клиент отменил заказ',
        data: { route: '/driver/dashboard' }
      })
    }
  }

  // Функция проверки обновлений заказов
  const checkForOrderUpdates = async (userId: string) => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5)
      
      // Проверяем, есть ли обновления за последние 30 секунд
      const recentUpdates = orders?.filter(order => {
        const updatedAt = new Date(order.updated_at)
        const now = new Date()
        return (now.getTime() - updatedAt.getTime()) < 30000 // 30 секунд
      })
      
      recentUpdates?.forEach(order => {
        console.log('🔄 Обнаружено обновление заказа:', order)
        handleOrderStatusChange(order)
      })
    } catch (error) {
      console.error('❌ Ошибка проверки обновлений:', error)
    }
  }

  // Функция сохранения push-токена в Supabase
  const savePushToken = async (token: string) => {
    try {
      console.log('💾 Сохранение токена в Supabase...', { role, userId: user?.id, driverId: driver?.id, token: token.substring(0, 20) + '...' })
      
      if (role === 'user' && user) {
        const { error } = await supabase
          .from('users')
          .update({ fcm_token: token })
          .eq('id', user.id)
        
        if (error) {
          console.error('❌ Ошибка сохранения токена пользователя:', error)
        } else {
          console.log('✅ Токен пользователя сохранен')
        }
      }
      
      if (role === 'driver' && driver) {
        const { error } = await supabase
          .from('drivers')
          .update({ fcm_token: token })
          .eq('id', driver.id)
        
        if (error) {
          console.error('❌ Ошибка сохранения токена водителя:', error)
        } else {
          console.log('✅ Токен водителя сохранен')
        }
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения токена:', error)
    }
  }

  return {
    showTestNotification: notificationService.showTestNotification.bind(notificationService)
  }
}