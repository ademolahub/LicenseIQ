import { TenantRecommendationSettings } from './recommendations'

export const tenantRecommendationSettings: TenantRecommendationSettings = {
  skuPricing: {
    'sku-basic': { skuId: 'sku-basic', skuName: 'Basic', monthlyUSD: 20 },
    'sku-standard': { skuId: 'sku-standard', skuName: 'Standard', monthlyUSD: 40 },
    'sku-premium': { skuId: 'sku-premium', skuName: 'Premium', monthlyUSD: 80 },
    'sku-enterprise': { skuId: 'sku-enterprise', skuName: 'Enterprise', monthlyUSD: 120 },
  },
  inactiveDaysThreshold: 90,
  overprovisionThreshold: 1,
  unassignedLicenseCounts: {
    'sku-basic': 2,
    'sku-standard': 1,
  },
}
