"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockQueueClient = void 0;
const uuid_1 = require("uuid");
/**
 * Mock implementation of Queue Client
 * Stores messages in-memory with array (FIFO queue)
 */
class MockQueueClient {
    constructor() {
        this.queue = [];
    }
    async enqueueAssessment(assessmentId, tenantId) {
        const messageId = (0, uuid_1.v4)();
        const message = {
            messageId,
            assessmentId,
            tenantId,
            createdAt: new Date().toISOString(),
        };
        this.queue.push(message);
        return messageId;
    }
    async dequeueAssessment() {
        return this.queue.shift() || null;
    }
}
exports.MockQueueClient = MockQueueClient;
