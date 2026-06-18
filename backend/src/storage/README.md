# Azure Storage Layer Implementation

## Overview

Complete Azure Storage Layer implementation with **MOCK_MODE** support for Tables, Blobs, and Queue services.

## Architecture

```
storage/
├── types.ts                  # Interface definitions
├── factory.ts               # Client factory with MOCK_MODE logic
├── tests.ts                 # Comprehensive test suite
├── azure/
│   ├── azureTablesClient.ts    # Real Azure Tables implementation
│   ├── azureBlobsClient.ts     # Real Azure Blob Storage implementation
│   └── azureQueueClient.ts     # Real Azure Queue Storage implementation
└── mock/
    ├── mockTablesClient.ts     # In-memory Tables implementation
    ├── mockBlobsClient.ts      # In-memory Blob Storage implementation
    └── mockQueueClient.ts      # In-memory Queue implementation
```

## Features

### Tables Storage
- **TenantsTable**: Store tenant entities with tenant info
- **AssessmentsIndexTable**: Store assessment metadata and status
- **TenantSettingsTable**: Store tenant configuration

Operations:
- `upsertTenant(entity)` - Create/update tenant
- `getTenant(tenantId)` - Retrieve tenant
- `upsertAssessmentIndex(entity)` - Create/update assessment index
- `getAssessmentIndex(runId)` - Retrieve assessment
- `upsertTenantSettings(entity)` - Create/update settings
- `getTenantSettings(tenantId, settingKey)` - Retrieve settings

### Blob Storage
- **assessments container**: Store assessment data
- **reports container**: Store generated reports

Operations:
- `uploadAssessment(assessmentId, data)` - Store assessment
- `getAssessment(assessmentId)` - Retrieve assessment
- `uploadReport(reportId, data)` - Store report
- `getReport(reportId)` - Retrieve report

### Queue Storage
- **assessments queue**: Queue assessment jobs for processing

Operations:
- `enqueueAssessment(assessmentId, tenantId)` - Add message to queue, returns `messageId`
- `dequeueAssessment()` - Retrieve and delete message from queue

## MOCK_MODE

Set `MOCK_MODE=true` environment variable to use in-memory implementations:

```bash
# Enable MOCK_MODE
export MOCK_MODE=true
npm run dev

# Or run tests
npx tsx src/runStorageTests.ts
```

When `MOCK_MODE=true`:
- All data is stored in-memory (Map structures)
- No Azure credentials or connection strings required
- Perfect for local development and testing

When `MOCK_MODE=false` (default):
- Real Azure clients are used
- Requires `AZURE_STORAGE_CONNECTION_STRING` environment variable

## Configuration

Environment variables (in `.env` or shell):

```bash
# Required for non-MOCK_MODE
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;

# Optional Azure auth
AZURE_STORAGE_ACCOUNT_NAME=<account>
AZURE_STORAGE_ACCOUNT_KEY=<key>

# Enable MOCK_MODE (default: false)
MOCK_MODE=true|false

# Server config
PORT=3001
NODE_ENV=development|production|test
LOG_LEVEL=info|debug|warn|error
```

## Usage

### Initialize Clients

```typescript
import { getStorageClients } from './storage'

const { tables, blobs, queue } = getStorageClients()
```

### Tables Example

```typescript
// Create/update tenant
await tables.upsertTenant({
  partitionKey: tenantId,
  rowKey: tenantId,
  tenantId,
  tenantName: 'Acme Corp',
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
})

// Retrieve tenant
const tenant = await tables.getTenant(tenantId)
```

### Blobs Example

```typescript
// Store assessment
const assessmentData = JSON.stringify({ /* assessment */ })
await blobs.uploadAssessment(assessmentId, assessmentData)

// Retrieve assessment
const data = await blobs.getAssessment(assessmentId)
```

### Queue Example

```typescript
// Add to queue
const messageId = await queue.enqueueAssessment(assessmentId, tenantId)

// Process queue
const message = await queue.dequeueAssessment()
if (message) {
  console.log(`Processing: ${message.assessmentId}`)
}
```

## Testing

All storage operations have comprehensive test coverage:

```bash
# Run tests
npx tsx src/runStorageTests.ts

# Tests verify:
# ✓ Table write + read round-trip
# ✓ Blob write + read round-trip  
# ✓ Queue enqueue returns messageId
# ✓ Non-existent items return null
# ✓ FIFO queue behavior
```

## Type Safety

All operations are fully typed:

```typescript
export interface TenantEntity extends TableEntity {
  tenantId: string
  tenantName: string
  createdAt: string
  lastUpdated: string
}

export interface QueueMessage {
  messageId: string
  assessmentId: string
  tenantId: string
  createdAt: string
}
```

## Error Handling

- Non-existent entities return `null` (not throw)
- Connection issues throw `Error` in real mode
- Invalid connection strings throw immediately

## Next Steps

- Integrate with assessment workflow
- Add retry logic for transient failures
- Add logging for storage operations
- Implement batch operations for efficiency
- Add metrics and monitoring
