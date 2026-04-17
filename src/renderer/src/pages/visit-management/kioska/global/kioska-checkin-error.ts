import {
  deserializeKioskaPublicError,
  serializeKioskaPublicError
} from '../../../../../../shared/kioska-public-error.ts'

export type KioskaCheckinErrorCode =
  | 'INVALID_QUEUE_NUMBER'
  | 'QUEUE_NOT_FOUND'
  | 'CHECKIN_UNAVAILABLE'
  | 'UNKNOWN'

export type KioskaCheckinErrorDetails = {
  code: KioskaCheckinErrorCode
  message: string
  status?: number
  rawMessage?: string
}

export class KioskaCheckinError extends Error {
  readonly code: KioskaCheckinErrorCode
  readonly status?: number
  readonly rawMessage?: string

  constructor(details: KioskaCheckinErrorDetails) {
    super(details.message)
    this.name = 'KioskaCheckinError'
    this.code = details.code
    this.status = details.status
    this.rawMessage = details.rawMessage
  }
}

export function normalizeKioskaCheckinError(error: unknown): KioskaCheckinErrorDetails {
  const serialized = deserializeKioskaPublicError(error)

  if (serialized?.status === 400) {
    return {
      code: 'INVALID_QUEUE_NUMBER',
      status: 400,
      rawMessage: serialized.message,
      message: serialized.message
    }
  }

  if (serialized?.status === 404) {
    return {
      code: 'QUEUE_NOT_FOUND',
      status: 404,
      rawMessage: serialized.message,
      message: serialized.message
    }
  }

  if (serialized?.status === 409) {
    return {
      code: 'CHECKIN_UNAVAILABLE',
      status: 409,
      rawMessage: serialized.message,
      message: serialized.message
    }
  }

  return {
    code: 'UNKNOWN',
    status: serialized?.status,
    rawMessage: serialized?.message || (error instanceof Error ? error.message : undefined),
    message: 'Gagal check-in, silakan coba lagi'
  }
}

export function createKioskaCheckinError(error: unknown) {
  return new KioskaCheckinError(normalizeKioskaCheckinError(error))
}

export { serializeKioskaPublicError }
