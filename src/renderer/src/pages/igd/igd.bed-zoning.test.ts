import assert from 'node:assert/strict'
import test from 'node:test'

import { createIgdDashboardFixture } from './igd.data'
import {
  filterAvailableBedsForTriage,
  getAllowedBedZonesForTriage,
  getZoneTriageRangeLabel
} from './igd.bed-zoning'

test('quick triage exposes every available IGD bed without level filtering', () => {
  const beds = filterAvailableBedsForTriage(createIgdDashboardFixture().beds, 0)

  assert.deepEqual(
    beds.map((bed) => bed.code),
    ['R-02', 'R-03', 'R-04', 'O-02', 'O-03', 'O-05', 'O-06', 'T-01', 'T-02', 'I-01', 'I-02']
  )
})

test('allowed bed zones are no longer constrained by triage level', () => {
  assert.deepEqual(getAllowedBedZonesForTriage(undefined), [
    'Resusitasi',
    'Observasi',
    'Tindakan',
    'Isolasi'
  ])
})

test('zone header exposes only the active IGD rooms', () => {
  assert.equal(getZoneTriageRangeLabel('Resusitasi'), 'Semua level')
  assert.equal(getZoneTriageRangeLabel('Observasi'), 'Semua level')
  assert.equal(getZoneTriageRangeLabel('Tindakan'), 'Semua level')
  assert.equal(getZoneTriageRangeLabel('Isolasi'), 'Semua level')
})
