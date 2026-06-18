import { v4 as uuidv4 } from 'uuid'
import { QueueClient, QueueMessage } from '../types'

/**
 * Mock implementation of Queue Client
 * Stores messages in-memory with array (FIFO queue)
 */
export class MockQueueClient implements QueueClient {
  private queue: QueueMessage[] = []

  async enqueueAssessment(assessmentId: string, tenantId: string): Promise<string> {
    const messageId = uuidv4()
    const message: QueueMessage = {
      messageId,
      assessmentId,
      tenantId,
      createdAt: new Date().toISOString(),
    }
    this.queue.push(message)
    return messageId
  }

  async dequeueAssessment(): Promise<QueueMessage | null> {
    return this.queue.shift() || null
  }
}
