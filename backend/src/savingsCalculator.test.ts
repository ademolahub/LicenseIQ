import { calculateRecommendationSavings, sumRecommendationSavings } from './savingsCalculator'
import { Recommendation } from '../../shared/types'

const unitCosts = {
  'sku-basic': 2000,
  'sku-standard': 4000,
  'sku-premium': 8000,
  'sku-enterprise': 12000,
}

const recommendation: Recommendation = {
  id: 'r1',
  ruleType: 'GUEST_WITH_LICENSE',
  type: 'remove',
  title: 'Guest license cleanup',
  rationale: 'Guest user has paid license',
  affectedUsers: ['guest@example.com'],
  affectedUserCount: 1,
  fromSkuId: 'sku-premium',
  fromSkuName: 'Premium',
  estMonthlySavingsUSD: 0,
  annualSavingsUSD: 0,
  costMissing: false,
  confidence: 'High',
  remediationSteps: ['Remove license'],
}

const missingSkuRecommendation: Recommendation = {
  ...recommendation,
  id: 'r2',
  fromSkuId: 'sku-missing',
  fromSkuName: 'Missing SKU',
  costMissing: false,
}

function testCalculateRecommendationSavings() {
  const result = calculateRecommendationSavings(recommendation, unitCosts)
  if (result.costMissing) throw new Error('Expected costMissing false')
  if (result.estMonthlySavingsUSD !== 8000) throw new Error(`Expected 8000 got ${result.estMonthlySavingsUSD}`)
  if (result.annualSavingsUSD !== 96000) throw new Error(`Expected 96000 got ${result.annualSavingsUSD}`)

  const missingResult = calculateRecommendationSavings(missingSkuRecommendation, unitCosts)
  if (!missingResult.costMissing) throw new Error('Expected missing SKU to set costMissing true')

  const total = sumRecommendationSavings([recommendation, missingSkuRecommendation], unitCosts)
  if (total.estMonthlySavingsUSD !== 8000) throw new Error(`Expected total 8000 got ${total.estMonthlySavingsUSD}`)
  if (total.annualSavingsUSD !== 96000) throw new Error(`Expected total 96000 got ${total.annualSavingsUSD}`)

  console.log('✅ savingsCalculator tests passed')
}

testCalculateRecommendationSavings()
