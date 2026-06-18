"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeStorageClients = initializeStorageClients;
exports.getStorageClients = getStorageClients;
const config_1 = require("../config");
const mockTablesClient_1 = require("./mock/mockTablesClient");
const mockBlobsClient_1 = require("./mock/mockBlobsClient");
const mockQueueClient_1 = require("./mock/mockQueueClient");
const azureTablesClient_1 = require("./azure/azureTablesClient");
const azureBlobsClient_1 = require("./azure/azureBlobsClient");
const azureQueueClient_1 = require("./azure/azureQueueClient");
/**
 * Initialize storage clients based on MOCK_MODE
 * In MOCK_MODE, all clients are in-memory implementations
 * Otherwise, real Azure clients are used
 */
function initializeStorageClients() {
    if (config_1.config.MOCK_MODE) {
        return {
            tables: new mockTablesClient_1.MockTablesClient(),
            blobs: new mockBlobsClient_1.MockBlobsClient(),
            queue: new mockQueueClient_1.MockQueueClient(),
        };
    }
    // Real Azure mode
    const connectionString = config_1.config.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING is required when not in MOCK_MODE');
    }
    return {
        tables: new azureTablesClient_1.AzureTablesClient(connectionString),
        blobs: new azureBlobsClient_1.AzureBlobsClient(connectionString),
        queue: new azureQueueClient_1.AzureQueueClient(connectionString),
    };
}
// Global storage clients instance
let storageClients = null;
/**
 * Get the global storage clients instance
 * Initializes on first call
 */
function getStorageClients() {
    if (!storageClients) {
        storageClients = initializeStorageClients();
    }
    return storageClients;
}
