import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeRoomBedMapResponse } from './room'

test('normalizeRoomBedMapResponse extracts result payload', () => {
  const result = normalizeRoomBedMapResponse({
    success: true,
    result: {
      generatedAt: '2026-04-24T09:00:00.000Z',
      summary: {
        totalRooms: 1,
        totalBeds: 2,
        occupiedBeds: 1,
        availableBeds: 1,
        cleaningBeds: 0
      },
      wards: []
    }
  })

  assert.deepEqual(result, {
    generatedAt: '2026-04-24T09:00:00.000Z',
    summary: {
      totalRooms: 1,
      totalBeds: 2,
      occupiedBeds: 1,
      availableBeds: 1,
      cleaningBeds: 0
    },
    wards: []
  })
})

test('normalizeRoomBedMapResponse throws when payload is invalid', () => {
  assert.throws(() => normalizeRoomBedMapResponse({ success: true }), /Invalid room bed map response/)
})
