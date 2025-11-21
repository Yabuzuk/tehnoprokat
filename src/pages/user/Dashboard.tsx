import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useUserOrders } from '@/hooks/useOrders'
import { SERVICES } from '@/utils/constants'
import { formatPrice } from '@/utils/helpers'
import { Droplets, Trash2, Plus, History, LogOut, Truck } from 'lucide-react'

export function UserDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { data: orders = [], isLoading } = useUserOrders()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const services = [
    {
      type: 'water_delivery' as const,
      icon: Droplets,
      color: 'bg-blue-500',
      name: 'Доставка воды',
      description: 'Доставка питьевой воды',
      price: 1300
    },
    {
      type: 'septic_pumping' as const,
      icon: Trash2,
      color: 'bg-amber-500',
      name: 'Откачка септика',
      description: 'Откачка септических ям',
      price: 4000
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Truck className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Технопрокат
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/user/orders')}
              >
                <History className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">История</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Services */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Выберите услугу
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <Card key={service.type} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-0 justify-start"
                      onClick={() => navigate(`/user/order/${service.type}`)}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className={`${service.color} p-4 rounded-lg`}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="text-left flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {service.description}
                          </p>
                          <p className="text-xl font-bold text-primary-600">
                            {formatPrice(service.price)}
                            {service.type === 'water_delivery' && ' / куб.м'}
                          </p>
                        </div>
                        <Plus className="h-6 w-6 text-gray-400" />
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Последние заказы
            </h2>
            <Button
              variant="outline"
              onClick={() => navigate('/user/orders')}
            >
              Все заказы
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  У вас пока нет заказов
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 3).map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {SERVICES[order.service_type].name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.address}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.delivery_date} в {order.delivery_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatPrice(order.price)}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs text-white ${
                          order.status === 'completed' ? 'bg-green-500' :
                          order.status === 'in_progress' ? 'bg-blue-500' :
                          order.status === 'accepted' ? 'bg-purple-500' :
                          order.status === 'cancelled' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}>
                          {order.status === 'pending' && 'Ожидает'}
                          {order.status === 'accepted' && 'Принят'}
                          {order.status === 'in_progress' && 'В пути'}
                          {order.status === 'completed' && 'Выполнен'}
                          {order.status === 'cancelled' && 'Отменен'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}