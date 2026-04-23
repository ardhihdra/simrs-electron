import assert from 'node:assert/strict'
import test from 'node:test'

import { Modules } from 'simrs-types'

import { IGD_DASHBOARD_ITEM, IGD_PAGE_PATHS, IGD_ROOT_PATH } from './igd.config.tsx'

test('IGD dashboard item uses RAWAT_DARURAT module and expected child routes', () => {
  assert.equal(IGD_DASHBOARD_ITEM.module, Modules.RAWAT_DARURAT)
  assert.equal(IGD_DASHBOARD_ITEM.key, IGD_ROOT_PATH)
  assert.deepEqual(
    IGD_DASHBOARD_ITEM.children?.map((child) => child.key),
    [
      IGD_PAGE_PATHS.daftar,
      IGD_PAGE_PATHS.registrasi,
      IGD_PAGE_PATHS.triase,
      IGD_PAGE_PATHS.bedMap
    ]
  )
})

