import { GraphUser } from '../../shared/types'

const skuIds = ['sku-basic', 'sku-standard', 'sku-premium', 'sku-enterprise']

function makeUser(overrides: Partial<GraphUser> = {}): GraphUser {
  const now = new Date()
  const createdAt = new Date(now.getTime() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365)).toISOString()
  const lastSignInDateTime = overrides.lastSignInDateTime ?? new Date(now.getTime() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 180)).toISOString()

  return {
    id: overrides.id ?? crypto.randomUUID(),
    displayName: overrides.displayName ?? `User ${Math.floor(Math.random() * 10000)}`,
    userPrincipalName: overrides.userPrincipalName ?? `user${Math.floor(Math.random() * 10000)}@example.com`,
    accountEnabled: overrides.accountEnabled ?? true,
    userType: overrides.userType ?? 'Member',
    assignedLicenses: overrides.assignedLicenses ?? [],
    createdDateTime: overrides.createdDateTime ?? createdAt,
    lastSignInDateTime: overrides.lastSignInDateTime === undefined ? lastSignInDateTime : overrides.lastSignInDateTime,
  }
}

const baseUsers: GraphUser[] = [
  makeUser({
    displayName: 'Inactive Licensed User',
    userPrincipalName: 'inactive.licensed@example.com',
    accountEnabled: true,
    assignedLicenses: [{ skuId: 'sku-standard' }],
    lastSignInDateTime: '2023-12-05T08:15:00Z',
  }),
  makeUser({
    displayName: 'Disabled Licensed User',
    userPrincipalName: 'disabled.licensed@example.com',
    accountEnabled: false,
    assignedLicenses: [{ skuId: 'sku-basic' }],
    lastSignInDateTime: '2024-04-10T10:30:00Z',
  }),
  makeUser({
    displayName: 'Guest With License',
    userPrincipalName: 'guest.licensed@example.com',
    userType: 'Guest',
    assignedLicenses: [{ skuId: 'sku-premium' }],
    lastSignInDateTime: '2024-05-20T14:45:00Z',
  }),
  makeUser({
    displayName: 'Unassigned SKU Candidate',
    userPrincipalName: 'unassigned.sku@example.com',
    assignedLicenses: [],
    lastSignInDateTime: '2024-05-28T09:00:00Z',
  }),
  makeUser({
    displayName: 'Overprovision Candidate',
    userPrincipalName: 'overprovision@example.com',
    assignedLicenses: [{ skuId: 'sku-enterprise' }, { skuId: 'sku-premium' }],
    lastSignInDateTime: '2024-06-04T11:30:00Z',
  }),
]

const additionalUsers: GraphUser[] = Array.from({ length: 42 }, (_, index) => {
  const licenseCount = index % 3 === 0 ? 0 : 1
  const isGuest = index % 7 === 0
  const accountEnabled = index % 10 === 0 ? false : true
  const assignedLicenses = licenseCount
    ? [{ skuId: skuIds[index % skuIds.length] }]
    : []

  return makeUser({
    displayName: `Mock User ${index + 1}`,
    userPrincipalName: `mock.user.${index + 1}@example.com`,
    userType: isGuest ? 'Guest' : 'Member',
    accountEnabled,
    assignedLicenses,
    lastSignInDateTime: accountEnabled
      ? new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * 24).toISOString()
      : new Date(Date.now() - (index + 40) * 1000 * 60 * 60 * 24).toISOString(),
  })
})

const users: GraphUser[] = [...baseUsers, ...additionalUsers]

export function getMockUsers(): GraphUser[] {
  return users
}
