import { useState, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

interface AddressInputProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  error?: string
  onMapClick?: (coordinates?: { lat: number; lng: number }) => void
}

declare global {
  interface Window {
    ymaps: any
  }
}

export function AddressInput({ value, onChange, error, onMapClick }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)




  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    onChange(inputValue)
    
    if (inputValue.length > 2) {
      fetch(`https://suggest-maps.yandex.ru/v1/suggest?apikey=41a4deeb-0548-4d8e-b897-3c4a6bc08032&text=${encodeURIComponent(inputValue + ' Мирный Якутия')}&lang=ru_RU&bbox=113.9500,62.5000~114.1100,62.5700&rspn=1`)
        .then(res => res.json())
        .then(data => {
          if (data.results) {
            setSuggestions(data.results)
            setShowSuggestions(true)
          }
        })
        .catch(() => setShowSuggestions(false))
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: any) => {
    const address = suggestion.title?.text || suggestion.text
    onChange(address)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            id="address-input"
            placeholder="Введите адрес"
            value={value}
            onChange={handleInputChange}
            error={error}
            onFocus={() => value.length > 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            // Проверяем HTTPS
            if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
              alert('Геолокация работает только по HTTPS')
              onMapClick?.()
              return
            }
            
            if (navigator.geolocation) {
              try {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const coords = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    }
                    onMapClick?.(coords)
                  },
                  (error) => {
                    console.log('Ошибка геолокации:', error.message)
                    alert('Не удалось определить местоположение')
                    onMapClick?.()
                  },
                  {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                  }
                )
              } catch (e) {
                console.log('Ошибка проверки разрешений:', e)
                onMapClick?.()
              }
            } else {
              alert('Геолокация не поддерживается')
              onMapClick?.()
            }
          }}
          className="px-3"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="text-sm font-medium">{suggestion.title?.text || suggestion.text}</div>
              {suggestion.subtitle?.text && (
                <div className="text-xs text-gray-500">{suggestion.subtitle.text}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}