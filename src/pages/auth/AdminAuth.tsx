import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'
import { ArrowLeft, Shield } from 'lucide-react'

export function AdminAuth() {
  const navigate = useNavigate()
  const { setRole } = useAuthStore()
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Простая проверка админских данных (в реальном проекте должна быть через API)
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      // Создаем фиктивного админа
      const adminUser = {
        id: 'admin-id',
        name: 'Администратор',
        phone: '+79999999999',
        created_at: new Date().toISOString()
      }
      useAuthStore.getState().setUser(adminUser)
      useAuthStore.getState().setRole('admin')
      navigate('/admin/dashboard')
    } else {
      setError('Неверные учетные данные')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
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
            <div className="mx-auto bg-purple-500 p-3 rounded-lg w-fit mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Вход для администратора</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Введите учетные данные администратора
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Имя пользователя"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="admin"
              />
              
              <Input
                label="Пароль"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
              />
              
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Войти
              </Button>
            </form>
            
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Тестовые данные:</strong><br />
                Логин: admin<br />
                Пароль: admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}