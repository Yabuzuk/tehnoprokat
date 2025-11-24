import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { isValidPhone } from '@/utils/helpers'
import { ArrowLeft, Truck } from 'lucide-react'
import type { ServiceType } from '@/types'

export function DriverAuth() {
  const navigate = useNavigate()
  const { setDriver } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    phone: '',
    full_name: '',
    car_number: '',
    service_type: [] as ServiceType[]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loginMutation = useMutation({
    mutationFn: () => authApi.loginDriver(formData.phone),
    onSuccess: (driver) => {
      if (driver) {
        setDriver(driver)
        navigate('/driver/dashboard')
      } else {
        setErrors({ phone: 'Водитель не найден или не активирован' })
      }
    }
  })

  const registerMutation = useMutation({
    mutationFn: () => authApi.registerDriver({
      full_name: formData.full_name,
      phone: formData.phone,
      car_number: formData.car_number,
      service_type: formData.service_type
    }),
    onSuccess: () => {
      alert('Заявка отправлена на модерацию. Ожидайте активации.')
      navigate('/')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Введите номер телефона'
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Неверный формат номера телефона'
    }
    
    if (!isLogin) {
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Введите ФИО'
      }
      if (!formData.car_number.trim()) {
        newErrors.car_number = 'Введите номер автомобиля'
      }
      if (formData.service_type.length === 0) {
        newErrors.service_type = 'Выберите тип услуг'
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    
    if (isLogin) {
      loginMutation.mutate()
    } else {
      registerMutation.mutate()
    }
  }

  const toggleServiceType = (type: ServiceType) => {
    setFormData(prev => ({
      ...prev,
      service_type: prev.service_type.includes(type)
        ? prev.service_type.filter(t => t !== type)
        : [...prev.service_type, type]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-500 p-3 rounded-lg w-fit mb-4">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <CardTitle>{isLogin ? 'Вход для водителя' : 'Регистрация водителя'}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? 'Войдите в систему' : 'Подайте заявку на регистрацию'}
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PhoneInput
                label="Номер телефона"
                placeholder="(999) 123-45-67"
                value={formData.phone}
                onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                error={errors.phone}
              />
              
              {!isLogin && (
                <>
                  <Input
                    label="ФИО"
                    placeholder="Иванов Иван Иванович"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    error={errors.full_name}
                  />
                  
                  <Input
                    label="Номер автомобиля"
                    placeholder="А123БВ123"
                    value={formData.car_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, car_number: e.target.value }))}
                    error={errors.car_number}
                  />
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Тип услуг
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.service_type.includes('water_delivery')}
                          onChange={() => toggleServiceType('water_delivery')}
                          className="rounded border-gray-300"
                        />
                        <span>💧 Доставка воды</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.service_type.includes('septic_pumping')}
                          onChange={() => toggleServiceType('septic_pumping')}
                          className="rounded border-gray-300"
                        />
                        <span>🚽 Откачка септика</span>
                      </label>
                    </div>
                    {errors.service_type && (
                      <p className="text-sm text-red-600">{errors.service_type}</p>
                    )}
                  </div>
                </>
              )}
              
              <Button
                type="submit"
                className="w-full"
                isLoading={loginMutation.isPending || registerMutation.isPending}
              >
                {isLogin ? 'Войти' : 'Подать заявку'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}