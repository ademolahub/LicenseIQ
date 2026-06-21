import { TableClient } from '@azure/data-tables'
import { TenantEntity, AssessmentIndexEntity, TenantSettingsEntity, TablesClient } from '../types'

/**
 * Real Azure Tables implementation
 * Connects to Azure Table Storage via connection string
 */
export class AzureTablesClient implements TablesClient {
  private tenantsTable: TableClient
  private assessmentsIndexTable: TableClient
  private tenantSettingsTable: TableClient

  constructor(connectionString: string) {
    this.tenantsTable = TableClient.fromConnectionString(connectionString, 'TenantsTable')
    this.assessmentsIndexTable = TableClient.fromConnectionString(connectionString, 'AssessmentsIndexTable')
    this.tenantSettingsTable = TableClient.fromConnectionString(connectionString, 'TenantSettingsTable')
  }

  async upsertTenant(entity: TenantEntity): Promise<void> {
    await this.tenantsTable.upsertEntity(entity, 'Replace')
  }

  async getTenant(tenantId: string): Promise<TenantEntity | null> {
    try {
      const entity = await this.tenantsTable.getEntity<TenantEntity>(tenantId, tenantId)
      return entity
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ResourceNotFound') {
        return null
      }
      throw error
    }
  }

  async upsertAssessmentIndex(entity: AssessmentIndexEntity): Promise<void> {
    await this.assessmentsIndexTable.upsertEntity(entity, 'Replace')
  }

  async getAssessmentIndex(runId: string): Promise<AssessmentIndexEntity | null> {
    try {
      const entity = await this.assessmentsIndexTable.getEntity<AssessmentIndexEntity>(runId, runId)
      return entity
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ResourceNotFound') {
        return null
      }
      throw error
    }
  }

  async listAssessmentIndexes(): Promise<AssessmentIndexEntity[]> {
    const records: AssessmentIndexEntity[] = []
    for await (const entity of this.assessmentsIndexTable.listEntities<AssessmentIndexEntity>()) {
      records.push(entity)
    }
    return records
  }

  async upsertTenantSettings(entity: TenantSettingsEntity): Promise<void> {
    const partitionKey = entity.tenantId
    const rowKey = entity.settingKey
    const entityToStore = {
      ...entity,
      partitionKey,
      rowKey,
    }
    await this.tenantSettingsTable.upsertEntity(entityToStore, 'Replace')
  }

  async getTenantSettings(tenantId: string, settingKey: string): Promise<TenantSettingsEntity | null> {
    try {
      const entity = await this.tenantSettingsTable.getEntity<TenantSettingsEntity>(tenantId, settingKey)
      return entity
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ResourceNotFound') {
        return null
      }
      throw error
    }
  }

  async listTenantSettings(tenantId?: string): Promise<TenantSettingsEntity[]> {
    const records: TenantSettingsEntity[] = []
    for await (const entity of this.tenantSettingsTable.listEntities<TenantSettingsEntity>()) {
      if (!tenantId || entity.tenantId === tenantId) {
        records.push(entity)
      }
    }
    return records
  }
}
