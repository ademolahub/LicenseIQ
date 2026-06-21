import express, { Request, Response, NextFunction } from 'express'
import pino from 'pino'
import { v4 as uuidv4 } from 'uuid'
import { config } from './config'
import { getMockUsers } from './mockGraphService'
import { buildRecommendations } from './recommendations'
import { tenantRecommendationSettings } from './tenantSettings'
import { calculateHealthScore } from './healthScore'
import { sumRecommendationSavings } from './savingsCalculator'
import { getStorageClients } from './storage'
import { AssessmentRunListItem, AssessmentStatus, StartAssessmentResponse } from '../../shared/types'

const logger = pino({
  level: config.LOG_LEVEL,
  base: { app: 'licenseiq-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
})

const app = express()
const storage = getStorageClients()

app.use(express.json())

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', storage: config.MOCK_MODE ? 'mock' : 'azure' })
})

app.get('/recommendations', (_req: Request, res: Response) => {
  const users = getMockUsers()
  const recommendations = buildRecommendations(users, tenantRecommendationSettings)

  const assignedLicenses = users.reduce((sum, user) => sum + user.assignedLicenses.length, 0)
  const unassignedSeats = Object.values(tenantRecommendationSettings.unassignedLicenseCounts ?? {}).reduce((sum, count) => sum + count, 0)
  const totalLicenses = assignedLicenses + unassignedSeats
  const utilizationPct = totalLicenses === 0 ? 100 : Math.round((assignedLicenses / totalLicenses) * 100)
  const inactiveUsers = users.filter((user) =>
    user.accountEnabled &&
    user.assignedLicenses.length > 0 &&
    (!user.lastSignInDateTime || new Date(user.lastSignInDateTime).getTime() < Date.now() - (tenantRecommendationSettings.inactiveDaysThreshold ?? 90) * 24 * 60 * 60 * 1000),
  ).length
  const disabledWithLicense = users.filter((user) => !user.accountEnabled && user.assignedLicenses.length > 0).length
  const guestsWithLicense = users.filter((user) => user.userType === 'Guest' && user.assignedLicenses.length > 0).length

  const savings = sumRecommendationSavings(recommendations, {
    'sku-basic': 2000,
    'sku-standard': 4000,
    'sku-premium': 8000,
    'sku-enterprise': 12000,
  })

  const healthScore = calculateHealthScore({
    totalLicenses,
    assignedLicenses,
    inactiveUsers,
    disabledWithLicense,
    guestsWithLicense,
    unassignedSeats,
    totalMonthlySavingsUSD: savings.estMonthlySavingsUSD,
    recommendations,
  })

  const summary = {
    totalLicenses,
    assignedLicenses,
    utilizationPct,
    inactiveUsers,
    disabledWithLicense,
    guestsWithLicense,
    unassignedSeats,
    totalMonthlySavingsUSD: savings.estMonthlySavingsUSD,
    totalAnnualSavingsUSD: savings.annualSavingsUSD,
  }

  res.json({ recommendations, count: recommendations.length, summary, healthScore })
})

app.post('/api/assessments/start', async (req: Request, res: Response) => {
  try {
    const tenantId = typeof req.body.tenantId === 'string' && req.body.tenantId.trim() !== ''
      ? req.body.tenantId.trim()
      : 'mock-tenant'

    const runId = uuidv4()
    const createdAt = new Date().toISOString()

    await storage.tables.upsertAssessmentIndex({
      partitionKey: runId,
      rowKey: runId,
      runId,
      tenantId,
      status: 'queued',
      createdAt,
    })

    await storage.queue.enqueueAssessment(runId, tenantId)

    const response: StartAssessmentResponse = {
      runId,
      tenantId,
      status: 'queued',
    }

    return res.status(202).json({ success: true, data: response })
  } catch (error) {
    logger.error({ err: error }, 'Failed to start assessment')
    return res.status(500).json({ success: false, error: 'Failed to start assessment' })
  }
})

app.get('/api/assessments/latest', async (_req: Request, res: Response) => {
  try {
    const indexes = await storage.tables.listAssessmentIndexes()
    if (!indexes.length) {
      return res.status(404).json({ success: false, error: 'No assessment runs found' })
    }

    const latest = indexes.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0]
    const summary = await buildAssessmentListItem(latest)
    return res.json({ success: true, data: summary })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch latest assessment')
    return res.status(500).json({ success: false, error: 'Failed to fetch latest assessment' })
  }
})

