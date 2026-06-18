"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTablesClient = void 0;
/**
 * Mock implementation of Tables Client
 * Stores data in-memory with Map structure
 */
class MockTablesClient {
    constructor() {
        this.tenantsTable = new Map();
        this.assessmentsIndexTable = new Map();
        this.tenantSettingsTable = new Map();
    }
    async upsertTenant(entity) {
        this.tenantsTable.set(entity.tenantId, entity);
    }
    async getTenant(tenantId) {
        return this.tenantsTable.get(tenantId) || null;
    }
    async upsertAssessmentIndex(entity) {
        this.assessmentsIndexTable.set(entity.runId, entity);
    }
    async getAssessmentIndex(runId) {
        return this.assessmentsIndexTable.get(runId) || null;
    }
    async upsertTenantSettings(entity) {
        const key = `${entity.tenantId}|${entity.settingKey}`;
        this.tenantSettingsTable.set(key, entity);
    }
    async getTenantSettings(tenantId, settingKey) {
        const key = `${tenantId}|${settingKey}`;
        return this.tenantSettingsTable.get(key) || null;
    }
}
exports.MockTablesClient = MockTablesClient;
