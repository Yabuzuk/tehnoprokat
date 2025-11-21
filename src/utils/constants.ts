export const SERVICES = {
  water_delivery: {
    name: 'Доставка воды',
    icon: '💧',
    price: 1300,
    unit: 'куб.м',
    description: 'Доставка питьевой воды'
  },
  septic_pumping: {
    name: 'Откачка септика',
    icon: '🚽',
    price: 4000,
    unit: 'услуга',
    description: 'Откачка септических ям'
  }
} as const

export const ORDER_STATUSES = {
  pending: { name: 'Ожидает', color: 'bg-yellow-500' },
  accepted: { name: 'Принят', color: 'bg-blue-500' },
  in_progress: { name: 'В пути', color: 'bg-purple-500' },
  completed: { name: 'Выполнен', color: 'bg-green-500' },
  cancelled: { name: 'Отменен', color: 'bg-red-500' }
} as const

export const DRIVER_STATUSES = {
  pending: { name: 'На модерации', color: 'bg-yellow-500' },
  active: { name: 'Активен', color: 'bg-green-500' },
  blocked: { name: 'Заблокирован', color: 'bg-red-500' }
} as const

export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', 
  '17:00', '18:00'
]

export const COMMISSION_RATE = 0.1 // 10% комиссия