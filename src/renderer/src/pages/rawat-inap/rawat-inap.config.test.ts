import assert from 'node:assert/strict'
import test from 'node:test'

import { Modules } from 'simrs-types'

import {
  RAWAT_INAP_DASHBOARD_ITEM,
  RAWAT_INAP_PAGE_PATHS,
  RAWAT_INAP_ROOT_PATH,
  REGISTRATION_RAWAT_INAP_PAGE_PATHS,
  REGISTRATION_RAWAT_INAP_ROOT_PATH
} from './rawat-inap.config.tsx'

test('rawat inap config exposes admisi, bed map, transfer, and pasien menu items', () => {
  assert.equal(RAWAT_INAP_DASHBOARD_ITEM.module, Modules.RAWAT_INAP)
  assert.equal(RAWAT_INAP_DASHBOARD_ITEM.key, RAWAT_INAP_ROOT_PATH)
  assert.deepEqual(
    RAWAT_INAP_DASHBOARD_ITEM.children?.map((child) => child.key),
    [
      RAWAT_INAP_PAGE_PATHS.bedMap,
      RAWAT_INAP_PAGE_PATHS.admisi,
      RAWAT_INAP_PAGE_PATHS.transfer,
      RAWAT_INAP_PAGE_PATHS.checkin,
      RAWAT_INAP_PAGE_PATHS.pasien
    ]
  )
})

test('rawat inap registration aliases are separated from rawat inap module paths', () => {
  assert.equal(REGISTRATION_RAWAT_INAP_ROOT_PATH, '/dashboard/registration/rawat-inap')
  assert.notEqual(REGISTRATION_RAWAT_INAP_PAGE_PATHS.admisi, RAWAT_INAP_PAGE_PATHS.admisi)
  assert.notEqual(REGISTRATION_RAWAT_INAP_PAGE_PATHS.checkin, RAWAT_INAP_PAGE_PATHS.checkin)
  assert.notEqual(REGISTRATION_RAWAT_INAP_PAGE_PATHS.pasien, RAWAT_INAP_PAGE_PATHS.pasien)
  assert.equal(
    REGISTRATION_RAWAT_INAP_PAGE_PATHS.admisi,
    '/dashboard/registration/rawat-inap/admisi'
  )
})
