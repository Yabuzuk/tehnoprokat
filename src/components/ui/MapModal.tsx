import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface MapModalProps {
  isOpen: boolean
  onClose: () => void
  onAddressSelect: (address: string, coordinates: { lat: number; lng: number }) => void
  initialCoordinates?: { lat: number; lng: number }
}

export function MapModal({ isOpen, onClose, onAddressSelect, initialCoordinates }: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)

  const [selectedAddress, setSelectedAddress] = useState('')


  useEffect(() => {
    if (!isOpen || !mapRef.current) return

    if (window.ymaps) {
      window.ymaps.ready(initMap)
    } else {
      const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]')
      if (!existingScript) {
        const script = document.createElement('script')
        const apiKey = (import.meta as any).env.VITE_YANDEX_MAPS_API_KEY || '63c21778-deb0-4a95-bc2a-fb4d2dd46449'
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
        script.onload = () => {
          window.ymaps.ready(initMap)
        }
        document.head.appendChild(script)
      }
    }
  }, [isOpen])

  const initMap = () => {
    if (!mapRef.current) return

    // Используем переданные координаты или адрес по умолчанию
    if (initialCoordinates) {
      // Если переданы координаты (местоположение пользователя)
      const mapInstance = new window.ymaps.Map(mapRef.current, {
        center: [initialCoordinates.lat, initialCoordinates.lng],
        zoom: 15,
        controls: ['fullscreenControl'],
        type: 'yandex#map'
      }, {
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true
      })
      
      setupMapEvents(mapInstance)
    } else {
      // Иначе используем адрес по умолчанию
      window.ymaps.geocode('Мирный, улица 40 лет Октября, 9А').then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0)
        const coords = firstGeoObject ? firstGeoObject.geometry.getCoordinates() : [62.5434, 114.0156]
        
        const mapInstance = new window.ymaps.Map(mapRef.current, {
          center: coords,
          zoom: 17,
          controls: ['fullscreenControl'],
          type: 'yandex#map'
        }, {
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true
        })
        
        setupMapEvents(mapInstance)
      })
    }
    
    function setupMapEvents(mapInstance: any) {

      // Обновляем адрес при движении карты
      const updateAddress = () => {
        const center = mapInstance.getCenter()
        setSelectedAddress('Определяется адрес...')
        
        window.ymaps.geocode(center).then((res: any) => {
          const firstGeoObject = res.geoObjects.get(0)
          if (firstGeoObject) {
            const fullAddress = firstGeoObject.getAddressLine()
            const cleanAddress = fullAddress.replace(/Республика Саха \(Якутия\),?\s*/gi, '')
            setSelectedAddress(cleanAddress)
          } else {
            setSelectedAddress('Адрес не найден')
          }
        }).catch(() => {
          setSelectedAddress('Ошибка определения адреса')
        })
      }
      
      mapInstance.events.add('boundschange', updateAddress)
      updateAddress()

      setMap(mapInstance)
    }
  }



  const handleConfirm = () => {
    if (map && selectedAddress) {
      const coords = map.getCenter()
      onAddressSelect(selectedAddress, { lat: coords[0], lng: coords[1] })
      setSelectedAddress('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] m-4 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">Выберите адрес на карте</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative h-80">
          <div ref={mapRef} className="w-full h-full"></div>
          {/* Центральный маркер */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-10">
            <div className="text-red-500 text-2xl">📍</div>
          </div>
        </div>
        
        <div className="p-4 border-t bg-white dark:bg-gray-800 flex-shrink-0">
          {selectedAddress ? (
            <div>
              <p className="text-sm mb-3 text-gray-600 dark:text-gray-400">
                Выбранный адрес: {selectedAddress}
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Отмена
                </Button>
                <Button onClick={handleConfirm}>
                  Подтвердить
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Нажмите на карту для выбора адреса
            </p>
          )}
        </div>
      </div>
    </div>
  )
}