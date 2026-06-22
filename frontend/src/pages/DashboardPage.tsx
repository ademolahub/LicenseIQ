import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/recommendations')
      .then((response) => setSummary(response.data))
      .catch((err) => setError(typeof err === 'string' ? err : 'Unable to load dashboard'))
  }, [])

  return (
    <div className="page-grid">
      <div className="card card-hero">
        <h1>LicenseIQ dashboard</h1>
        <p>Track utilization, savings, and risk drivers across your tenant.</p>
      </div>

      {error ? (
        <div className="card card-error">{error}</div>
      ) : (
        <>
          <div className="card card-metric">
            <strong>Total recommendations</strong>
            <span>{summary?.count ?? '—'}</span>
          </div>
          <div className="card card-metric">
            <strong>Monthly savings</strong>
            <span>${((summary?.summary?.totalMonthlySavingsUSD ?? 0) / 100).toFixed(2)}</span>
          </div>
          <div className="card card-metric">
            <strong>Health score</strong>
            <span>{summary?.healthScore?.score ?? '—'}</span>
          </div>
          <div className="card card-table">
            <h2>Top Recommendations</h2>
            <ul>
              {(summary?.recommendations ?? []).slice(0, 3).map((recommendation: any) => (
                <li key={recommendation.id}>
                  <strong>{recommendation.title}</strong>
                  <p>{recommendation.rationale}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
