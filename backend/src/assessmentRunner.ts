import { v4 as uuidv4 } from 'uuid'
import { getStorageClients } from './storage'
import { getMockUsers } from './mockGraphService'
import { buildRecommendations } from './recommendations'
import { calculateHealthScore } from './healthScore'
import { sumRecommendationSavings } from './savingsCalculator'
import { tenantRecommendationSettings } from './tenantSettings'
import { AssessmentSnapshot, AssessmentSummary, GraphSku } from '../../shared/types'

export interface AssessmentSnapshotWithSavings extends AssessmentSnapshot {
  timestamp: string
  savings: {
    monthlyUSD: number
    annualUSD: number
  }
}

function buildSkus(): GraphSku[] {
  return Object.entries(tenantRecommendationSettings.skuPricing).map(([skuId, pricing]) => ({
    skuId,
    skuPartNumber: pricing.skuName,
    consumedUnits: 0,
    prepaidUnits: {
      enabled: 0,
      suspended: 0,
      warning: 0,
    },
    servicePlans: [
      {
        servicePlanId: `${skuId}-plan`,
        servicePlanName: pricing.skuName,
      },
    ],
  }))
}

function buildSummary(users: ReturnType<typeof getMockUsers>, savings: { estMonthlySavingsUSD: number; annualSavingsUSD: number }): AssessmentSummary {
  const totalLicenses = users.reduce((sum, user) => sum + user.assignedLicenses.length, 0) +
    Object.values(tenantRecommendationSettings.unassignedLicenseCounts ?? {}).reduce((sum, value) => sum + value, 0)
  const assignedLicenses = users.reduce((sum, user) => sum + user.assignedLicenses.length, 0)
  const utilizationPct = totalLicenses === 0 ? 100 : Math.round((assignedLicenses / totalLicenses) * 100)
  const inactiveUsers = users.filter((user) =>
    user.accountEnabled &&
    user.assignedLicenses.length > 0 &&
    (!user.lastSignInDateTime || new Date(user.lastSignInDateTime).getTime() < Date.now() - (tenantRecommendationSettings.inactiveDaysThreshold ?? 90) * 24 * 60 * 60 * 1000),
  ).length
  const disabledWithLicense = users.filter((user) => !user.accountEnabled && user.assignedLicenses.length > 0).length
  const guestsWithLicense = users.filter((user) => user.userType === 'Guest' && user.assignedLicenses.length > 0).length
  const unassignedSeats = Object.values(tenantRecommendationSettings.unassignedLicenseCounts ?? {}).reduce((sum, value) => sum + value, 0)

  return {
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
}

export async function runAssessment(tenantId: string, runId?: string): Promise<AssessmentSnapshotWithSavings> {
  const storage = getStorageClients()
  const assessmentId = runId ?? uuidv4()
  const timestamp = new Date().toISOString()
  const users = getMockUsers()
  const skus = buildSkus()
  const recommendations = buildRecommendations(users, tenantRecommendationSettings)

  const savings = sumRecommendationSavings(recommendations, {
    'sku-basic': 2000,
    'sku-standard': 4000,
    'sku-premium': 8000,
    'sku-enterprise': 12000,
  })

  const healthScore = calculateHealthScore({
    totalLicenses: users.reduce((sum, user) => sum + user.assignedLicenses.length, 0) + Object.values(tenantRecommendationSettings.unassignedLicenseCounts ?? {}).reduce((sum, value) => sum + value, 0),
    assignedLicenses: users.reduce((sum, user) => sum + user.assignedLicenses.length, 0),
    inactiveUsers: users.filter((user) =>
      user.accountEnabled &&
      user.assignedLicenses.length > 0 &&
      (!user.lastSignInDateTime || new Date(user.lastSignInDateTime).getTime() < Date.now() - (tenantRecommendationSettings.inactiveDaysThreshold ?? 90) * 24 * 60 * 60 * 1000),
    ).length,
    disabledWithLicense: users.filter((user) => !user.accountEnabled && user.assignedLicenses.length > 0).length,
    guestsWithLicense: users.filter((user) => user.userType === 'Guest' && user.assignedLicenses.length > 0).length,
    unassignedSeats: Object.values(tenantRecommendationSettings.unassignedLicenseCounts ?? {}).reduce((sum, value) => sum + value, 0),
    totalMonthlySavingsUSD: savings.estMonthlySavingsUSD,
    recommendations,
  })

  const summary = buildSummary(users, savings)
  const snapshot: AssessmentSnapshotWithSavings = {
    tenantId,
    tenantName: 'Mock Tenant',
    runId: assessmentId,
    status: 'complete',
    createdAt: timestamp,
    completedAt: timestamp,
    users,
    skus,
    recommendations,
    healthScore,
    summary,
    signInActivityAvailable: true,
    timestamp,
    savings: {
      monthlyUSD: savings.estMonthlySavingsUSD,
      annualUSD: savings.annualSavingsUSD,
    },
  }

  await storage.blobs.uploadAssessment(assessmentId, JSON.stringify(snapshot))
  await storage.tables.upsertAssessmentIndex({
    partitionKey: assessmentId,
    rowKey: assessmentId,
    runId: assessmentId,
    tenantId,
    status: 'complete',
    createdAt: timestamp,
    completedAt: timestamp,
  })

  return snapshot
}
