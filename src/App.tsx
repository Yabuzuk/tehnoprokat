import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'

// Pages
import { RoleSelection } from '@/pages/RoleSelection'
import { UserAuth } from '@/pages/auth/UserAuth'
import { DriverAuth } from '@/pages/auth/DriverAuth'
import { AdminAuth } from '@/pages/auth/AdminAuth'
import { UserDashboard } from '@/pages/user/Dashboard'
import { CreateOrder } from '@/pages/user/CreateOrder'
import { UserOrders } from '@/pages/user/Orders'
import { DriverDashboard } from '@/pages/driver/Dashboard'
import { AdminDashboard } from '@/pages/admin/Dashboard'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode
  requiredRole: 'user' | 'driver' | 'admin'
}) {
  const { isAuthenticated, role } = useAuthStore()
  
  if (!isAuthenticated || role !== requiredRole) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<RoleSelection />} />
            <Route path="/auth/user" element={<UserAuth />} />
            <Route path="/auth/driver" element={<DriverAuth />} />
            <Route path="/auth/admin" element={<AdminAuth />} />
            
            {/* User Routes */}
            <Route 
              path="/user/dashboard" 
              element={
                <ProtectedRoute requiredRole="user">
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/order/:serviceType" 
              element={
                <ProtectedRoute requiredRole="user">
                  <CreateOrder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/orders" 
              element={
                <ProtectedRoute requiredRole="user">
                  <UserOrders />
                </ProtectedRoute>
              } 
            />
            
            {/* Driver Routes */}
            <Route 
              path="/driver/dashboard" 
              element={
                <ProtectedRoute requiredRole="driver">
                  <DriverDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App