import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeKioskaCheckinError, serializeKioskaPublicError } from './kioska-checkin-error.ts'

test('preserves backend 400 message for invalid queue number', () => {
  const error = {
    code: 'KIOSKA_PUBLIC_ERROR',
    message: serializeKioskaPublicError({
      status: 400,
      message: 'Queue number format is invalid'
    })
  }

  const normalized = normalizeKioskaCheckinError(error)

  assert.equal(normalized.status, 400)
  assert.equal(normalized.code, 'INVALID_QUEUE_NUMBER')
  assert.equal(normalized.message, 'Queue number format is invalid')
})

test('preserves backend 404 message for queue not found', () => {
  const error = {
    code: 'KIOSKA_PUBLIC_ERROR',
    message: serializeKioskaPublicError({
      status: 404,
      message: 'Queue ticket not found'
    })
  }

  const normalized = normalizeKioskaCheckinError(error)

  assert.equal(normalized.status, 404)
  assert.equal(normalized.code, 'QUEUE_NOT_FOUND')
  assert.equal(normalized.message, 'Queue ticket not found')
})

test('preserves backend 409 message for check-in rejection', () => {
  const error = {
    code: 'KIOSKA_PUBLIC_ERROR',
    message: serializeKioskaPublicError({
      status: 409,
      message: 'Antrian Belum Memiliki Pasien, Silahkan Hubungi Petugas'
    })
  }

  const normalized = normalizeKioskaCheckinError(error)

  assert.equal(normalized.status, 409)
  assert.equal(normalized.code, 'CHECKIN_UNAVAILABLE')
  assert.equal(normalized.message, 'Antrian Belum Memiliki Pasien, Silahkan Hubungi Petugas')
})

test('falls back to a generic message for unknown checkin failures', () => {
  const normalized = normalizeKioskaCheckinError(new Error('socket hang up'))

  assert.equal(normalized.status, undefined)
  assert.equal(normalized.code, 'UNKNOWN')
  assert.equal(normalized.message, 'Gagal check-in, silakan coba lagi')
})
