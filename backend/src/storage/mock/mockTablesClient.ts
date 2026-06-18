import { TenantEntity, AssessmentIndexEntity, TenantSettingsEntity, TablesClient } from '../types'

/**
 * Mock implementation of Tables Client
 * Stores data in-memory with Map structure
 */
export class MockTablesClient implements TablesClient {
  private tenantsTable: Map<string, TenantEntity> = new Map()
  private assessmentsIndexTable: Map<string, AssessmentIndexEntity> = new Map()
  private tenantSettingsTable: Map<string, TenantSettingsEntity> = new Map()

  async upsertTenant(entity: TenantEntity): Promise<void> {
    this.tenantsTable.set(entity.tenantId, entity)
  }

  async getTenant(tenantId: string): Promise<TenantEntity | null> {
    return this.tenantsTable.get(tenantId) || null
  }

  async upsertAssessmentIndex(entity: AssessmentIndexEntity): Promise<void> {
    this.assessmentsIndexTable.set(entity.runId, entity)
  }

  async getAssessmentIndex(runId: string): Promise<AssessmentIndexEntity | null> {
    return this.assessmentsIndexTable.get(runId) || null
  }

  async upsertTenantSettings(entity: TenantSettingsEntity): Promise<void> {
    const key = `${entity.tenantId}|${entity.settingKey}`
    this.tenantSettingsTable.set(key, entity)
  }

  async getTenantSettings(tenantId: string, settingKey: string): Promise<TenantSettingsEntity | null> {
    const key = `${tenantId}|${settingKey}`
    return this.tenantSettingsTable.get(key) || null
  }
}
