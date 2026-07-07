import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/assessments/latest')
      .then((response) => {
        if (response.data?.data) {
          setReports([response.data.data])
        }
      })
      .catch((err) => {
        if (err && typeof err === 'object' && 'error' in err && (err as any).error === 'No assessment runs found') {
          setReports([])
          return
        }

        setError('Unable to load recent reports')
      })
  }, [])

  return (
    <div className="page-grid">
      <div className="card card-hero">
        <h1>Reports</h1>
        <p>Generate and download PDF summaries for the latest assessment run.</p>
      </div>

      {error && <div className="card card-error">{error}</div>}

      <div className="card card-table">
        <h2>Latest assessment</h2>
        {reports.length === 0 ? (
          <p>No reports available yet.</p>
        ) : (
          <ul>
            {reports.map((report) => (
              <li key={report.runId}>
                <strong>{report.runId}</strong>
                <p>Status: {report.status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
