import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../auth/msalConfig'
import { config } from '../config'
import { useToast } from '../components/ToastProvider'

function RealConnectPage() {
  const navigate = useNavigate()
  const { instance, accounts } = useMsal()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (accounts.length > 0) {
      toast('Signed in successfully. Redirecting to dashboard.', 'success')
      navigate('/dashboard', { replace: true })
    }
  }, [accounts, navigate, toast])

  const handleConnect = async () => {
    try {
      await instance.loginPopup(loginRequest)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed'
      setError(message)
      toast(message, 'error')
      console.error('Login failed:', err)
    }
  }

  return (
    <div className="page-grid">
      {error && <div className="card card-error">{error}</div>}
      <div className="card card-hero">
        <div>
          <h1>Connect your Microsoft 365 tenant</h1>
          <p>Sign in with your Azure AD account to begin license discovery, optimization analysis, and recommendations.</p>
          <div style={{ marginTop: '24px' }}>
            <button className="button button-large" onClick={handleConnect}>
              Continue with Microsoft
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>What we'll access</h2>
        <ul className="permissions-list">
          <li>
            <span className="permission-icon">👤</span>
            <div>
              <strong>User profiles</strong>
              <p>Read user account details including sign-in activity and license assignments</p>
            </div>
          </li>
          <li>
            <span className="permission-icon">📋</span>
            <div>
              <strong>License information</strong>
              <p>Analyze SKU assignments and usage patterns across your tenant</p>
            </div>
          </li>
          <li>
            <span className="permission-icon">🔒</span>
            <div>
              <strong>Secure reporting</strong>
              <p>Generate compliant reports without storing your data</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>Why connect?</h2>
        <ul className="benefits-list">
          <li>Automated license hygiene recommendations</li>
          <li>Identify unused licenses and reduce spending</li>
          <li>Secure, compliant reporting and analytics</li>
          <li>Production-ready dashboard in minutes</li>
        </ul>
      </div>

      <div className="card card-info">
        <h3>Security & Privacy</h3>
        <p>
          LicenseIQ uses Microsoft's OAuth 2.0 authentication. We read-only access your tenant data
          and never store user credentials. Your tenant remains secure and in control.
        </p>
      </div>
    </div>
  )
}

function MockConnectPage() {
  const navigate = useNavigate()

  const handleConnect = () => {
    navigate('/dashboard', { replace: true })
    window.location.href = '/dashboard'
  }

  return (
    <div className="page-grid">
      <div className="card card-warning">
        <strong>🧪 MOCK MODE</strong>
        <p>Running in mock mode. Clicking connect will skip OAuth and navigate to the dashboard.</p>
      </div>

      <div className="card card-hero">
        <div>
          <h1>Connect your Microsoft 365 tenant</h1>
          <p>Sign in with your Azure AD account to begin license discovery, optimization analysis, and recommendations.</p>
          <div style={{ marginTop: '24px' }}>
            <button className="button button-large" onClick={handleConnect}>
              Continue (Mock Mode)
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>What we'll access</h2>
        <ul className="permissions-list">
          <li>
            <span className="permission-icon">👤</span>
            <div>
              <strong>User profiles</strong>
              <p>Read user account details including sign-in activity and license assignments</p>
            </div>
          </li>
          <li>
            <span className="permission-icon">📋</span>
            <div>
              <strong>License information</strong>
              <p>Analyze SKU assignments and usage patterns across your tenant</p>
            </div>
          </li>
          <li>
            <span className="permission-icon">🔒</span>
            <div>
              <strong>Secure reporting</strong>
              <p>Generate compliant reports without storing your data</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>Why connect?</h2>
        <ul className="benefits-list">
          <li>Automated license hygiene recommendations</li>
          <li>Identify unused licenses and reduce spending</li>
          <li>Secure, compliant reporting and analytics</li>
          <li>Production-ready dashboard in minutes</li>
        </ul>
      </div>

      <div className="card card-info">
        <h3>Security & Privacy</h3>
        <p>
          LicenseIQ uses Microsoft's OAuth 2.0 authentication. We read-only access your tenant data
          and never store user credentials. Your tenant remains secure and in control.
        </p>
      </div>
    </div>
  )
}

export default function ConnectPage() {
  return config.MOCK_MODE ? <MockConnectPage /> : <RealConnectPage />
}

