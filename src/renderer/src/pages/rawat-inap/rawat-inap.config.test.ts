import assert from 'node:assert/strict'
import test from 'node:test'

import { Modules } from 'simrs-types'

import {
  buildRawatInapQuickCpptPath,
  buildRawatInapQuickVitalSignsPath,
  RAWAT_INAP_DASHBOARD_ITEM,
  RAWAT_INAP_PAGE_PATHS,
  RAWAT_INAP_ROOT_PATH
} from './rawat-inap.config.tsx'

test('rawat inap config exposes bed map, admisi, transfer, and pasien menu items', () => {
  assert.equal(RAWAT_INAP_DASHBOARD_ITEM.module, Modules.RAWAT_INAP)
  assert.equal(RAWAT_INAP_DASHBOARD_ITEM.key, RAWAT_INAP_ROOT_PATH)
  assert.deepEqual(
    RAWAT_INAP_DASHBOARD_ITEM.children?.map((child) => child.key),
    [
      RAWAT_INAP_PAGE_PATHS.bedMap,
      RAWAT_INAP_PAGE_PATHS.admisi,
      RAWAT_INAP_PAGE_PATHS.transfer,
      RAWAT_INAP_PAGE_PATHS.pasien
    ]
  )
})

test('rawat inap config builds quick route paths for cppt and vital signs', () => {
  assert.equal(
    buildRawatInapQuickCpptPath('enc-1'),
    '/dashboard/rawat-inap/daftar-pasien/enc-1/cppt'
  )
  assert.equal(
    buildRawatInapQuickVitalSignsPath('enc-1'),
    '/dashboard/rawat-inap/daftar-pasien/enc-1/vital-signs'
  )
  assert.equal(
    RAWAT_INAP_PAGE_PATHS.daftarPasienQuickCppt,
    '/dashboard/rawat-inap/daftar-pasien/:encounterId/cppt'
  )
  assert.equal(
    RAWAT_INAP_PAGE_PATHS.daftarPasienQuickVitalSigns,
    '/dashboard/rawat-inap/daftar-pasien/:encounterId/vital-signs'
  )
})
