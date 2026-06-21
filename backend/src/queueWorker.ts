import { getStorageClients } from './storage'
import { runAssessment } from './assessmentRunner'

export async function processNextAssessment() {
  const storage = getStorageClients()
  const message = await storage.queue.dequeueAssessment()
  if (!message) {
    return null
  }

  const snapshot = await runAssessment(message.tenantId, message.assessmentId)

  await storage.tables.upsertAssessmentIndex({
    partitionKey: message.assessmentId,
    rowKey: message.assessmentId,
    runId: message.assessmentId,
    tenantId: message.tenantId,
    status: 'complete',
    createdAt: snapshot.createdAt,
    completedAt: snapshot.completedAt || new Date().toISOString(),
  })

  return { message, snapshot }
}
