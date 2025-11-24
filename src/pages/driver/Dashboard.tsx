import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useDriverOrders, useAvailableOrders, useAcceptOrder } from '@/hooks/useOrders'
import { SERVICES, ORDER_STATUSES } from '@/utils/constants'
import { formatPrice, formatDateTime } from '@/utils/helpers'
import { Truck, MapPin, Clock, DollarSign, List, LogOut, Phone, Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/Calendar'

export function DriverDashboard() {
  const navigate = useNavigate()
  const { driver, logout } = useAuthStore()
  const { data: myOrders = [] } = useDriverOrders()
  const { data: availableOrders = [] } = useAvailableOrders()
  const acceptOrderMutation = useAcceptOrder()
  const [activeTab, setActiveTab] = useState<'available' | 'my' | 'calendar'>('available')
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleAcceptOrder = (orderId: string) => {
    acceptOrderMutation.mutate(orderId)
  }

  const completedOrders = myOrders.filter(order => order.status === 'completed')
  const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.price * 0.9), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Truck className="h-6 w-6 text-green-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {driver?.full_name}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Заработано
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(totalEarnings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <List className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Выполнено заказов
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {completedOrders.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Активных заказов
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {myOrders.filter(o => ['accepted', 'in_progress'].includes(o.status)).length}
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
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('available')}
              >
                Доступные заказы ({availableOrders.length})
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('my')}
              >
                Мои заказы ({myOrders.length})
              </button>
              <button
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calendar'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('calendar')}
              >
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Календарь
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Calendar 
                orders={myOrders} 
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
            <div>
              {selectedDate ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Заказы на {new Date(selectedDate).toLocaleDateString('ru-RU')}
                  </h3>
                  {myOrders
                    .filter(order => order.delivery_date === selectedDate)
                    .map(order => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <span className="text-lg mr-2">
                              {order.service_type === 'water_delivery' ? '💧' : '🚽'}
                            </span>
                            <span className="font-medium">
                              {order.service_type === 'water_delivery' ? 'Доставка воды' : 'Откачка септика'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.address}
                          </p>
                          <p className="text-sm font-medium">
                            {order.delivery_time}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(order.price * 0.9)}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  }
                  {myOrders.filter(order => order.delivery_date === selectedDate).length === 0 && (
                    <p className="text-gray-500">Нет заказов на эту дату</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Выберите дату для просмотра заказов</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
          {activeTab === 'available' ? (
            availableOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Нет доступных заказов
                  </p>
                </CardContent>
              </Card>
            ) : (
              availableOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">
                            {order.service_type === 'water_delivery' ? '💧' : '🚽'}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {order.service_type === 'water_delivery' ? 'Доставка воды' : 'Откачка септика'}
                          </h3>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {order.address}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {order.delivery_date} в {order.delivery_time}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {order.user?.name} - {order.user?.phone}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-green-600 mb-2">
                          {formatPrice(order.price * 0.9)}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Ваш доход (90%)
                        </p>
                        <Button
                          onClick={() => handleAcceptOrder(order.id)}
                          isLoading={acceptOrderMutation.isPending}
                          className="w-full"
                        >
                          Принять заказ
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          ) : (
            myOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    У вас пока нет заказов
                  </p>
                </CardContent>
              </Card>
            ) : (
              myOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">
                            {order.service_type === 'water_delivery' ? '💧' : '🚽'}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {order.service_type === 'water_delivery' ? 'Доставка воды' : 'Откачка септика'}
                          </h3>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs text-white ${ORDER_STATUSES[order.status].color}`}>
                            {ORDER_STATUSES[order.status].name}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {order.address}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {order.delivery_date} в {order.delivery_time}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {order.user?.name} - {order.user?.phone}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-green-600">
                          {formatPrice(order.price * 0.9)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Создан: {formatDateTime(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          )}
          </div>
        )}
      </div>
    </div>
  )
}