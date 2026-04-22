export type HeaderQueueCandidate = {
  queueId?: string
  formattedQueueNumber?: string
  status?: string
}

export const getNextConfirmQueue = <T extends HeaderQueueCandidate>(queues: T[] = []) =>
  queues.find((queue) => queue.status === 'PRE_RESERVED')

export const getNextCallQueue = <T extends HeaderQueueCandidate>(queues: T[] = []) =>
  queues.find((queue) => queue.status === 'RESERVED' || queue.status === 'REGISTERED')
