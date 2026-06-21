// Storage types and interfaces

export interface TableEntity {
  partitionKey: string
  rowKey: string
  [key: string]: unknown
}

export interface TenantEntity extends TableEntity {
  tenantId: string
  tenantName: string
  createdAt: string
  lastUpdated: string
}

export interface AssessmentIndexEntity extends TableEntity {
  runId: string
  tenantId: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  createdAt: string
  completedAt?: string
}

export interface TenantSettingsEntity extends TableEntity {
  tenantId: string
  settingKey: string
  settingValue: string
  lastUpdated: string
}

export interface QueueMessage {
  messageId: string
  assessmentId: string
  tenantId: string
  createdAt: string
}

export interface StorageClients {
  tables: TablesClient
  blobs: BlobsClient
  queue: QueueClient
}

export interface TablesClient {
  upsertTenant(entity: TenantEntity): Promise<void>
  getTenant(tenantId: string): Promise<TenantEntity | null>
  upsertAssessmentIndex(entity: AssessmentIndexEntity): Promise<void>
  getAssessmentIndex(runId: string): Promise<AssessmentIndexEntity | null>
  listAssessmentIndexes(): Promise<AssessmentIndexEntity[]>
  upsertTenantSettings(entity: TenantSettingsEntity): Promise<void>
  getTenantSettings(tenantId: string, settingKey: string): Promise<TenantSettingsEntity | null>
  listTenantSettings(tenantId?: string): Promise<TenantSettingsEntity[]>
}

export interface BlobsClient {
  uploadAssessment(assessmentId: string, data: string): Promise<void>
  getAssessment(assessmentId: string): Promise<string | null>
  uploadReport(reportId: string, data: Buffer): Promise<void>
  getReport(reportId: string): Promise<Buffer | null>
  getReportUrl(reportId: string, expiresInSeconds?: number): Promise<string>
}

export interface QueueClient {
  enqueueAssessment(assessmentId: string, tenantId: string): Promise<string>
  dequeueAssessment(): Promise<QueueMessage | null>
}