app.get('/api/assessments/status/:runId', async (req: Request, res: Response) => {
  try {
    const runId = req.params.runId
    const index = await storage.tables.getAssessmentIndex(runId)
    if (!index) {
      return res.status(404).json({ success: false, error: 'Assessment run not found' })
    }

    return res.json({
      success: true,
      data: {
        runId: index.runId,
        status: index.status,
        createdAt: index.createdAt,
        completedAt: index.completedAt ?? null,
        error: (index as any).errorMessage,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch assessment status')
    return res.status(500).json({ success: false, error: 'Failed to fetch assessment status' })
  }
})

app.get('/api/assessments/run/:runId', async (req: Request, res: Response) => {
  try {
    const runId = req.params.runId
    const assessmentJson = await storage.blobs.getAssessment(runId)
    if (!assessmentJson) {
      return res.status(404).json({ success: false, error: 'Assessment snapshot not found' })
    }

    const snapshot = JSON.parse(assessmentJson)
    return res.json({ success: true, data: snapshot })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch assessment snapshot')
    return res.status(500).json({ success: false, error: 'Failed to fetch assessment snapshot' })
  }
})

app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined
    const settings = await storage.tables.listTenantSettings(tenantId)
    return res.json({ success: true, data: settings.map((entry) => ({
      tenantId: entry.tenantId,
      settingKey: entry.settingKey,
      settingValue: tryParseJson(entry.settingValue),
      lastUpdated: entry.lastUpdated,
    })) })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch tenant settings')
    return res.status(500).json({ success: false, error: 'Failed to fetch tenant settings' })
  }
})

app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const { tenantId, settingKey, settingValue } = req.body
    if (!tenantId || !settingKey || settingValue === undefined) {
      return res.status(400).json({ success: false, error: 'tenantId, settingKey, and settingValue are required' })
    }

    const entity = {
      partitionKey: tenantId,
      rowKey: `${tenantId}|${settingKey}`,
      tenantId,
      settingKey,
      settingValue: typeof settingValue === 'string' ? settingValue : JSON.stringify(settingValue),
      lastUpdated: new Date().toISOString(),
    }

    await storage.tables.upsertTenantSettings(entity)
    return res.json({ success: true, data: entity })
  } catch (error) {
    logger.error({ err: error }, 'Failed to upsert tenant settings')
    return res.status(500).json({ success: false, error: 'Failed to upsert tenant settings' })
  }
})

app.post('/api/reports/generate', async (req: Request, res: Response) => {
  try {
    const runId = req.body.runId
    if (!runId || typeof runId !== 'string') {
      return res.status(400).json({ success: false, error: 'runId is required' })
    }

    const assessmentJson = await storage.blobs.getAssessment(runId)
    if (!assessmentJson) {
      return res.status(404).json({ success: false, error: 'Assessment snapshot not found' })
    }

    const snapshot = JSON.parse(assessmentJson)
    const reportId = `report-${runId}`
    const reportBody = JSON.stringify({
      generatedAt: new Date().toISOString(),
      runId: snapshot.runId,
      tenantId: snapshot.tenantId,
      tenantName: snapshot.tenantName,
      status: snapshot.status,
      createdAt: snapshot.createdAt,
      completedAt: snapshot.completedAt,
      summary: snapshot.summary,
      healthScore: snapshot.healthScore,
      recommendations: snapshot.recommendations.map((recommendation: any) => ({
        id: recommendation.id,
        title: recommendation.title,
        type: recommendation.type,
        estMonthlySavingsUSD: recommendation.estMonthlySavingsUSD,
        annualSavingsUSD: recommendation.annualSavingsUSD,
        affectedUserCount: recommendation.affectedUserCount,
      })),
    }, null, 2)

    await storage.blobs.uploadReport(reportId, reportBody)

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString()
    const reportUrl = config.MOCK_MODE ? `mock://reports/${reportId}` : `reports/${reportId}`

    return res.json({
      success: true,
      data: {
        runId,
        reportUrl,
        expiresAt,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate report')
    return res.status(500).json({ success: false, error: 'Failed to generate report' })
  }
})

app.get('/api/reports/:reportId', async (req: Request, res: Response) => {
  try {
    const reportId = req.params.reportId
    const reportBody = await storage.blobs.getReport(reportId)
    if (!reportBody) {
      return res.status(404).json({ success: false, error: 'Report not found' })
    }
    return res.type('application/json').send(reportBody)
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch report')
    return res.status(500).json({ success: false, error: 'Failed to fetch report' })
  }
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled request error')

  const status = err && typeof err === 'object' && 'status' in err && typeof (err as any).status === 'number'
    ? (err as any).status
    : 500

  const message = err && typeof err === 'object' && 'message' in err
    ? (err as any).message
    : 'Internal Server Error'

  res.status(status).json({ success: false, error: message })
})

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'LicenseIQ backend listening')
})

async function buildAssessmentListItem(index: any): Promise<AssessmentRunListItem> {
  const item: AssessmentRunListItem = {
    runId: index.runId,
    tenantId: index.tenantId,
    tenantName: 'Mock Tenant',
    status: index.status as AssessmentStatus,
    createdAt: index.createdAt,
    completedAt: index.completedAt ?? null,
  }

  const assessmentJson = await storage.blobs.getAssessment(index.runId)
  if (assessmentJson) {
    try {
      const snapshot = JSON.parse(assessmentJson)
      item.healthScore = snapshot.healthScore?.score
      item.healthGrade = snapshot.healthScore?.grade
      item.totalMonthlySavingsUSD = snapshot.summary?.totalMonthlySavingsUSD
    } catch {
      // ignore parse error
    }
  }

  return item
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
