import assert from 'node:assert/strict'
import test from 'node:test'

import dayjs from 'dayjs'

import {
  buildDoctorQueryInput,
  buildDoctorSelectionResetKey
} from './VisitQueueForm.helpers.ts'

test('buildDoctorQueryInput omits hour when the optional time filter is empty', () => {
  assert.deepEqual(
    buildDoctorQueryInput({
      visitDate: dayjs('2026-04-20'),
      poliId: '12',
      hour: undefined
    }),
    {
      date: '2026-04-20',
      poliId: 12
    }
  )
})

test('buildDoctorQueryInput includes hour in HH:mm format when a time filter is selected', () => {
  assert.deepEqual(
    buildDoctorQueryInput({
      visitDate: dayjs('2026-04-20'),
      poliId: 12,
      hour: dayjs('2026-04-20T10:00:00')
    }),
    {
      date: '2026-04-20',
      poliId: 12,
      hour: '10:00'
    }
  )
})

test('buildDoctorSelectionResetKey changes when only the hour filter changes', () => {
  const before = buildDoctorSelectionResetKey({
    visitDate: dayjs('2026-04-20'),
    poliId: 12,
    hour: dayjs('2026-04-20T09:00:00')
  })

  const after = buildDoctorSelectionResetKey({
    visitDate: dayjs('2026-04-20'),
    poliId: 12,
    hour: dayjs('2026-04-20T10:00:00')
  })

  assert.notEqual(before, after)
})
