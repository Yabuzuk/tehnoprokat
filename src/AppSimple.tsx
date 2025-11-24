import { useState, useEffect } from 'react'

export default function AppSimple() {
  const [logs, setLogs] = useState<string[]>(['App started'])
  const [error, setError] = useState<string | null>(null)

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addLog('useEffect started')
    
    try {
      addLog(`Capacitor: ${!!(window as any).Capacitor ? 'YES' : 'NO'}`)
      addLog(`UserAgent: ${navigator.userAgent.substring(0, 50)}`)
      addLog(`Location: ${window.location.href}`)
      
      // Перехват ошибок
      window.addEventListener('error', (e) => {
        const errorMsg = `ERROR: ${e.message} at ${e.filename}:${e.lineno}`
        addLog(errorMsg)
        setError(errorMsg)
      })
      
      window.addEventListener('unhandledrejection', (e) => {
        const errorMsg = `PROMISE ERROR: ${e.reason}`
        addLog(errorMsg)
        setError(errorMsg)
      })
      
      addLog('Event listeners added')
    } catch (err) {
      const errorMsg = `Setup error: ${err}`
      addLog(errorMsg)
      setError(errorMsg)
    }
  }, [])

  const testNavigation = () => {
    try {
      addLog('Testing navigation...')
      // Имитируем переход на страницу заказа
      addLog('Navigation would work here')
    } catch (err) {
      const errorMsg = `Navigation error: ${err}`
      addLog(errorMsg)
      setError(errorMsg)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🔧 Debug Mode</h1>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          marginBottom: '20px',
          border: '1px solid #ef5350',
          borderRadius: '4px'
        }}>
          <strong>ERROR:</strong> {error}
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testNavigation}
          style={{
            backgroundColor: '#2196f3',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Test Navigation
        </button>
        
        <button 
          onClick={() => setLogs([])}
          style={{
            backgroundColor: '#f44336',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Logs
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#fff', 
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Logs:</h3>
        {logs.map((log, index) => (
          <div key={index} style={{ 
            padding: '2px 0', 
            borderBottom: '1px solid #eee',
            fontSize: '12px'
          }}>
            {log}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Environment Info:</strong></p>
        <p>Capacitor: {!!(window as any).Capacitor ? '✅ YES' : '❌ NO'}</p>
        <p>Platform: {navigator.platform}</p>
        <p>URL: {window.location.href}</p>
      </div>
    </div>
  )
}