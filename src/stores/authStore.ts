import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, User, Driver, UserRole } from '@/types'

interface AuthStore extends AuthState {
  setUser: (user: User) => void
  setDriver: (driver: Driver) => void
  setRole: (role: UserRole) => void
  logout: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      driver: null,
      role: null,
      isAuthenticated: false,
      
      setUser: (user: User) => set({ 
        user, 
        role: 'user', 
        isAuthenticated: true,
        driver: null 
      }),
      
      setDriver: (driver: Driver) => set({ 
        driver, 
        role: 'driver', 
        isAuthenticated: true,
        user: null 
      }),
      
      setRole: (role: UserRole) => set({ role }),
      
      logout: () => set({ 
        user: null, 
        driver: null, 
        role: null, 
        isAuthenticated: false 
      }),
      
      clearAuth: () => set({ 
        user: null, 
        driver: null, 
        role: null, 
        isAuthenticated: false 
      })
    }),
    {
      name: 'auth-storage',
    }
  )
)