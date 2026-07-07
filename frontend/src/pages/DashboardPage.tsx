import { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { AssessmentSnapshot } from '../../../shared/types'

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function DashboardPage() {
  const [assessment, setAssessment] = useState<AssessmentSnapshot | null>(null)
  const [includedRecommendationIds, setIncludedRecommendationIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [runningAssessment, setRunningAssessment] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)

  const includedSet = useMemo(() => new Set(includedRecommendationIds), [includedRecommendationIds])

  const recommendations = assessment?.recommendations ?? []
  const selectedRecommendations = useMemo(
    () => recommendations.filter((recommendation) => includedSet.has(recommendation.id)),
    [recommendations, includedSet],
  )
  const selectedSavings = useMemo(
    () => selectedRecommendations.reduce((sum, recommendation) => sum + recommendation.estMonthlySavingsUSD, 0),
    [selectedRecommendations],
  )
  const availableSavings = useMemo(
    () => recommendations.reduce((sum, recommendation) => sum + recommendation.estMonthlySavingsUSD, 0),
    [recommendations],
  )

  const loadAssessment = async (runId: string) => {
    const response = await api.get(`/assessments/run/${runId}`)
    const snapshot = response.data?.data as AssessmentSnapshot | undefined
    if (!snapshot) {
      throw new Error('Unable to load assessment snapshot')
    }

    setAssessment(snapshot)
    setCurrentRunId(snapshot.runId)
    setIncludedRecommendationIds(snapshot.recommendations.map((recommendation) => recommendation.id))
  }

  const loadLatestAssessment = async () => {
    setError(null)
    setStatusMessage('Loading assessment...')
    setLoading(true)

    try {
      const response = await api.get('/assessments/latest')
      const latest = response.data?.data
      if (!latest?.runId) {
        throw new Error('No assessment run available')
      }

      await loadAssessment(latest.runId)
      setStatusMessage(null)
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Unable to load dashboard'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const pollAssessmentStatus = async (runId: string) => {
    const maxAttempts = 12
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const statusResponse = await api.get(`/assessments/status/${runId}`)
      const status = statusResponse.data?.data?.status as string | undefined
      if (status === 'complete') {
        return
      }
      if (status === 'failed') {
        throw new Error('Assessment failed')
      }
      setStatusMessage(`Waiting for assessment to complete (${attempt + 1}/${maxAttempts})...`)
      await sleep(1500)
    }
    throw new Error('Assessment polling timed out')
  }

  const runNewAssessment = async () => {
    setError(null)
    setStatusMessage('Starting new assessment...')
    setRunningAssessment(true)

    try {
      const response = await api.post('/assessments/start', { tenantId: 'mock-tenant' })
      const runData = response.data?.data

      if (!runData?.runId) {
        throw new Error('Assessment start failed')
      }

      setCurrentRunId(runData.runId)

      if (response.data?.snapshot) {
        const snapshot = response.data.snapshot as AssessmentSnapshot
        setAssessment(snapshot)
        setIncludedRecommendationIds(snapshot.recommendations.map((recommendation) => recommendation.id))
        setStatusMessage('Assessment complete')
        return
      }

      if (runData.status === 'complete') {
        await loadAssessment(runData.runId)
        setStatusMessage('Assessment complete')
        return
      }

      await pollAssessmentStatus(runData.runId)
      await loadAssessment(runData.runId)
      setStatusMessage('Assessment complete')
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Unable to run assessment'
      setError(message)
    } finally {
      setRunningAssessment(false)
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!currentRunId) {
      setError('No assessment run available for report generation')
      return
    }

    setError(null)
    setGeneratingReport(true)
    setStatusMessage('Generating report...')

    try {
      const response = await api.post('/reports/generate', { runId: currentRunId })
      const reportUrl = response.data?.data?.reportUrl
      if (!reportUrl || typeof reportUrl !== 'string') {
        throw new Error('Report generation returned invalid URL')
      }
      window.open(reportUrl, '_blank')
      setStatusMessage('Report generated')
    } catch (err) {
      const message = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Unable to generate report'
      setError(message)
    } finally {
      setGeneratingReport(false)
    }
  }

  useEffect(() => {
    loadLatestAssessment()
  }, [])

  const toggleRecommendation = (id: string) => {
    setIncludedRecommendationIds((previous) =>
      previous.includes(id) ? previous.filter((existing) => existing !== id) : [...previous, id],
    )
  }

  return (
    <div className="page-grid">
      <div className="card card-hero">
        <h1>LicenseIQ dashboard</h1>
        <p>Track utilization, savings, and recommendations for your tenant.</p>
      </div>

      {error ? (
        <div className="card card-error">{error}</div>
      ) : null}

      {statusMessage ? <div className="card card-info">{statusMessage}</div> : null}

      <div className="card card-metric">
        <strong>Total licenses</strong>
        <span>{assessment?.summary.totalLicenses ?? (loading ? 'Loading…' : '—')}</span>
      </div>

      <div className="card card-metric">
        <strong>Utilization</strong>
        <span>{assessment?.summary.utilizationPct != null ? `${assessment.summary.utilizationPct}%` : loading ? 'Loading…' : '—'}</span>
      </div>

      <div className="card card-metric">
        <strong>Inactive users</strong>
        <span>{assessment?.summary.inactiveUsers ?? (loading ? 'Loading…' : '—')}</span>
      </div>

      <div className="card card-metric">
        <strong>Potential savings</strong>
        <span>{assessment ? formatCurrency(selectedSavings) : loading ? 'Loading…' : '—'}</span>
      </div>

      <div className="card card-health">
        <div className="health-summary">
          <div>
            <strong>Health score</strong>
            <p>{assessment?.healthScore.score ?? '—'} / 100</p>
          </div>
          <div>
            <strong>Grade</strong>
            <p>{assessment?.healthScore.grade ?? '—'}</p>
          </div>
        </div>
        <div className="health-gauge" aria-label="Health score gauge">
          <div
            className="health-fill"
            style={{ width: `${assessment?.healthScore.score ?? 0}%` }}
          />
        </div>
        <div className="health-drivers">
          {(assessment?.healthScore.drivers ?? []).slice(0, 3).map((driver) => (
            <div key={driver.label} className="health-driver">
              <strong>{driver.label}</strong>
              <span>{driver.score}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-actions">
        <button className="button" onClick={runNewAssessment} disabled={loading || runningAssessment}>
          {runningAssessment ? 'Running assessment…' : 'Run New Assessment'}
        </button>
        <button className="button button-secondary" onClick={generateReport} disabled={!assessment || generatingReport}>
          {generatingReport ? 'Generating report…' : 'Generate Report'}
        </button>
      </div>

      <div className="card card-table">
        <h2>Recommendations</h2>
        {recommendations.length === 0 ? (
          <p>No recommendations found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Include</th>
                <th>Recommendation</th>
                <th>Monthly savings</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((recommendation) => (
                <tr key={recommendation.id} className={!includedSet.has(recommendation.id) ? 'excluded' : ''}>
                  <td>
                    <label>
                      <input
                        type="checkbox"
                        checked={includedSet.has(recommendation.id)}
                        onChange={() => toggleRecommendation(recommendation.id)}
                      />
                    </label>
                  </td>
                  <td>
                    <strong>{recommendation.title}</strong>
                    <p>{recommendation.rationale}</p>
                  </td>
                  <td>{formatCurrency(recommendation.estMonthlySavingsUSD)}</td>
                  <td>{recommendation.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card card-summary">
        <h2>Savings selected</h2>
        <p>{formatCurrency(selectedSavings)} of {formatCurrency(availableSavings)} monthly savings selected</p>
      </div>
    </div>
  )
}
