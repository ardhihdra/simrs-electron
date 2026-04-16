export type GlobalHeaderQueueCandidate = {
  queueId?: string
  globalQueueNumber?: number
  status?: string
}

const hasValidGlobalQueueNumber = (queue: GlobalHeaderQueueCandidate) =>
  typeof queue.globalQueueNumber === 'number' && Number.isFinite(queue.globalQueueNumber)

export const sortQueuesByGlobalNumber = <T extends GlobalHeaderQueueCandidate>(queues: T[] = []) =>
  [...queues]
    .filter(hasValidGlobalQueueNumber)
    .sort((left, right) => (left.globalQueueNumber as number) - (right.globalQueueNumber as number))

export const getNextGlobalConfirmQueue = <T extends GlobalHeaderQueueCandidate>(queues: T[] = []) =>
  sortQueuesByGlobalNumber(queues).find((queue) => queue.status === 'PRE_RESERVED')

export const getNextGlobalCallQueue = <T extends GlobalHeaderQueueCandidate>(queues: T[] = []) =>
  sortQueuesByGlobalNumber(queues).find(
    (queue) => queue.status === 'RESERVED' || queue.status === 'REGISTERED'
  )
