import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/auth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastProvider'
import Layout from './components/Layout'
import ConnectPage from './pages/ConnectPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/connect" replace />} />
                <Route path="connect" element={<ConnectPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/connect" replace />} />
            </Routes>
          </AuthProvider>
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  )
}
