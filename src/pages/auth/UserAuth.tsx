import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { isValidPhone } from '@/utils/helpers'
import { ArrowLeft, User } from 'lucide-react'

export function UserAuth() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ phone?: string; name?: string }>({})

  const loginMutation = useMutation({
    mutationFn: () => authApi.loginUser(phone, name),
    onSuccess: (user) => {
      setUser(user)
      navigate('/user/dashboard')
    },
    onError: (error) => {
      console.error('Login error:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: { phone?: string; name?: string } = {}
    
    if (!phone.trim()) {
      newErrors.phone = 'Введите номер телефона'
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'Неверный формат номера телефона'
    }
    
    if (!name.trim()) {
      newErrors.name = 'Введите ваше имя'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    loginMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
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
            <div className="mx-auto bg-blue-500 p-3 rounded-lg w-fit mb-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Вход для заказчика</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Введите ваши данные для входа
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Номер телефона"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
              />
              
              <Input
                label="Ваше имя"
                placeholder="Иван Иванов"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              
              <Button
                type="submit"
                className="w-full"
                isLoading={loginMutation.isPending}
              >
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}