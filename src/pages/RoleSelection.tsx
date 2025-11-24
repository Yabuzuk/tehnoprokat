import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Truck, User, Shield } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export function RoleSelection() {
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(`/${role}/dashboard`, { replace: true })
    }
  }, [isAuthenticated, role, navigate])

  const roles = [
    {
      id: 'user',
      title: 'Заказчик',
      description: 'Заказать доставку воды или откачку септика',
      icon: User,
      color: 'bg-blue-500',
      path: '/auth/user'
    },
    {
      id: 'driver',
      title: 'Водитель',
      description: 'Принимать заказы и зарабатывать',
      icon: Truck,
      color: 'bg-green-500',
      path: '/auth/driver'
    },
    {
      id: 'admin',
      title: 'Администратор',
      description: 'Управление системой',
      icon: Shield,
      color: 'bg-purple-500',
      path: '/auth/admin'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Водовозка
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Выберите свою роль для входа в систему
          </p>
        </div>

        <div className="space-y-4">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Card key={role.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-0 justify-start"
                    onClick={() => navigate(role.path)}
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className={`${role.color} p-3 rounded-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {role.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>💧 Доставка воды • 🚽 Откачка септика</p>
        </div>
      </div>
    </div>
  )
}