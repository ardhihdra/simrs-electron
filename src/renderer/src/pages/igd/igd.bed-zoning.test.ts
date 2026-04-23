import assert from 'node:assert/strict'
import test from 'node:test'

import { createIgdDashboardFixture } from './igd.data'
import {
  filterAvailableBedsForTriage,
  getAllowedBedZonesForTriage,
  getZoneTriageRangeLabel
} from './igd.bed-zoning'

test('level 3 quick triage only exposes observasi beds', () => {
  const beds = filterAvailableBedsForTriage(createIgdDashboardFixture().beds, 3)

  assert.deepEqual(
    beds.map((bed) => bed.code),
    ['O-02', 'O-03', 'O-05', 'O-06']
  )
})

test('level 4 quick triage exposes observasi and treatment beds', () => {
  const beds = filterAvailableBedsForTriage(createIgdDashboardFixture().beds, 4)

  assert.deepEqual(
    beds.map((bed) => bed.code),
    ['O-02', 'O-03', 'O-05', 'O-06', 'T-01', 'T-02']
  )
})

test('missing quick triage keeps bed field locked by returning no allowed zones', () => {
  assert.deepEqual(getAllowedBedZonesForTriage(undefined), [])
})

test('zone header exposes the approved triage range labels', () => {
  assert.equal(getZoneTriageRangeLabel('Resusitasi'), 'L1-L2')
  assert.equal(getZoneTriageRangeLabel('Observasi'), 'L3-L4')
  assert.equal(getZoneTriageRangeLabel('Treatment'), 'L4-L5')
})
