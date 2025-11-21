import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'
import './styles/app.css'

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
    
    // Принудительный полноэкранный режим
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)