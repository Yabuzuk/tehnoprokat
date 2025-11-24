import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { adminApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { SERVICES, ORDER_STATUSES, DRIVER_STATUSES } from '@/utils/constants'
import { formatPrice, formatDateTime } from '@/utils/helpers'
import { Shield, Users, Truck, DollarSign, LogOut, Check, X } from 'lucide-react'

export function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'orders'>('overview')

  const { data: orders = [] } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: adminApi.getAllOrders
  })

  const { data: drivers = [] } = useQuery({
    queryKey: ['admin', 'drivers'],
    queryFn: adminApi.getAllDrivers
  })

  const updateDriverMutation = useMutation({
    mutationFn: ({ driverId, status }: { driverId: string; status: string }) =>
      adminApi.updateDriverStatus(driverId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] })
    }
  })

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDriverAction = (driverId: string, status: string) => {
    updateDriverMutation.mutate({ driverId, status })
  }

  const totalRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.price * 0.1), 0)

  const completedOrders = orders.filter(order => order.status === 'completed').length
  const activeDrivers = drivers.filter(driver => driver.status === 'active').length
  const pendingDrivers = drivers.filter(driver => driver.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-purple-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Панель администратора
              </h1>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Доход (комиссия)
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Check className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Выполнено заказов
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completedOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Активных водителей
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeDrivers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    На модерации
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingDrivers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Обзор' },
                { id: 'drivers', name: `Водители (${drivers.length})` },
                { id: 'orders', name: `Заказы (${orders.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            {drivers.map((driver) => (
              <Card key={driver.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {driver.full_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {driver.phone} • {driver.car_number}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-sm text-gray-500 mr-2">Услуги:</span>
                        {driver.service_type.map(type => (
                          <span key={type} className="text-sm mr-2">
                            {SERVICES[type].icon} {SERVICES[type].name}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Регистрация: {formatDateTime(driver.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:min-w-fit">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-white whitespace-nowrap ${DRIVER_STATUSES[driver.status].color}`}>
                        {DRIVER_STATUSES[driver.status].name}
                      </span>
                      
                      {driver.status === 'pending' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDriverAction(driver.id, 'active')}
                            isLoading={updateDriverMutation.isPending}
                            className="whitespace-nowrap"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Активировать
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDriverAction(driver.id, 'blocked')}
                            isLoading={updateDriverMutation.isPending}
                            className="whitespace-nowrap"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Отклонить
                          </Button>
                        </div>
                      )}
                      
                      {driver.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDriverAction(driver.id, 'blocked')}
                          isLoading={updateDriverMutation.isPending}
                          className="whitespace-nowrap"
                        >
                          Заблокировать
                        </Button>
                      )}
                      
                      {driver.status === 'blocked' && (
                        <Button
                          size="sm"
                          onClick={() => handleDriverAction(driver.id, 'active')}
                          isLoading={updateDriverMutation.isPending}
                          className="whitespace-nowrap"
                        >
                          Разблокировать
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-xl mr-2">
                          {order.service_type === 'water_delivery' ? '💧' : '🚽'}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {order.service_type === 'water_delivery' ? 'Доставка воды' : 'Откачка септика'}
                        </h3>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs text-white ${ORDER_STATUSES[order.status].color}`}>
                          {ORDER_STATUSES[order.status].name}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Клиент:</strong> {order.user?.name} ({order.user?.phone})</p>
                          <p><strong>Адрес:</strong> {order.address}</p>
                          <p><strong>Время:</strong> {order.delivery_date} в {order.delivery_time}</p>
                        </div>
                        <div>
                          {order.driver && (
                            <p><strong>Водитель:</strong> {order.driver.full_name}</p>
                          )}
                          <p><strong>Стоимость:</strong> {formatPrice(order.price)}</p>
                          <p><strong>Создан:</strong> {formatDateTime(order.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}