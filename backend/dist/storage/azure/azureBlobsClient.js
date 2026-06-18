"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureBlobsClient = void 0;
const storage_blob_1 = require("@azure/storage-blob");
/**
 * Real Azure Blob Storage implementation
 * Connects to Azure Blob Storage via connection string
 */
class AzureBlobsClient {
    constructor(connectionString) {
        // Parse connection string to get account name and key
        const accountMatch = connectionString.match(/AccountName=([^;]+)/);
        const keyMatch = connectionString.match(/AccountKey=([^;]+)/);
        if (!accountMatch || !keyMatch) {
            throw new Error('Invalid connection string format');
        }
        const accountName = accountMatch[1];
        const accountKey = keyMatch[1];
        const credential = new storage_blob_1.StorageSharedKeyCredential(accountName, accountKey);
        this.assessmentsContainer = new storage_blob_1.ContainerClient(`https://${accountName}.blob.core.windows.net/assessments`, credential);
        this.reportsContainer = new storage_blob_1.ContainerClient(`https://${accountName}.blob.core.windows.net/reports`, credential);
    }
    async uploadAssessment(assessmentId, data) {
        const blockBlobClient = this.assessmentsContainer.getBlockBlobClient(assessmentId);
        await blockBlobClient.upload(Buffer.from(data, 'utf-8'), Buffer.from(data, 'utf-8').length);
    }
    async getAssessment(assessmentId) {
        try {
            const blockBlobClient = this.assessmentsContainer.getBlockBlobClient(assessmentId);
            const downloadBlockBlobResponse = await blockBlobClient.download(0);
            const downloadedData = await this.streamToString(downloadBlockBlobResponse.readableStreamBody);
            return downloadedData;
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'BlobNotFound') {
                return null;
            }
            throw error;
        }
    }
    async uploadReport(reportId, data) {
        const blockBlobClient = this.reportsContainer.getBlockBlobClient(reportId);
        await blockBlobClient.upload(Buffer.from(data, 'utf-8'), Buffer.from(data, 'utf-8').length);
    }
    async getReport(reportId) {
        try {
            const blockBlobClient = this.reportsContainer.getBlockBlobClient(reportId);
            const downloadBlockBlobResponse = await blockBlobClient.download(0);
            const downloadedData = await this.streamToString(downloadBlockBlobResponse.readableStreamBody);
            return downloadedData;
        }
        catch (error) {
            if (error instanceof Error && 'code' in error && error.code === 'BlobNotFound') {
                return null;
            }
            throw error;
        }
    }
    async streamToString(readableStream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            readableStream.on('data', (data) => {
                chunks.push(data.toString('utf8'));
            });
            readableStream.on('end', () => {
                resolve(chunks.join(''));
            });
            readableStream.on('error', reject);
        });
    }
}
exports.AzureBlobsClient = AzureBlobsClient;
