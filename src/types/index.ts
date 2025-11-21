export type UserRole = 'user' | 'driver' | 'admin'

export type ServiceType = 'water_delivery' | 'septic_pumping'

export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

export type DriverStatus = 'pending' | 'active' | 'blocked'

export interface User {
  id: string
  name: string
  phone: string
  created_at: string
}

export interface Driver {
  id: string
  full_name: string
  phone: string
  service_type: ServiceType[]
  car_number: string
  status: DriverStatus
  created_at: string
}

export interface Order {
  id: string
  service_type: ServiceType
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  delivery_date: string
  delivery_time: string
  quantity: number
  price: number
  status: OrderStatus
  user_id: string
  driver_id?: string
  created_at: string
  user?: User
  driver?: Driver
}

export interface AuthState {
  user: User | null
  driver: Driver | null
  role: UserRole | null
  isAuthenticated: boolean
}

export interface CreateOrderData {
  service_type: ServiceType
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  delivery_date: string
  delivery_time: string
  quantity: number
}