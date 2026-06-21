import { HealthGrade, HealthScore, HealthScoreDriver, Recommendation } from '../../shared/types'

export interface ScoreInputs {
  totalLicenses: number
  assignedLicenses: number
  inactiveUsers: number
  disabledWithLicense: number
  guestsWithLicense: number
  unassignedSeats: number
  totalMonthlySavingsUSD: number
  recommendations: Recommendation[]
}

function getGrade(score: number): HealthGrade {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function buildDriver(label: string, score: number, weight: number, impact: 'positive' | 'negative' | 'neutral'): HealthScoreDriver {
  return { label, score: clamp(score, 0, 100), weight, impact }
}

export function calculateHealthScore(inputs: ScoreInputs): HealthScore {
  const utilizationPct = inputs.totalLicenses === 0
    ? 100
    : Math.round((inputs.assignedLicenses / inputs.totalLicenses) * 100)

  const utilizationScore = 100 - Math.min(100, Math.abs(100 - utilizationPct))
  const inactiveScore = clamp(100 - inputs.inactiveUsers * 10, 0, 100)
  const disabledScore = clamp(100 - inputs.disabledWithLicense * 15, 0, 100)
  const guestScore = clamp(100 - inputs.guestsWithLicense * 12, 0, 100)

  const drivers = [
    buildDriver('License utilization', utilizationScore, 0.35, 'neutral'),
    buildDriver('Inactive licensed users', inactiveScore, 0.25, inputs.inactiveUsers > 0 ? 'negative' : 'positive'),
    buildDriver('Disabled accounts with licenses', disabledScore, 0.2, inputs.disabledWithLicense > 0 ? 'negative' : 'positive'),
    buildDriver('Guest licenses', guestScore, 0.2, inputs.guestsWithLicense > 0 ? 'negative' : 'positive'),
  ]

  const weightedScore = drivers.reduce((sum, driver) => sum + driver.score * driver.weight, 0)
  const score = clamp(Math.round(weightedScore), 0, 100)
  const grade = getGrade(score)

  const topDrivers = drivers
    .sort((a, b) => b.weight * Math.abs(50 - b.score) - a.weight * Math.abs(50 - a.score))
    .slice(0, 3)

  return {
    score,
    grade,
    drivers: topDrivers,
  }
}
