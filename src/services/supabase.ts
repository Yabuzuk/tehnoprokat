import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Экспорт для серверных функций
export const SUPABASE_URL = supabaseUrl
export const SUPABASE_ANON_KEY = supabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          phone: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          created_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          full_name: string
          phone: string
          service_type: string[]
          car_number: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone: string
          service_type: string[]
          car_number: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          service_type?: string[]
          car_number?: string
          status?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          service_type: string
          address: string
          coordinates: any
          delivery_date: string
          delivery_time: string
          quantity: number
          price: number
          status: string
          user_id: string
          driver_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          service_type: string
          address: string
          coordinates: any
          delivery_date: string
          delivery_time: string
          quantity: number
          price: number
          status?: string
          user_id: string
          driver_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          service_type?: string
          address?: string
          coordinates?: any
          delivery_date?: string
          delivery_time?: string
          quantity?: number
          price?: number
          status?: string
          user_id?: string
          driver_id?: string | null
          created_at?: string
        }
      }
    }
  }
}