"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureTablesClient = void 0;
const data_tables_1 = require("@azure/data-tables");
/**
 * Real Azure Tables implementation
 * Connects to Azure Table Storage via connection string
 */
class AzureTablesClient {
    constructor(connectionString) {
        this.tenantsTable = data_tables_1.TableClient.fromConnectionString(connectionString, 'TenantsTable');
        this.assessmentsIndexTable = data_tables_1.TableClient.fromConnectionString(connectionString, 'AssessmentsIndexTable');
        this.tenantSettingsTable = data_tables_1.TableClient.fromConnectionString(connectionString, 'TenantSettingsTable');
    }
    async upsertTenant(entity) {
        await this.tenantsTable.upsertEntity(entity, 'Replace');
    }
    async getTenant(tenantId) {
        try {
            const entity = await this.tenantsTable.getEntity(tenantId, tenantId);
            return entity;
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ResourceNotFound') {
                return null;
            }
            throw error;
        }
    }
    async upsertAssessmentIndex(entity) {
        await this.assessmentsIndexTable.upsertEntity(entity, 'Replace');
    }
    async getAssessmentIndex(runId) {
        try {
            const entity = await this.assessmentsIndexTable.getEntity(runId, runId);
            return entity;
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ResourceNotFound') {
                return null;
            }
            throw error;
        }
    }
    async upsertTenantSettings(entity) {
        const partitionKey = entity.tenantId;
        const rowKey = entity.settingKey;
        const entityToStore = {
            ...entity,
            partitionKey,
            rowKey,
        };
        await this.tenantSettingsTable.upsertEntity(entityToStore, 'Replace');
    }
    async getTenantSettings(tenantId, settingKey) {
        try {
            const entity = await this.tenantSettingsTable.getEntity(tenantId, settingKey);
            return entity;
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'ResourceNotFound') {
                return null;
            }
            throw error;
        }
    }
}
exports.AzureTablesClient = AzureTablesClient;
