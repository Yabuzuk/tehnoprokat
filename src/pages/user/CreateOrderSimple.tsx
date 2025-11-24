import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SERVICES, TIME_SLOTS } from '@/utils/constants'
import { formatPrice, calculatePrice } from '@/utils/helpers'
import { ArrowLeft, MapPin, Calendar, Clock, Calculator } from 'lucide-react'
import type { ServiceType, CreateOrderData } from '@/types'

export function CreateOrderSimple() {
  const { serviceType } = useParams<{ serviceType: ServiceType }>()
  const navigate = useNavigate()

  const [formData, setFormData] = useState<CreateOrderData>({
    service_type: serviceType as ServiceType,
    address: '',
    coordinates: { lat: 62.5434, lng: 114.0156 },
    delivery_date: '',
    delivery_time: '',
    quantity: serviceType === 'water_delivery' ? 1 : 1
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const service = serviceType ? SERVICES[serviceType] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      console.log('Начало отправки формы')
      setIsSubmitting(true)
      
      const newErrors: Record<string, string> = {}
      
      if (!formData.address.trim()) {
        newErrors.address = 'Введите адрес'
      }
      if (!formData.delivery_date) {
        newErrors.delivery_date = 'Выберите дату'
      }
      if (!formData.delivery_time) {
        newErrors.delivery_time = 'Выберите время'
      }
      if (formData.quantity < 1) {
        newErrors.quantity = 'Количество должно быть больше 0'
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsSubmitting(false)
        return
      }
      
      setErrors({})
      
      console.log('Данные формы:', formData)
      
      // Имитируем отправку заказа
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Заказ успешно создан!')
      navigate('/user/dashboard')
      
    } catch (error) {
      console.error('Ошибка в handleSubmit:', error)
      alert('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPrice = calculatePrice(formData.service_type, formData.quantity)

  // Генерируем доступные даты (сегодня + 7 дней)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split('T')[0]
  })

  if (!service) {
    console.log('Сервис не найден, перенаправляем на дашборд')
    navigate('/user/dashboard')
    return null
  }

  console.log('Рендерим CreateOrderSimple для сервиса:', service.name)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/user/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
              {service.name}
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="text-2xl mr-2">{serviceType === 'water_delivery' ? '💧' : '🚽'}</span>
              Оформление заказа (упрощенная версия)
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Адрес */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  Адрес доставки
                </label>
                <Input
                  placeholder="Введите адрес"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  error={errors.address}
                />
              </div>

              {/* Дата */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="h-4 w-4 mr-2" />
                  Дата доставки
                </label>
                <select
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                >
                  <option value="">Выберите дату</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('ru-RU', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </option>
                  ))}
                </select>
                {errors.delivery_date && (
                  <p className="text-sm text-red-600">{errors.delivery_date}</p>
                )}
              </div>

              {/* Время */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Clock className="h-4 w-4 mr-2" />
                  Время доставки
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map(time => (
                    <button
                      key={time}
                      type="button"
                      className={`p-2 text-sm border rounded-md transition-colors ${
                        formData.delivery_time === time
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, delivery_time: time }))}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                {errors.delivery_time && (
                  <p className="text-sm text-red-600">{errors.delivery_time}</p>
                )}
              </div>

              {/* Количество */}
              {serviceType === 'water_delivery' && (
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Calculator className="h-4 w-4 mr-2" />
                    Количество (куб.м)
                  </label>
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                      disabled={formData.quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="text-center w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: Math.min(10, prev.quantity + 1) }))}
                      disabled={formData.quantity >= 10}
                    >
                      +
                    </Button>
                  </div>
                  {errors.quantity && (
                    <p className="text-sm text-red-600">{errors.quantity}</p>
                  )}
                </div>
              )}

              {/* Итого */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Итого к оплате:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                {serviceType === 'water_delivery' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.quantity} куб.м × {formatPrice(service.price)} = {formatPrice(totalPrice)}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
              >
                Оформить заказ (тест)
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}