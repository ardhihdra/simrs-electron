import assert from 'node:assert/strict'
import test from 'node:test'

import { buildDoctorScheduleListQuery } from './doctorScheduleListPage.helpers.ts'

test('buildDoctorScheduleListQuery requests all doctor schedules without the 100-row cap', () => {
  assert.deepEqual(buildDoctorScheduleListQuery(), {
    model: 'jadwalDokter',
    method: 'get',
    listAll: true
  })
})
