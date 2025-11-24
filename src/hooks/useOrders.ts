import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ordersApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useOrderStore } from '@/stores/orderStore'
import { supabase, SUPABASE_ANON_KEY } from '@/services/supabase'
import { pushNotifications } from '@/services/pushNotifications'
import type { CreateOrderData } from '@/types'

export function useUserOrders() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  // Слушаем события обновления кэша
  useEffect(() => {
    const handleInvalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
    
    window.addEventListener('invalidateOrders', handleInvalidate)
    return () => window.removeEventListener('invalidateOrders', handleInvalidate)
  }, [queryClient])
  
  return useQuery({
    queryKey: ['orders', 'user', user?.id],
    queryFn: () => ordersApi.getUserOrders(user!.id),
    enabled: !!user?.id,
    staleTime: 30000,
  })
}

export function useDriverOrders() {
  const { driver } = useAuthStore()
  
  return useQuery({
    queryKey: ['orders', 'driver', driver?.id],
    queryFn: () => ordersApi.getDriverOrders(driver!.id),
    enabled: !!driver?.id,
    staleTime: 30000,
  })
}

export function useAvailableOrders() {
  const { driver } = useAuthStore()
  
  return useQuery({
    queryKey: ['orders', 'available', driver?.service_type],
    queryFn: () => ordersApi.getAvailableOrders(driver!.service_type),
    enabled: !!driver?.service_type,
    refetchInterval: 10000, // Обновляем каждые 10 секунд
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { clearCurrentOrder } = useOrderStore()
  
  return useMutation({
    mutationFn: (orderData: CreateOrderData) => 
      ordersApi.createOrder({ ...orderData, user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useAcceptOrder() {
  const queryClient = useQueryClient()
  const { driver } = useAuthStore()
  
  return useMutation({
    mutationFn: (orderId: string) => 
      ordersApi.acceptOrder(orderId, driver!.id),
    onSuccess: (order) => {
      console.log('🎯 ЗАКАЗ ПРИНЯТ!')
      // Отправляем уведомление пользователю
      pushNotifications.notifyUserStatusChange(order.user_id, order.id, 'accepted')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersApi.updateOrderStatus(orderId, status),
    onSuccess: (order, { status }) => {
      console.log('🔄 СТАТУС ИЗМЕНЕН!', { status })
      // Отправляем уведомление пользователю
      pushNotifications.notifyUserStatusChange(order.user_id, order.id, status)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// Уведомления теперь отправляются автоматически через триггеры БД
// Эта функция больше не используется, но оставлена для совместимости