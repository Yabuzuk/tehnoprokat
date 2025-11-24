import { useState, useEffect } from 'react'

export function DebugInfo() {
  const [isCapacitor, setIsCapacitor] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    setIsCapacitor(!!(window as any).Capacitor)
    
    // Перехватываем console.log для отображения в интерфейсе
    const originalLog = console.log
    const originalError = console.error
    
    console.log = (...args) => {
      originalLog(...args)
      setLogs(prev => [...prev.slice(-9), `LOG: ${args.join(' ')}`])
    }
    
    console.error = (...args) => {
      originalError(...args)
      setLogs(prev => [...prev.slice(-9), `ERROR: ${args.join(' ')}`])
    }
    
    return () => {
      console.log = originalLog
      console.error = originalError
    }
  }, [])

  // Показываем отладочную информацию только в мобильном приложении
  if (!isCapacitor) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 text-white text-xs p-2 max-h-32 overflow-y-auto z-50">
      <div className="mb-1">
        <strong>Debug Info:</strong> Capacitor: {isCapacitor ? 'YES' : 'NO'} | 
        UA: {navigator.userAgent.substring(0, 50)}...
      </div>
      <div className="space-y-1">
        {logs.map((log, index) => (
          <div key={index} className="font-mono">
            {log}
          </div>
        ))}
      </div>
      <button 
        onClick={() => setLogs([])}
        className="mt-1 bg-red-600 px-2 py-1 rounded text-xs"
      >
        Clear
      </button>
    </div>
  )
}