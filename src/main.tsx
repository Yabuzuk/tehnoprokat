import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AppSimple from './AppSimple.tsx'
import './styles/globals.css'
import './styles/app.css'

// Обработка ошибок для мобильного приложения
if ((window as any).Capacitor) {
  console.log('Capacitor обнаружен - работаем в мобильном приложении')
  
  // Логирование ошибок
  window.addEventListener('error', (event) => {
    console.error('Ошибка JavaScript:', event.error)
    console.error('Сообщение:', event.message)
    console.error('Файл:', event.filename)
    console.error('Строка:', event.lineno)
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Необработанное отклонение Promise:', event.reason)
  })
}

// Скрытие адресной строки в WebView
if (window.navigator.userAgent.includes('wv')) {
  // Это WebView (TWA)
  document.addEventListener('DOMContentLoaded', () => {
    // Скрываем возможные элементы браузера
    const style = document.createElement('style')
    style.textContent = `
      body { margin: 0 !important; padding: 0 !important; }
      html { margin: 0 !important; padding: 0 !important; }
      * { -webkit-user-select: none; -webkit-touch-callout: none; }
    `
    document.head.appendChild(style)
  })
}

// Обертка для обработки ошибок
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false)
  
  React.useEffect(() => {
    const handleError = () => setHasError(true)
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка приложения</h1>
          <p className="text-gray-600 mb-4">Произошла ошибка. Попробуйте перезапустить приложение.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)