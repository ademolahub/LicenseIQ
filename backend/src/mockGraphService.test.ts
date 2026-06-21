import { getMockUsers } from './mockGraphService'
import { GraphUser } from '../../shared/types'

function isGraphUser(user: unknown): user is GraphUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    typeof (user as GraphUser).id === 'string' &&
    typeof (user as GraphUser).displayName === 'string' &&
    typeof (user as GraphUser).userPrincipalName === 'string' &&
    typeof (user as GraphUser).accountEnabled === 'boolean' &&
    ((user as GraphUser).userType === 'Member' || (user as GraphUser).userType === 'Guest') &&
    Array.isArray((user as GraphUser).assignedLicenses) &&
    typeof (user as GraphUser).createdDateTime === 'string' &&
    ((user as GraphUser).lastSignInDateTime === null || typeof (user as GraphUser).lastSignInDateTime === 'string')
  )
}

function hasInactiveLicensedUser(users: GraphUser[]) {
  return users.some((user) =>
    user.accountEnabled === true &&
    user.assignedLicenses.length > 0 &&
    user.lastSignInDateTime !== null &&
    new Date(user.lastSignInDateTime).getTime() < Date.now() - 1000 * 60 * 60 * 24 * 90
  )
}

function hasDisabledLicensedUser(users: GraphUser[]) {
  return users.some((user) => !user.accountEnabled && user.assignedLicenses.length > 0)
}

function hasGuestWithLicense(users: GraphUser[]) {
  return users.some((user) => user.userType === 'Guest' && user.assignedLicenses.length > 0)
}

function hasUnassignedSkuCandidate(users: GraphUser[]) {
  return users.some((user) => user.assignedLicenses.length === 0)
}

function hasOverprovisionCandidate(users: GraphUser[]) {
  return users.some((user) => user.assignedLicenses.length >= 2)
}

async function runTests() {
  const users = getMockUsers()

  if (users.length !== 47) {
    throw new Error(`Expected 47 users, got ${users.length}`)
  }

  if (!users.every(isGraphUser)) {
    throw new Error('One or more users do not match GraphUser shape')
  }

  if (!hasInactiveLicensedUser(users)) {
    throw new Error('No inactive licensed user found')
  }

  if (!hasDisabledLicensedUser(users)) {
    throw new Error('No disabled licensed user found')
  }

  if (!hasGuestWithLicense(users)) {
    throw new Error('No guest licensed user found')
  }

  if (!hasUnassignedSkuCandidate(users)) {
    throw new Error('No unassigned SKU candidate found')
  }

  if (!hasOverprovisionCandidate(users)) {
    throw new Error('No overprovision candidate found')
  }

  console.log('✅ mockGraphService tests passed')
}

runTests().catch((error) => {
  console.error(error)
  process.exit(1)
})
