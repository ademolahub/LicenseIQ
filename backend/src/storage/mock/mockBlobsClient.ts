import { BlobsClient } from '../types'

/**
 * Mock implementation of Blobs Client
 * Stores blobs in-memory with Map structure
 */
export class MockBlobsClient implements BlobsClient {
  private assessmentsContainer: Map<string, string> = new Map()
  private reportsContainer: Map<string, Buffer> = new Map()

  async uploadAssessment(assessmentId: string, data: string): Promise<void> {
    this.assessmentsContainer.set(assessmentId, data)
  }

  async getAssessment(assessmentId: string): Promise<string | null> {
    return this.assessmentsContainer.get(assessmentId) || null
  }

  async uploadReport(reportId: string, data: Buffer): Promise<void> {
    this.reportsContainer.set(reportId, data)
  }

  async getReport(reportId: string): Promise<Buffer | null> {
    return this.reportsContainer.get(reportId) || null
  }

  async getReportUrl(reportId: string): Promise<string> {
    return `mock://reports/${reportId}`
  }
}
