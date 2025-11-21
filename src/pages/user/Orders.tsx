import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useUserOrders, useCancelOrder } from '@/hooks/useOrders'
import { SERVICES, ORDER_STATUSES } from '@/utils/constants'
import { formatPrice, formatDateTime } from '@/utils/helpers'
import { ArrowLeft, MapPin, Clock, Phone, X } from 'lucide-react'

export function UserOrders() {
  const navigate = useNavigate()
  const { data: orders = [], isLoading } = useUserOrders()
  const cancelOrderMutation = useCancelOrder()

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Вы уверены, что хотите отменить заказ?')) {
      cancelOrderMutation.mutate(orderId)
    }
  }

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
              История заказов
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                У вас пока нет заказов
              </p>
              <Button onClick={() => navigate('/user/dashboard')}>
                Создать первый заказ
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">
                        {order.service_type === 'water_delivery' ? '💧' : '🚽'}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {order.service_type === 'water_delivery' ? 'Доставка воды' : 'Откачка септика'}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          Заказ #{order.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${ORDER_STATUSES[order.status].color}`}>
                        {ORDER_STATUSES[order.status].name}
                      </span>
                      {order.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          isLoading={cancelOrderMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mt-1 mr-2 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Адрес доставки</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.address}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Время доставки</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.delivery_date} в {order.delivery_time}
                          </p>
                        </div>
                      </div>
                      
                      {order.driver && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Водитель</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.driver.full_name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Стоимость</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {formatPrice(order.price)}
                        </p>
                        {order.service_type === 'water_delivery' && (
                          <p className="text-xs text-gray-500">
                            {order.quantity} куб.м × {formatPrice(1300)}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Создан</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDateTime(order.created_at)}
                        </p>
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