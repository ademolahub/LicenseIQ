import { v4 as uuidv4 } from 'uuid'
import { GraphUser, Recommendation, RecommendationType, WasteRuleType, ConfidenceLevel } from '../../shared/types'

export interface TenantRecommendationSettings {
  skuPricing: Record<
    string,
    {
      skuId: string
      skuName: string
      monthlyUSD: number
    }
  >
  inactiveDaysThreshold?: number
  unassignedLicenseCounts?: Record<string, number>
  overprovisionThreshold?: number
}

const defaultSettings: Required<Pick<TenantRecommendationSettings, 'inactiveDaysThreshold' | 'overprovisionThreshold'>> = {
  inactiveDaysThreshold: 90,
  overprovisionThreshold: 1,
}

function formatRecommendation(
  ruleType: WasteRuleType,
  type: RecommendationType,
  title: string,
  rationale: string,
  affectedUsers: string[],
  estMonthlySavingsUSD: number,
  annualSavingsUSD: number,
  confidence: ConfidenceLevel,
  remediationSteps: string[],
  costMissing: boolean,
  fromSkuId?: string,
  fromSkuName?: string,
  toSkuId?: string,
  toSkuName?: string,
): Recommendation {
  return {
    id: uuidv4(),
    ruleType,
    type,
    title,
    rationale,
    affectedUsers,
    affectedUserCount: affectedUsers.length,
    fromSkuId,
    fromSkuName,
    toSkuId,
    toSkuName,
    estMonthlySavingsUSD,
    annualSavingsUSD,
    costMissing,
    confidence,
    remediationSteps,
  }
}

function getPricingForSku(settings: TenantRecommendationSettings, skuId: string) {
  return settings.skuPricing[skuId]
}

function sumAssignedLicenseSavings(users: GraphUser[], settings: TenantRecommendationSettings) {
  let total = 0
  let missingCost = false

  for (const user of users) {
    for (const license of user.assignedLicenses) {
      const pricing = getPricingForSku(settings, license.skuId)
      if (!pricing) {
        missingCost = true
        continue
      }
      total += pricing.monthlyUSD
    }
  }

  return { total, missingCost }
}

function sumOverprovisionSavings(users: GraphUser[], settings: TenantRecommendationSettings) {
  let total = 0
  let missingCost = false

  for (const user of users) {
    const extraLicenseCount = Math.max(0, user.assignedLicenses.length - 1)
    if (extraLicenseCount === 0) continue

    const costs = user.assignedLicenses
      .map((license) => getPricingForSku(settings, license.skuId))
      .filter((pricing): pricing is { monthlyUSD: number } => Boolean(pricing))
      .map((pricing) => pricing.monthlyUSD)

    if (costs.length < user.assignedLicenses.length) {
      missingCost = true
    }

    const removableCost = costs.sort((a, b) => a - b).slice(0, extraLicenseCount).reduce((sum, cost) => sum + cost, 0)
    total += removableCost
  }

  return { total, missingCost }
}

function buildInactiveUserRecommendation(users: GraphUser[], settings: TenantRecommendationSettings) {
  const cutoff = defaultSettings.inactiveDaysThreshold
  const staleDate = Date.now() - cutoff * 24 * 60 * 60 * 1000

  const affected = users.filter((user) =>
    user.accountEnabled &&
    user.assignedLicenses.length > 0 &&
    (!user.lastSignInDateTime || new Date(user.lastSignInDateTime).getTime() < staleDate),
  )

  if (affected.length === 0) return null

  const { total, missingCost } = sumAssignedLicenseSavings(affected, settings)

  return formatRecommendation(
    'INACTIVE_USER',
    'remove',
    'Inactive licensed users still have paid licenses',
    `Found ${affected.length} licensed user(s) who have not signed in for at least ${cutoff} days. Review these accounts and remove unused licenses.`,
    affected.map((user) => user.userPrincipalName),
    total,
    total * 12,
    'Medium',
    ['Review inactive user accounts', 'Remove unused licenses', 'Monitor sign-in activity regularly'],
    missingCost,
  )
}

function buildDisabledAccountLicensedRecommendation(users: GraphUser[], settings: TenantRecommendationSettings) {
  const affected = users.filter((user) => !user.accountEnabled && user.assignedLicenses.length > 0)
  if (affected.length === 0) return null

  const { total, missingCost } = sumAssignedLicenseSavings(affected, settings)

  return formatRecommendation(
    'DISABLED_ACCOUNT_LICENSED',
    'remove',
    'Disabled accounts still retain paid licenses',
    `Found ${affected.length} disabled account(s) that still have assigned licenses. These licenses can likely be recovered.`,
    affected.map((user) => user.userPrincipalName),
    total,
    total * 12,
    'High',
    ['Remove licenses from disabled accounts', 'Reassign recovered licenses to active users', 'Validate disabled user policy'],
    missingCost,
  )
}

