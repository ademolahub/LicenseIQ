"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureQueueClient = void 0;
const storage_queue_1 = require("@azure/storage-queue");
/**
 * Real Azure Queue Storage implementation
 * Connects to Azure Queue Storage via connection string
 */
class AzureQueueClient {
    constructor(connectionString) {
        // Parse connection string to get account name and key
        const accountMatch = connectionString.match(/AccountName=([^;]+)/);
        const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
        if (!accountMatch || !keyMatch) {
            throw new Error('Invalid connection string format');
        }
        const accountName = accountMatch[1];
        const accountKey = keyMatch[1];
        const queueUrl = `https://${accountName}.queue.core.windows.net/assessments`;
        const credential = new storage_queue_1.StorageSharedKeyCredential(accountName, accountKey);
        this.queueClient = new storage_queue_1.QueueClient(queueUrl, credential);
    }
    async enqueueAssessment(assessmentId, tenantId) {
        const message = JSON.stringify({
            assessmentId,
            tenantId,
            createdAt: new Date().toISOString(),
        });
        const sendMessageResponse = await this.queueClient.sendMessage(message);
        return sendMessageResponse.messageId;
    }
    async dequeueAssessment() {
        const messages = await this.queueClient.receiveMessages();
        if (!messages.receivedMessageItems || messages.receivedMessageItems.length === 0) {
            return null;
        }
        const azureMessage = messages.receivedMessageItems[0];
        const messageBody = JSON.parse(azureMessage.messageText);
        // Delete the message from the queue after receiving it
        await this.queueClient.deleteMessage(azureMessage.messageId, azureMessage.popReceipt);
        return {
            messageId: azureMessage.messageId,
            assessmentId: messageBody.assessmentId,
            tenantId: messageBody.tenantId,
            createdAt: messageBody.createdAt,
        };
    }
}
exports.AzureQueueClient = AzureQueueClient;
