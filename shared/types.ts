// ─────────────────────────────────────────────────────────────────────────────
// LicenseIQ — Shared Types
// Used by: backend, worker, frontend
// ─────────────────────────────────────────────────────────────────────────────

// ─── Graph Data ───────────────────────────────────────────────────────────────

export interface GraphUser {
  id: string
  displayName: string
  userPrincipalName: string
  accountEnabled: boolean
  userType: 'Member' | 'Guest'
  assignedLicenses: { skuId: string }[]
  createdDateTime: string
  lastSignInDateTime: string | null // null = signInActivity unavailable
}

export interface GraphSku {
  skuId: string
  skuPartNumber: string
  consumedUnits: number
  prepaidUnits: {
    enabled: number
    suspended: number
    warning: number
  }
  servicePlans: { servicePlanId: string; servicePlanName: string }[]
}

export interface GraphOrganization {
  id: string
  displayName: string
  verifiedDomains: { name: string; isDefault: boolean }[]
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export type RecommendationType = 'remove' | 'downgrade' | 'reassign' | 'review'
export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export type WasteRuleType =
  | 'INACTIVE_USER'
  | 'DISABLED_ACCOUNT_LICENSED'
  | 'GUEST_WITH_LICENSE'
  | 'UNASSIGNED_LICENSES'
  | 'POSSIBLE_OVERPROVISION'

export interface Recommendation {
  id: string
  ruleType: WasteRuleType
  type: RecommendationType
  title: string
  rationale: string
  affectedUsers: string[] // userPrincipalNames
  affectedUserCount: number
  fromSkuId?: string
  fromSkuName?: string
  toSkuId?: string
  toSkuName?: string
  estMonthlySavingsUSD: number   // stored as cents (integer)
  annualSavingsUSD: number       // stored as cents (integer)
  costMissing: boolean
  confidence: ConfidenceLevel
  remediationSteps: string[]
}

// ─── Health Score ─────────────────────────────────────────────────────────────

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface HealthScoreDriver {
  label: string
  score: number      // 0–100 for this component
  weight: number     // 0–1, what fraction of total
  impact: 'positive' | 'negative' | 'neutral'
}

export interface HealthScore {
  score: number          // 0–100
  grade: HealthGrade
  drivers: HealthScoreDriver[]   // top 3 drivers
}

// ─── Assessment Snapshot ──────────────────────────────────────────────────────

export type AssessmentStatus = 'queued' | 'running' | 'complete' | 'failed'

export interface AssessmentSnapshot {
  tenantId: string
  tenantName: string
  runId: string
  status: AssessmentStatus
  createdAt: string        // ISO timestamp
  completedAt: string | null
  users: GraphUser[]
  skus: GraphSku[]
  recommendations: Recommendation[]
  healthScore: HealthScore
  summary: AssessmentSummary
  signInActivityAvailable: boolean
  error?: string
}

export interface AssessmentSummary {
  totalLicenses: number
  assignedLicenses: number
  utilizationPct: number         // 0–100
  inactiveUsers: number
  disabledWithLicense: number
  guestsWithLicense: number
  unassignedSeats: number
  totalMonthlySavingsUSD: number // cents
  totalAnnualSavingsUSD: number  // cents
}

// ─── Tenant Settings ──────────────────────────────────────────────────────────

export interface UnitCosts {
  [skuPartNumber: string]: number  // monthly cost in cents (e.g. 2200 = $22.00)
}

export interface TenantSettings {
  tenantId: string
  inactivityThresholdDays: 30 | 60 | 90
  currency: 'USD' | 'NGN' | 'GBP' | 'EUR'
  unitCosts: UnitCosts
  updatedAt: string
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface StartAssessmentResponse {
  runId: string
  tenantId: string
  status: AssessmentStatus
}

export interface AssessmentStatusResponse {
  runId: string
  status: AssessmentStatus
  createdAt: string
  completedAt: string | null
  error?: string
}

export interface AssessmentRunListItem {
  runId: string
  tenantId: string
  tenantName: string
  status: AssessmentStatus
  createdAt: string
  completedAt: string | null
  healthScore?: number
  healthGrade?: HealthGrade
  totalMonthlySavingsUSD?: number
  reportUrl?: string
}

export interface GenerateReportResponse {
  runId: string
  reportUrl: string   // SAS URL or local path in MOCK_MODE
  expiresAt: string
}

// ─── SKU Reference (for savings calculator) ───────────────────────────────────

export const KNOWN_SKU_COSTS_USD_CENTS: Record<string, number> = {
  ENTERPRISEPREMIUM: 5700,         // E5  $57.00/user/month
  ENTERPRISEPACK: 3600,            // E3  $36.00/user/month
  SPB: 2650,                       // Business Premium $26.50
  O365_BUSINESS_ESSENTIALS: 600,   // Business Basic $6.00
  STANDARDPACK: 1250,              // E1 $12.50
  FLOW_FREE: 0,
  POWER_BI_STANDARD: 0,
}
