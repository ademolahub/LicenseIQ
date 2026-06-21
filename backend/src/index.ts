import express, { Request, Response, NextFunction } from 'express'
import pino from 'pino'
import { config } from './config'
import { getMockUsers } from './mockGraphService'
import { buildRecommendations } from './recommendations'
import { tenantRecommendationSettings } from './tenantSettings'
import { calculateHealthScore } from './healthScore'
import { sumRecommendationSavings } from './savingsCalculator'

const logger = pino({
  level: config.LOG_LEVEL,
  base: { app: 'licenseiq-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
})

const app = express()

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

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled request error')

  const status = err && typeof err === 'object' && 'status' in err && typeof (err as any).status === 'number'
    ? (err as any).status
    : 500

  const message = err && typeof err === 'object' && 'message' in err
    ? (err as any).message
    : 'Internal Server Error'

  res.status(status).json({ error: message })
})

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, env: config.NODE_ENV }, 'LicenseIQ backend listening')
})
