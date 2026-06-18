import { ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { BlobsClient } from '../types'

/**
 * Real Azure Blob Storage implementation
 * Connects to Azure Blob Storage via connection string
 */
export class AzureBlobsClient implements BlobsClient {
  private assessmentsContainer: ContainerClient
  private reportsContainer: ContainerClient

  constructor(connectionString: string) {
    // Parse connection string to get account name and key
    const accountMatch = connectionString.match(/AccountName=([^;]+)/)
    const keyMatch = connectionString.match(/AccountKey=([^;]+)/)

    if (!accountMatch || !keyMatch) {
      throw new Error('Invalid connection string format')
    }

    const accountName = accountMatch[1]
    const accountKey = keyMatch[1]
    const credential = new StorageSharedKeyCredential(accountName, accountKey)

    this.assessmentsContainer = new ContainerClient(
      `https://${accountName}.blob.core.windows.net/assessments`,
      credential
    )
    this.reportsContainer = new ContainerClient(
      `https://${accountName}.blob.core.windows.net/reports`,
      credential
    )
  }

  async uploadAssessment(assessmentId: string, data: string): Promise<void> {
    const blockBlobClient = this.assessmentsContainer.getBlockBlobClient(assessmentId)
    await blockBlobClient.upload(Buffer.from(data, 'utf-8'), Buffer.from(data, 'utf-8').length)
  }

  async getAssessment(assessmentId: string): Promise<string | null> {
    try {
      const blockBlobClient = this.assessmentsContainer.getBlockBlobClient(assessmentId)
      const downloadBlockBlobResponse = await blockBlobClient.download(0)
      const downloadedData = await this.streamToString(downloadBlockBlobResponse.readableStreamBody!)
      return downloadedData
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'BlobNotFound') {
        return null
      }
      throw error
    }
  }

  async uploadReport(reportId: string, data: string): Promise<void> {
    const blockBlobClient = this.reportsContainer.getBlockBlobClient(reportId)
    await blockBlobClient.upload(Buffer.from(data, 'utf-8'), Buffer.from(data, 'utf-8').length)
  }

  async getReport(reportId: string): Promise<string | null> {
    try {
      const blockBlobClient = this.reportsContainer.getBlockBlobClient(reportId)
      const downloadBlockBlobResponse = await blockBlobClient.download(0)
      const downloadedData = await this.streamToString(downloadBlockBlobResponse.readableStreamBody!)
      return downloadedData
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'BlobNotFound') {
        return null
      }
      throw error
    }
  }

  private async streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: string[] = []
      readableStream.on('data', (data: Buffer) => {
        chunks.push(data.toString('utf8'))
      })
      readableStream.on('end', () => {
        resolve(chunks.join(''))
      })
      readableStream.on('error', reject)
    })
  }
}
