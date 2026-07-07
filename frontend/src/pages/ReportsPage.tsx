import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function ReportsPage() {
  const [runs, setRuns] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingRunId, setGeneratingRunId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    api.get('/assessments/runs')
      .then((response) => {
        setRuns(response.data?.data ?? [])
      })
      .catch((err) => {
        if (err && typeof err === 'object' && 'error' in err && (err as any).error === 'No assessment runs found') {
          setRuns([])
          return
        }
        setError('Unable to load assessment runs')
      })
      .finally(() => setLoading(false))
  }, [])

  const generateReport = async (runId: string) => {
    setGeneratingRunId(runId)
    setError(null)

    try {
      const response = await api.post('/reports/generate', { runId })
      const reportUrl = response.data?.data?.reportUrl
      if (reportUrl) {
        window.open(reportUrl, '_blank')
      } else {
        setError('Unable to generate report')
      }
    } catch {
      setError('Unable to generate report')
    } finally {
      setGeneratingRunId(null)
    }
  }

  return (
    <div className="page-grid">
      <div className="card card-hero">
        <h1>Reports</h1>
        <p>View historical assessment results and download generated PDF reports.</p>
      </div>

      {error && <div className="card card-error">{error}</div>}

      <div className="card card-table">
        <h2>Past assessment runs</h2>
        {loading ? (
          <p>Loading assessment history…</p>
        ) : runs.length === 0 ? (
          <p>No assessment runs found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Savings</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.runId}>
                  <td>{new Date(run.completedAt || run.createdAt).toLocaleString()}</td>
                  <td>{run.healthScore ?? '—'}</td>
                  <td>{run.healthGrade ?? '—'}</td>
                  <td>{run.totalMonthlySavingsUSD != null ? `$${(run.totalMonthlySavingsUSD / 100).toFixed(2)}` : '—'}</td>
                  <td>
                    {run.reportUrl ? (
                      <a href={run.reportUrl} target="_blank" rel="noreferrer" className="button button-small">
                        Download PDF
                      </a>
                    ) : (
                      <button
                        className="button button-small"
                        onClick={() => generateReport(run.runId)}
                        disabled={generatingRunId === run.runId}
                      >
                        {generatingRunId === run.runId ? 'Generating…' : 'Generate PDF'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
