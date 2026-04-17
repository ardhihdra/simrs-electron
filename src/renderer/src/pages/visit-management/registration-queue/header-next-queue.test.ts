import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getNextCallQueue,
  getNextConfirmQueue,
  type HeaderQueueCandidate
} from './header-next-queue'

test('getNextConfirmQueue returns the first PRE_RESERVED queue', () => {
  const queues: HeaderQueueCandidate[] = [
    { queueId: '2', formattedQueueNumber: 'A002', status: 'RESERVED' },
    { queueId: '3', formattedQueueNumber: 'A003', status: 'PRE_RESERVED' },
    { queueId: '4', formattedQueueNumber: 'A004', status: 'PRE_RESERVED' }
  ]

  assert.equal(getNextConfirmQueue(queues)?.queueId, '3')
})

test('getNextCallQueue returns the first RESERVED queue before later REGISTERED queues', () => {
  const queues: HeaderQueueCandidate[] = [
    { queueId: '1', formattedQueueNumber: 'A001', status: 'PRE_RESERVED' },
    { queueId: '2', formattedQueueNumber: 'A002', status: 'RESERVED' },
    { queueId: '3', formattedQueueNumber: 'A003', status: 'REGISTERED' }
  ]

  assert.equal(getNextCallQueue(queues)?.queueId, '2')
})

test('getNextCallQueue falls back to REGISTERED when RESERVED is not available', () => {
  const queues: HeaderQueueCandidate[] = [
    { queueId: '3', formattedQueueNumber: 'A003', status: 'REGISTERED' },
    { queueId: '4', formattedQueueNumber: 'A004', status: 'SKIPPED' }
  ]

  assert.equal(getNextCallQueue(queues)?.queueId, '3')
})

test('returns undefined when there is no eligible next queue', () => {
  const queues: HeaderQueueCandidate[] = [
    { queueId: '4', formattedQueueNumber: 'A004', status: 'SKIPPED' },
    { queueId: '5', formattedQueueNumber: 'A005', status: 'CALLED' }
  ]

  assert.equal(getNextConfirmQueue(queues), undefined)
  assert.equal(getNextCallQueue(queues), undefined)
})
