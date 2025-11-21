import { supabase } from './supabase'
import type { User, Driver, Order, CreateOrderData, ServiceType } from '@/types'

// Auth API
export const authApi = {
  async loginUser(phone: string, name: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .upsert({ phone, name }, { onConflict: 'phone' })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async registerDriver(driverData: Omit<Driver, 'id' | 'created_at' | 'status'>): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .insert({ ...driverData, status: 'pending' })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async loginDriver(phone: string): Promise<Driver | null> {
    const { data, error } = await supabase
      .from('drivers')
      .select()
      .eq('phone', phone)
      .eq('status', 'active')
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// Orders API
export const ordersApi = {
  async createOrder(orderData: CreateOrderData & { user_id: string }): Promise<Order> {
    const price = orderData.service_type === 'water_delivery' 
      ? 1300 * orderData.quantity 
      : 4000
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        price,
        status: 'pending'
      })
      .select(`
        *,
        user:users(*),
        driver:drivers(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(*),
        driver:drivers(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getDriverOrders(driverId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(*),
        driver:drivers(*)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getAvailableOrders(serviceTypes: ServiceType[]): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(*),
        driver:drivers(*)
      `)
      .eq('status', 'pending')
      .in('service_type', serviceTypes)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async acceptOrder(orderId: string, driverId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'accepted', 
        driver_id: driverId 
      })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select(`
        *,
        user:users(*),
        driver:drivers(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select(`
        *,
        user:users(*),
        driver:drivers(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async cancelOrder(orderId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .select(`
        *,
        user:users(*),
        driver:drivers(*)
      `)
      .single()
    
    if (error) throw error
    return data
  }
}

// Admin API
export const adminApi = {
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(*),
        driver:drivers(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getAllDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select()
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async updateDriverStatus(driverId: string, status: string): Promise<Driver> {
    const { data, error } = await supabase
      .from('drivers')
      .update({ status })
      .eq('id', driverId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}