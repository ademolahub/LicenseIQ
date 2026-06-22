import { ReactNode, useEffect } from 'react'
import { MsalProvider, useMsal } from '@azure/msal-react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig, loginRequest } from './msalConfig'
import { config } from '../config'

const msalInstance = new PublicClientApplication(msalConfig)

function MockAuthGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.history.replaceState(null, '', '/dashboard')
  }, [])

  return <>{children}</>
}

function MsalAuthGate({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal()

  useEffect(() => {
    if (accounts.length === 0) {
      instance.loginRedirect(loginRequest)
    }
  }, [accounts, instance])

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