function buildGuestWithLicenseRecommendation(users: GraphUser[], settings: TenantRecommendationSettings) {
  const affected = users.filter((user) => user.userType === 'Guest' && user.assignedLicenses.length > 0)
  if (affected.length === 0) return null

  const { total, missingCost } = sumAssignedLicenseSavings(affected, settings)

  return formatRecommendation(
    'GUEST_WITH_LICENSE',
    'remove',
    'Guest users should not hold paid licenses',
    `Found ${affected.length} guest user(s) with assigned licenses. Guests with licenses are typically waste and should be reviewed.`,
    affected.map((user) => user.userPrincipalName),
    total,
    total * 12,
    'High',
    ['Review guest licenses', 'Remove licenses from guest accounts', 'Use guest license policies'],
    missingCost,
  )
}

function buildUnassignedLicensesRecommendation(users: GraphUser[], settings: TenantRecommendationSettings) {
  const affected = users.filter((user) => user.assignedLicenses.length === 0)
  if (affected.length === 0) return null

  const unassignedCounts = settings.unassignedLicenseCounts ?? {}
  const availableCount = Object.values(unassignedCounts).reduce((sum, count) => sum + count, 0)
  let total = 0
  let missingCost = false

  if (availableCount > 0) {
    const costs = Object.entries(unassignedCounts).map(([skuId, count]) => {
      const pricing = getPricingForSku(settings, skuId)
      if (!pricing) {
        missingCost = true
        return 0
      }
      return pricing.monthlyUSD * count
    })
    total = costs.reduce((sum, value) => sum + value, 0)
  } else {
    missingCost = true
  }

  return formatRecommendation(
    'UNASSIGNED_LICENSES',
    'review',
    'There are users without licenses while unused licenses exist',
    `Found ${affected.length} user(s) without assigned licenses. Review unassigned license inventory and allocate licenses where needed.`,
    affected.map((user) => user.userPrincipalName),
    total,
    total * 12,
    'Medium',
    ['Review license assignment gaps', 'Allocate unused licenses to active users', 'Monitor unassigned license inventory'],
    missingCost,
  )
}

function buildPossibleOverprovisionRecommendation(users: GraphUser[], settings: TenantRecommendationSettings) {
  const threshold = settings.overprovisionThreshold ?? defaultSettings.overprovisionThreshold
  const affected = users.filter((user) => user.assignedLicenses.length > threshold)
  if (affected.length === 0) return null

  const { total, missingCost } = sumOverprovisionSavings(affected, settings)

  const fromSkuId = affected[0].assignedLicenses[0]?.skuId
  const fromSkuName = fromSkuId ? getPricingForSku(settings, fromSkuId)?.skuName : undefined

  return formatRecommendation(
    'POSSIBLE_OVERPROVISION',
    'downgrade',
    'Users have more licenses than expected',
    `Found ${affected.length} user(s) with more than ${threshold} assigned licenses. Consider downgrading or removing redundant licenses.`,
    affected.map((user) => user.userPrincipalName),
    total,
    total * 12,
    'Medium',
    ['Review multi-licensed accounts', 'Remove redundant licenses', 'Align license assignments with actual user needs'],
    missingCost,
    fromSkuId,
    fromSkuName,
  )
}

export function buildRecommendations(
  users: GraphUser[],
  tenantSettings: TenantRecommendationSettings,
): Recommendation[] {
  const settings = {
    ...tenantSettings,
    inactiveDaysThreshold: tenantSettings.inactiveDaysThreshold ?? defaultSettings.inactiveDaysThreshold,
    overprovisionThreshold: tenantSettings.overprovisionThreshold ?? defaultSettings.overprovisionThreshold,
  }

  return [
    buildInactiveUserRecommendation(users, settings),
    buildDisabledAccountLicensedRecommendation(users, settings),
    buildGuestWithLicenseRecommendation(users, settings),
    buildUnassignedLicensesRecommendation(users, settings),
    buildPossibleOverprovisionRecommendation(users, settings),
  ].filter((recommendation): recommendation is Recommendation => recommendation !== null)
}
