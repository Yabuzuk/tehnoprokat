import { Button } from '@/components/ui/Button'
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationTest() {
  const { showTestNotification } = useNotifications()

  const testNotifications = [
    {
      title: 'Новый заказ!',
      body: 'Доставка воды - ул. Ленина, 123',
      type: 'new_order'
    },
    {
      title: 'Статус заказа изменен',
      body: 'Ваш заказ принят водителем',
      type: 'status_change'
    },
    {
      title: 'Заказ выполнен',
      body: 'Спасибо за использование нашего сервиса!',
      type: 'completed'
    }
  ]

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Тест уведомлений</h3>
      <div className="space-y-2">
        {testNotifications.map((notification, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => showTestNotification(notification)}
            className="w-full text-left"
          >
            {notification.title}
          </Button>
        ))}
      </div>
    </div>
  )
}