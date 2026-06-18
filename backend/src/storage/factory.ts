import { config } from '../config'
import { StorageClients } from './types'
import { MockTablesClient } from './mock/mockTablesClient'
import { MockBlobsClient } from './mock/mockBlobsClient'
import { MockQueueClient } from './mock/mockQueueClient'
import { AzureTablesClient } from './azure/azureTablesClient'
import { AzureBlobsClient } from './azure/azureBlobsClient'
import { AzureQueueClient } from './azure/azureQueueClient'

/**
 * Initialize storage clients based on MOCK_MODE
 * In MOCK_MODE, all clients are in-memory implementations
 * Otherwise, real Azure clients are used
 */
export function initializeStorageClients(): StorageClients {
  if (config.MOCK_MODE) {
    return {
      tables: new MockTablesClient(),
      blobs: new MockBlobsClient(),
      queue: new MockQueueClient(),
    }
  }

  // Real Azure mode
  const connectionString = config.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is required when not in MOCK_MODE')
  }

  return {
    tables: new AzureTablesClient(connectionString),
    blobs: new AzureBlobsClient(connectionString),
    queue: new AzureQueueClient(connectionString),
  }
}

// Global storage clients instance
let storageClients: StorageClients | null = null

/**
 * Get the global storage clients instance
 * Initializes on first call
 */
export function getStorageClients(): StorageClients {
  if (!storageClients) {
    storageClients = initializeStorageClients()
  }
  return storageClients
}
