async function testQueueWorker() {
  process.env.MOCK_MODE = 'true'
  const { getStorageClients } = await import('./storage')
  const { processNextAssessment } = await import('./queueWorker')

  const storage = getStorageClients()
  const messageId = await storage.queue.enqueueAssessment('test-run', 'mock-tenant')

  const result = await processNextAssessment()
  if (!result) throw new Error('Queue worker did not process a message')
  if (result.message.messageId !== messageId) throw new Error('Processed wrong queue message')

  const assessmentIndex = await storage.tables.getAssessmentIndex('test-run')
  if (!assessmentIndex || assessmentIndex.status !== 'complete') {
    throw new Error('Assessment was not marked complete in Table storage')
  }

  console.log('✅ queueWorker tests passed')
}

testQueueWorker().catch((error) => {
  console.error(error)
  process.exit(1)
})
