import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getNextGlobalCallQueue,
  getNextGlobalConfirmQueue,
  sortQueuesByGlobalNumber,
  type GlobalHeaderQueueCandidate
} from './global-header-next-queue'

test('sortQueuesByGlobalNumber sorts queues by globalQueueNumber ascending', () => {
  const queues: GlobalHeaderQueueCandidate[] = [
    { queueId: '2', globalQueueNumber: 5, status: 'REGISTERED' },
    { queueId: '1', globalQueueNumber: 2, status: 'PRE_RESERVED' },
    { queueId: '3', globalQueueNumber: 3, status: 'RESERVED' }
  ]

  assert.deepEqual(
    sortQueuesByGlobalNumber(queues).map((queue) => queue.queueId),
    ['1', '3', '2']
  )
})

test('getNextGlobalConfirmQueue returns PRE_RESERVED queue with smallest global number', () => {
  const queues: GlobalHeaderQueueCandidate[] = [
    { queueId: '2', globalQueueNumber: 5, status: 'PRE_RESERVED' },
    { queueId: '1', globalQueueNumber: 2, status: 'REGISTERED' },
    { queueId: '3', globalQueueNumber: 3, status: 'PRE_RESERVED' }
  ]

  assert.equal(getNextGlobalConfirmQueue(queues)?.queueId, '3')
})

test('getNextGlobalCallQueue returns eligible RESERVED or REGISTERED queue with smallest global number', () => {
  const queues: GlobalHeaderQueueCandidate[] = [
    { queueId: '2', globalQueueNumber: 6, status: 'REGISTERED' },
    { queueId: '1', globalQueueNumber: 2, status: 'PRE_RESERVED' },
    { queueId: '3', globalQueueNumber: 4, status: 'RESERVED' }
  ]

  assert.equal(getNextGlobalCallQueue(queues)?.queueId, '3')
})

test('global queue helpers ignore rows without valid globalQueueNumber', () => {
  const queues: GlobalHeaderQueueCandidate[] = [
    { queueId: '1', status: 'PRE_RESERVED' },
    { queueId: '2', globalQueueNumber: 7, status: 'REGISTERED' }
  ]

  assert.equal(getNextGlobalConfirmQueue(queues), undefined)
  assert.equal(getNextGlobalCallQueue(queues)?.queueId, '2')
})
