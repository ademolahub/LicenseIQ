import { ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MsalProvider, useMsal } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig, loginRequest } from './msalConfig'
import { config } from '../config'

const msalInstance = new PublicClientApplication(msalConfig)

function MockAuthGate({ children }: { children: ReactNode }) {
  return <>{children}</>
}

function MsalAuthGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { instance, accounts } = useMsal()

  // Allow unauthenticated access to /connect page
  const isConnectPage = location.pathname === '/connect'

  useEffect(() => {
    if (!isConnectPage && accounts.length === 0) {
      instance.loginRedirect(loginRequest)
    }
  }, [accounts, instance, isConnectPage])

  if (isConnectPage) {
    // Render without auth requirement on connect page
    return <>{children}</>
  }

  // Require auth for other pages
  return <>{accounts.length > 0 ? children : <div className="page-shell">Signing in...</div>}</>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (config.MOCK_MODE) {
    return <MockAuthGate>{children}</MockAuthGate>
  }

  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthGate>{children}</MsalAuthGate>
    </MsalProvider>
  )
}
