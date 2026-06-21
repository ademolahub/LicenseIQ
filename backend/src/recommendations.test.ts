import { buildRecommendations, TenantRecommendationSettings } from './recommendations'
import { GraphUser, Recommendation, WasteRuleType } from '../../shared/types'

const skuPricing: TenantRecommendationSettings['skuPricing'] = {
  'sku-basic': { skuId: 'sku-basic', skuName: 'Basic', monthlyUSD: 20 },
  'sku-standard': { skuId: 'sku-standard', skuName: 'Standard', monthlyUSD: 40 },
  'sku-premium': { skuId: 'sku-premium', skuName: 'Premium', monthlyUSD: 80 },
  'sku-enterprise': { skuId: 'sku-enterprise', skuName: 'Enterprise', monthlyUSD: 120 },
}

const settings: TenantRecommendationSettings = {
  skuPricing,
  inactiveDaysThreshold: 60,
  overprovisionThreshold: 1,
  unassignedLicenseCounts: {
    'sku-basic': 2,
    'sku-standard': 1,
  },
}

const users: GraphUser[] = [
  {
    id: '1',
    displayName: 'Inactive Licensed User',
    userPrincipalName: 'inactive@example.com',
    accountEnabled: true,
    userType: 'Member',
    assignedLicenses: [{ skuId: 'sku-standard' }],
    createdDateTime: '2024-01-01T00:00:00Z',
    lastSignInDateTime: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    displayName: 'Disabled Licensed User',
    userPrincipalName: 'disabled@example.com',
    accountEnabled: false,
    userType: 'Member',
    assignedLicenses: [{ skuId: 'sku-basic' }],
    createdDateTime: '2024-02-01T00:00:00Z',
    lastSignInDateTime: '2024-04-01T00:00:00Z',
  },
  {
    id: '3',
    displayName: 'Guest With License',
    userPrincipalName: 'guest@example.com',
    accountEnabled: true,
    userType: 'Guest',
    assignedLicenses: [{ skuId: 'sku-premium' }],
    createdDateTime: '2024-03-01T00:00:00Z',
    lastSignInDateTime: '2024-06-01T00:00:00Z',
  },
  {
    id: '4',
    displayName: 'Unassigned User',
    userPrincipalName: 'unassigned@example.com',
    accountEnabled: true,
    userType: 'Member',
    assignedLicenses: [],
    createdDateTime: '2024-04-01T00:00:00Z',
    lastSignInDateTime: '2024-06-10T00:00:00Z',
  },
  {
    id: '5',
    displayName: 'Overprovision User',
    userPrincipalName: 'overprovision@example.com',
    accountEnabled: true,
    userType: 'Member',
    assignedLicenses: [{ skuId: 'sku-enterprise' }, { skuId: 'sku-premium' }],
    createdDateTime: '2024-05-01T00:00:00Z',
    lastSignInDateTime: '2024-06-15T00:00:00Z',
  },
  {
    id: '6',
    displayName: 'Clean User',
    userPrincipalName: 'clean@example.com',
    accountEnabled: true,
    userType: 'Member',
    assignedLicenses: [{ skuId: 'sku-basic' }],
    createdDateTime: '2026-05-01T00:00:00Z',
    lastSignInDateTime: '2026-06-15T00:00:00Z',
  },
]

function assertRecommendationFields(recommendation: Recommendation) {
  const requiredFields = [
    'id',
    'ruleType',
    'type',
    'title',
    'rationale',
    'affectedUsers',
    'affectedUserCount',
    'estMonthlySavingsUSD',
    'annualSavingsUSD',
    'confidence',
    'remediationSteps',
    'costMissing',
  ] as const

  for (const field of requiredFields) {
    if (!(field in recommendation)) {
      throw new Error(`Recommendation missing field: ${field}`)
    }
  }

  if (!Array.isArray(recommendation.affectedUsers)) {
    throw new Error('affectedUsers must be an array')
  }
}

function testBuildRecommendations() {
  const recommendations = buildRecommendations(users, settings)

  if (recommendations.length < 5) {
    throw new Error(`Expected at least 5 recommendations, got ${recommendations.length}`)
  }

  const ruleTypes = new Set<WasteRuleType>(recommendations.map((rec) => rec.ruleType))
  const requiredRules: WasteRuleType[] = [
    'INACTIVE_USER',
    'DISABLED_ACCOUNT_LICENSED',
    'GUEST_WITH_LICENSE',
    'UNASSIGNED_LICENSES',
    'POSSIBLE_OVERPROVISION',
  ]

  for (const rule of requiredRules) {
    if (!ruleTypes.has(rule)) {
      throw new Error(`Missing recommendation for rule ${rule}`)
    }
  }

  for (const recommendation of recommendations) {
    assertRecommendationFields(recommendation)
  }

  const cleanUserRules = buildRecommendations(
    users.filter((user) => user.userPrincipalName === 'clean@example.com'),
    settings,
  )

  if (cleanUserRules.length !== 0) {
    throw new Error('Clean user produced recommendations')
  }

  console.log('✅ buildRecommendations tests passed')
}

testBuildRecommendations()
