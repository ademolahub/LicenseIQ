import { Recommendation, UnitCosts } from '../../shared/types'

export interface SavingsResult {
  estMonthlySavingsUSD: number
  annualSavingsUSD: number
  costMissing: boolean
}

function normalizeCostKey(key: string): string {
  return key.trim().toLowerCase()
}

function getMonthlyCost(unitCosts: UnitCosts, skuKey: string): number | null {
  const normalizedKey = normalizeCostKey(skuKey)
  const directMatch = unitCosts[skuKey]
  if (typeof directMatch === 'number') {
    return directMatch
  }

  const fallbackKey = Object.keys(unitCosts).find((key) => normalizeCostKey(key) === normalizedKey)
  return fallbackKey ? unitCosts[fallbackKey] : null
}

export function calculateRecommendationSavings(
  recommendation: Recommendation,
  unitCosts: UnitCosts,
): SavingsResult {
  if (recommendation.costMissing) {
    return { estMonthlySavingsUSD: 0, annualSavingsUSD: 0, costMissing: true }
  }

  if (recommendation.estMonthlySavingsUSD > 0) {
    return {
      estMonthlySavingsUSD: recommendation.estMonthlySavingsUSD,
      annualSavingsUSD: recommendation.annualSavingsUSD,
      costMissing: false,
    }
  }

  const fromCost = recommendation.fromSkuId ? getMonthlyCost(unitCosts, recommendation.fromSkuId) : null
  const toCost = recommendation.toSkuId ? getMonthlyCost(unitCosts, recommendation.toSkuId) : null

  if (fromCost === null) {
    return { estMonthlySavingsUSD: 0, annualSavingsUSD: 0, costMissing: true }
  }

  const monthly = Math.max(0, fromCost - (toCost ?? 0))
  const costMissing = recommendation.toSkuId !== undefined && recommendation.toSkuId !== null && toCost === null

  return {
    estMonthlySavingsUSD: monthly,
    annualSavingsUSD: monthly * 12,
    costMissing,
  }
}

export function sumRecommendationSavings(
  recommendations: Recommendation[],
  unitCosts: UnitCosts,
): SavingsResult {
  let estMonthlySavingsUSD = 0
  let annualSavingsUSD = 0

  for (const recommendation of recommendations) {
    const savings = calculateRecommendationSavings(recommendation, unitCosts)
    if (savings.costMissing) continue
    estMonthlySavingsUSD += savings.estMonthlySavingsUSD
    annualSavingsUSD += savings.annualSavingsUSD
  }

  return { estMonthlySavingsUSD, annualSavingsUSD, costMissing: false }
}
