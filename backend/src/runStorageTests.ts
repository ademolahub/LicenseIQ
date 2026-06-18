/**
 * Storage tests runner
 * Run with: npm run test:storage
 */

import { runStorageTests } from './storage/tests'

runStorageTests().catch((error) => {
  console.error('Test execution failed:', error)
  process.exit(1)
})
