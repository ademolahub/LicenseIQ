import { BlobSASPermissions, ContainerClient, generateBlobSASQueryParameters, SASProtocol, StorageSharedKeyCredential } from '@azure/storage-blob'
import { BlobsClient } from '../types'

/**
 * Real Azure Blob Storage implementation
 * Connects to Azure Blob Storage via connection string
 */
export class AzureBlobsClient implements BlobsClient {
  private assessmentsContainer: ContainerClient
  private reportsContainer: ContainerClient
  private accountName: string
  private accountKey: string

  constructor(connectionString: string) {
    const accountMatch = connectionString.match(/AccountName=([^;]+)/)
    const keyMatch = connectionString.match(/AccountKey=([^;]+)/)

    if (!accountMatch || !keyMatch) {
      throw new Error('Invalid connection string format')
    }

    const accountName = accountMatch[1]
    const accountKey = keyMatch[1]
    const credential = new StorageSharedKeyCredential(accountName, accountKey)

    this.accountName = accountName
    this.accountKey = accountKey
    this.assessmentsContainer = new ContainerClient(
      `https://${accountName}.blob.core.windows.net/assessments`,
      credential,
    )
    this.reportsContainer = new ContainerClient(
      `https://${accountName}.blob.core.windows.net/reports`,
      credential,
    )
  }

  async uploadAssessment(assessmentId: string, data: string): Promise<void> {
    const blockBlobClient = this.assessmentsContainer.getBlockBlobClient(assessmentId)
    await blockBlobClient.upload(Buffer.from(data, 'utf-8'), Buffer.from(data, 'utf-8').length)
  }

  async getAssessment(assessmentId: string): Promise<string | null> {
    try {
      const blockBlobClient = this.assessmentsContainer.getBlockBlobClient(assessmentId)
      const downloadedData = await blockBlobClient.downloadToBuffer()
      return downloadedData.toString('utf-8')
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'BlobNotFound') {
        return null
      }
      throw error
    }
  }

  async uploadReport(reportId: string, data: Buffer): Promise<void> {
    const blockBlobClient = this.reportsContainer.getBlockBlobClient(reportId)
    await blockBlobClient.uploadData(data)
  }

  async getReport(reportId: string): Promise<Buffer | null> {
    try {
      const blockBlobClient = this.reportsContainer.getBlockBlobClient(reportId)
      return await blockBlobClient.downloadToBuffer()
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'BlobNotFound') {
        return null
      }
      throw error
    }
  }

  async getReportUrl(reportId: string, expiresInSeconds = 3600): Promise<string> {
    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000)
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: 'reports',
        blobName: reportId,
        permissions: BlobSASPermissions.parse('r'),
        protocol: SASProtocol.Https,
        startsOn: new Date(Date.now() - 5 * 60 * 1000),
        expiresOn,
      },
      new StorageSharedKeyCredential(this.accountName, this.accountKey),
    ).toString()

    return `https://${this.accountName}.blob.core.windows.net/reports/${reportId}?${sasToken}`
  }

}
