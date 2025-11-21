import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(price)
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'dd MMMM yyyy', { locale: ru })
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), 'dd.MM.yyyy HH:mm', { locale: ru })
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`
  }
  return phone
}

export function calculatePrice(serviceType: 'water_delivery' | 'septic_pumping', quantity: number): number {
  const prices = {
    water_delivery: 1300,
    septic_pumping: 4000
  }
  
  return serviceType === 'water_delivery' ? prices.water_delivery * quantity : prices.septic_pumping
}

export function generateTimeSlots(): string[] {
  const slots = []
  for (let hour = 9; hour <= 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
  }
  return slots
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}