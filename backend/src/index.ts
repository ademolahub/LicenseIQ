import express, { Request, Response, NextFunction } from 'express'
import pino from 'pino'
import { config } from './config'
import { getMockUsers } from './mockGraphService'
import { buildRecommendations } from './recommendations'
import { tenantRecommendationSettings } from './tenantSettings'

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
  res.json({ recommendations, count: recommendations.length })
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
