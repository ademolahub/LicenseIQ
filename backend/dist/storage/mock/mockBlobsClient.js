"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockBlobsClient = void 0;
/**
 * Mock implementation of Blobs Client
 * Stores blobs in-memory with Map structure
 */
class MockBlobsClient {
    constructor() {
        this.assessmentsContainer = new Map();
        this.reportsContainer = new Map();
    }
    async uploadAssessment(assessmentId, data) {
        this.assessmentsContainer.set(assessmentId, data);
    }
    async getAssessment(assessmentId) {
        return this.assessmentsContainer.get(assessmentId) || null;
    }
    async uploadReport(reportId, data) {
        this.reportsContainer.set(reportId, data);
    }
    async getReport(reportId) {
        return this.reportsContainer.get(reportId) || null;
    }
}
exports.MockBlobsClient = MockBlobsClient;
