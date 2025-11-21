import { create } from 'zustand'
import type { Order, CreateOrderData } from '@/types'

interface OrderStore {
  currentOrder: CreateOrderData | null
  orders: Order[]
  isLoading: boolean
  
  setCurrentOrder: (order: CreateOrderData | null) => void
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, updates: Partial<Order>) => void
  setLoading: (loading: boolean) => void
  clearCurrentOrder: () => void
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  currentOrder: null,
  orders: [],
  isLoading: false,
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  
  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) => set((state) => ({ 
    orders: [order, ...state.orders] 
  })),
  
  updateOrder: (id, updates) => set((state) => ({
    orders: state.orders.map(order => 
      order.id === id ? { ...order, ...updates } : order
    )
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  clearCurrentOrder: () => set({ currentOrder: null })
}))