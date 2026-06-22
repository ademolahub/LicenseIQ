import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/auth'
import Layout from './components/Layout'
import ConnectPage from './pages/ConnectPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="connect" element={<ConnectPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
