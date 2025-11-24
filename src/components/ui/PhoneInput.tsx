import { forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface PhoneInputProps {
  label?: string
  error?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, label, error, value, onChange, placeholder = "9991234567", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value.replace(/\D/g, '') // Только цифры
      
      // Если начинается с 8, заменяем на 7
      if (input.startsWith('8')) {
        input = '7' + input.slice(1)
      }
      
      // Если не начинается с 7, добавляем 7
      if (!input.startsWith('7') && input.length > 0) {
        input = '7' + input
      }
      
      // Ограничиваем до 11 цифр
      input = input.slice(0, 11)
      
      onChange(input)
    }

    const formatDisplay = (phone: string) => {
      if (!phone || phone.length < 1) return ''
      
      const digits = phone.startsWith('7') ? phone.slice(1) : phone
      let formatted = '+7'
      
      if (digits.length > 0) {
        formatted += ' (' + digits.slice(0, 3)
        if (digits.length > 3) {
          formatted += ') ' + digits.slice(3, 6)
          if (digits.length > 6) {
            formatted += '-' + digits.slice(6, 8)
            if (digits.length > 8) {
              formatted += '-' + digits.slice(8, 10)
            }
          }
        }
      }
      
      return formatted
    }

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          value={formatDisplay(value)}
          onChange={handleChange}
          placeholder={`+7 (999) 123-45-67`}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }