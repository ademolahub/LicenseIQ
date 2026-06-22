import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { config } from '../config'

export default function ConnectPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (config.MOCK_MODE) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <div className="page-grid">
      <div className="card card-hero">
        <div>
          <h1>Connect your Microsoft tenant</h1>
          <p>Sign in with Azure AD to begin discovery, reports, and recommendations.</p>
        </div>
        <button className="button">Continue with Microsoft</button>
      </div>
      <div className="card">
        <h2>Why connect?</h2>
        <ul>
          <li>Automated license hygiene recommendations</li>
          <li>Secure, compliant reporting</li>
          <li>Production-ready dashboard in minutes</li>
        </ul>
      </div>
    </div>
  )
}
