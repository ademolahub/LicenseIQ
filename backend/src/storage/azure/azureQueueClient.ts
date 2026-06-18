import { StorageSharedKeyCredential, QueueClient as AzureStorageQueueClient } from '@azure/storage-queue'
import { QueueClient, QueueMessage } from '../types'

/**
 * Real Azure Queue Storage implementation
 * Connects to Azure Queue Storage via connection string
 */
export class AzureQueueClient implements QueueClient {
  private queueClient: AzureStorageQueueClient

  constructor(connectionString: string) {
    // Parse connection string to get account name and key
    const accountMatch = connectionString.match(/AccountName=([^;]+)/)
    const keyMatch = connectionString.match(/AccountKey=([^;]+)/)

    if (!accountMatch || !keyMatch) {
      throw new Error('Invalid connection string format')
    }

    const accountName = accountMatch[1]
    const accountKey = keyMatch[1]
    const queueUrl = `https://${accountName}.queue.core.windows.net/assessments`
    const credential = new StorageSharedKeyCredential(accountName, accountKey)

    this.queueClient = new AzureStorageQueueClient(queueUrl, credential)
  }

  async enqueueAssessment(assessmentId: string, tenantId: string): Promise<string> {
    const message = JSON.stringify({
      assessmentId,
      tenantId,
      createdAt: new Date().toISOString(),
    })

    const sendMessageResponse = await this.queueClient.sendMessage(message)
    return sendMessageResponse.messageId
  }

  async dequeueAssessment(): Promise<QueueMessage | null> {
    const messages = await this.queueClient.receiveMessages()

    if (!messages.receivedMessageItems || messages.receivedMessageItems.length === 0) {
      return null
    }

    const azureMessage = messages.receivedMessageItems[0]
    const messageBody = JSON.parse(azureMessage.messageText)

    // Delete the message from the queue after receiving it
    await this.queueClient.deleteMessage(azureMessage.messageId, azureMessage.popReceipt)

    return {
      messageId: azureMessage.messageId,
      assessmentId: messageBody.assessmentId,
      tenantId: messageBody.tenantId,
      createdAt: messageBody.createdAt,
    }
  }
}
