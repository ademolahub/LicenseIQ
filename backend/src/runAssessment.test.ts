async function testAssessmentRunner() {
  process.env.MOCK_MODE = 'true'
  const { runAssessment } = await import('./assessmentRunner')
  const { getStorageClients } = await import('./storage')

  const snapshot = await runAssessment('mock-tenant')
  const storage = getStorageClients()

  const stored = await storage.blobs.getAssessment(snapshot.runId)
  if (!stored) throw new Error('Snapshot was not stored in blob storage')

  const parsed = JSON.parse(stored)
  const requiredFields = ['tenantId', 'runId', 'timestamp', 'users', 'skus', 'recommendations', 'healthScore', 'savings']
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new Error(`Snapshot missing field: ${field}`)
    }
  }

  console.log('✅ assessmentRunner tests passed')
}

testAssessmentRunner().catch((error) => {
  console.error(error)
  process.exit(1)
})
