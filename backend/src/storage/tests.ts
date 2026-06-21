import { v4 as uuidv4 } from 'uuid'
import { MockTablesClient, MockBlobsClient, MockQueueClient } from '../storage'

/**
 * Test suite for Storage Layer
 * Verifies MOCK_MODE implementations work correctly
 */

export async function runStorageTests() {
  console.log('🧪 Starting Storage Layer Tests...\n')

  try {
    await testTablesRoundTrip()
    await testBlobsRoundTrip()
    await testQueueMessageId()
    console.log('\n✅ All storage tests passed!\n')
  } catch (error) {
    console.error('\n❌ Storage tests failed:', error)
    throw error
  }
}

async function testTablesRoundTrip() {
  console.log('📝 Test 1: Table write + read round-trip')

  const tablesClient = new MockTablesClient()
  const tenantId = uuidv4()

  // Test Tenant entity
  const tenantEntity = {
    partitionKey: tenantId,
    rowKey: tenantId,
    tenantId,
    tenantName: 'Test Tenant',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  }

  await tablesClient.upsertTenant(tenantEntity)
  const retrieved = await tablesClient.getTenant(tenantId)

  if (!retrieved || retrieved.tenantName !== 'Test Tenant') {
    throw new Error('Tenant write-read failed')
  }
  console.log('  ✓ Tenant round-trip: OK')

  // Test Assessment Index entity
  const runId = uuidv4()
  const assessmentEntity = {
    partitionKey: runId,
    rowKey: runId,
    runId,
    tenantId,
    status: 'queued' as const,
    createdAt: new Date().toISOString(),
  }

  await tablesClient.upsertAssessmentIndex(assessmentEntity)
  const retrievedAssessment = await tablesClient.getAssessmentIndex(runId)

  if (!retrievedAssessment || retrievedAssessment.status !== 'queued') {
    throw new Error('Assessment Index write-read failed')
  }
  console.log('  ✓ Assessment Index round-trip: OK')

  // Test Tenant Settings entity
  const settingsEntity = {
    partitionKey: tenantId,
    rowKey: 'reportFormat',
    tenantId,
    settingKey: 'reportFormat',
    settingValue: 'pdf',
    lastUpdated: new Date().toISOString(),
  }

  await tablesClient.upsertTenantSettings(settingsEntity)
  const retrievedSettings = await tablesClient.getTenantSettings(tenantId, 'reportFormat')

  if (!retrievedSettings || retrievedSettings.settingValue !== 'pdf') {
    throw new Error('Tenant Settings write-read failed')
  }
  console.log('  ✓ Tenant Settings round-trip: OK\n')
}

async function testBlobsRoundTrip() {
  console.log('📦 Test 2: Blob write + read round-trip')

  const blobsClient = new MockBlobsClient()

  // Test Assessment blob
  const assessmentId = uuidv4()
  const assessmentData = JSON.stringify({
    assessmentId,
    users: 50,
    skus: 5,
    recommendations: [],
  })

  await blobsClient.uploadAssessment(assessmentId, assessmentData)
  const retrievedAssessment = await blobsClient.getAssessment(assessmentId)

  if (!retrievedAssessment) {
    throw new Error('Assessment blob write-read failed')
  }
  const parsed = JSON.parse(retrievedAssessment)
  if (parsed.users !== 50) {
    throw new Error('Assessment blob data corruption')
  }
  console.log('  ✓ Assessment blob round-trip: OK')

  // Test Report blob
  const reportId = uuidv4()
  const reportData = Buffer.from(JSON.stringify({
    reportId,
    format: 'pdf',
    pages: 10,
  }))

  await blobsClient.uploadReport(reportId, reportData)
  const retrievedReport = await blobsClient.getReport(reportId)

  if (!retrievedReport) {
    throw new Error('Report blob write-read failed')
  }
  const parsedReport = JSON.parse(retrievedReport.toString('utf-8'))
  if (parsedReport.pages !== 10) {
    throw new Error('Report blob data corruption')
  }
  console.log('  ✓ Report blob round-trip: OK')

  // Test non-existent blob returns null
  const nonExistent = await blobsClient.getAssessment(uuidv4())
  if (nonExistent !== null) {
    throw new Error('Non-existent blob should return null')
  }
  console.log('  ✓ Non-existent blob returns null: OK\n')
}

async function testQueueMessageId() {
  console.log('📨 Test 3: Queue enqueue returns messageId')

  const queueClient = new MockQueueClient()

  // Enqueue a message
  const assessmentId = uuidv4()
  const tenantId = uuidv4()

  const messageId = await queueClient.enqueueAssessment(assessmentId, tenantId)

  if (!messageId) {
    throw new Error('Queue enqueue did not return messageId')
  }

  if (typeof messageId !== 'string' || messageId.length === 0) {
    throw new Error('Queue messageId is invalid')
  }
  console.log('  ✓ Queue enqueue returns valid messageId:', messageId.substring(0, 8) + '...')

  // Dequeue the message
  const dequeuedMessage = await queueClient.dequeueAssessment()

  if (!dequeuedMessage) {
    throw new Error('Dequeue failed')
  }

  if (
    dequeuedMessage.messageId !== messageId ||
    dequeuedMessage.assessmentId !== assessmentId ||
    dequeuedMessage.tenantId !== tenantId
  ) {
    throw new Error('Dequeued message data mismatch')
  }
  console.log('  ✓ Queue dequeue retrieves correct message: OK')

  // Queue should be empty
  const emptyDequeue = await queueClient.dequeueAssessment()
  if (emptyDequeue !== null) {
    throw new Error('Empty queue should return null')
  }
  console.log('  ✓ Empty queue returns null: OK\n')
}
