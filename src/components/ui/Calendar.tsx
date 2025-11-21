import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import type { Order } from '@/types'

interface CalendarProps {
  orders: Order[]
  onDateSelect: (date: string) => void
  selectedDate?: string
}

export function Calendar({ orders, onDateSelect, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days = []
  const current = new Date(startDate)

  while (current <= lastDay || current.getDay() !== 0) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const getOrdersForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return orders.filter(order => order.delivery_date === dateStr)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === month
          const isToday = day.toDateString() === new Date().toDateString()
          const dateStr = day.toISOString().split('T')[0]
          const dayOrders = getOrdersForDate(day)
          const isSelected = selectedDate === dateStr

          return (
            <button
              key={index}
              onClick={() => onDateSelect(dateStr)}
              className={`
                relative p-2 text-sm rounded-md transition-colors
                ${isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}
                ${isToday ? 'bg-blue-100 dark:bg-blue-900' : ''}
                ${isSelected ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${dayOrders.length > 0 ? 'font-semibold' : ''}
              `}
            >
              {day.getDate()}
              {dayOrders.length > 0 && (
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}