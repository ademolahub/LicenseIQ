import { calculateHealthScore } from './healthScore'

function testCalculateHealthScore() {
  const inputs = {
    totalLicenses: 100,
    assignedLicenses: 90,
    inactiveUsers: 2,
    disabledWithLicense: 1,
    guestsWithLicense: 3,
    unassignedSeats: 5,
    totalMonthlySavingsUSD: 20000,
    recommendations: [],
  }

  const health = calculateHealthScore(inputs)
  if (typeof health.score !== 'number') throw new Error('Score must be a number')
  if (health.score < 0 || health.score > 100) throw new Error('Score must be 0-100')
  if (!['A', 'B', 'C', 'D', 'F'].includes(health.grade)) throw new Error('Invalid grade')
  if (!Array.isArray(health.drivers) || health.drivers.length !== 3) throw new Error('Expected 3 drivers')
  if (!health.drivers.every((driver) => typeof driver.label === 'string' && typeof driver.score === 'number')) {
    throw new Error('Driver shape invalid')
  }

  console.log('✅ healthScore tests passed')
}

testCalculateHealthScore()
