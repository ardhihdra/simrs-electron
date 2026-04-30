/**
 * purpose: Define Rawat Inap dashboard root path and navigation items used by the desktop shell.
 * main callers: Dashboard module menu registration and rawat-inap route registration.
 * key dependencies: Ant Design icons and `Modules` enum from `simrs-types`.
 * main/public functions: `RAWAT_INAP_ROOT_PATH`, `RAWAT_INAP_PAGE_PATHS`, path builders for detail/quick forms, and `RAWAT_INAP_DASHBOARD_ITEM`.
 * important side effects: none.
 */
import {
  DeploymentUnitOutlined,
  SwapOutlined,
  TeamOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import React from 'react'
import type { ReactNode } from 'react'

void React

import { Modules } from 'simrs-types'

export const RAWAT_INAP_ROOT_PATH = '/dashboard/rawat-inap'

export const RAWAT_INAP_PAGE_PATHS = {
  bedMap: `${RAWAT_INAP_ROOT_PATH}/bed-map`,
  admisi: `${RAWAT_INAP_ROOT_PATH}/admisi`,
  transfer: `${RAWAT_INAP_ROOT_PATH}/transfer`,
  checkin: `${RAWAT_INAP_ROOT_PATH}/checkin`,
  pasien: `${RAWAT_INAP_ROOT_PATH}/pasien`,
  daftarPasienDetail: `${RAWAT_INAP_ROOT_PATH}/daftar-pasien/:encounterId`,
  daftarPasienQuickCppt: `${RAWAT_INAP_ROOT_PATH}/daftar-pasien/:encounterId/cppt`,
  daftarPasienQuickVitalSigns: `${RAWAT_INAP_ROOT_PATH}/daftar-pasien/:encounterId/vital-signs`
} as const

export const buildRawatInapPatientWorkspacePath = (encounterId: string) =>
  `${RAWAT_INAP_ROOT_PATH}/daftar-pasien/${encounterId}`

export const buildRawatInapQuickCpptPath = (encounterId: string) =>
  `${RAWAT_INAP_ROOT_PATH}/daftar-pasien/${encounterId}/cppt`

export const buildRawatInapQuickVitalSignsPath = (encounterId: string) =>
  `${RAWAT_INAP_ROOT_PATH}/daftar-pasien/${encounterId}/vital-signs`

export type RawatInapDashboardChildItem = {
  label: string
  key: string
  icon: ReactNode
}

export type RawatInapDashboardItem = RawatInapDashboardChildItem & {
  module: Modules
  children: RawatInapDashboardChildItem[]
}

export const RAWAT_INAP_DASHBOARD_ITEM: RawatInapDashboardItem = {
  label: 'Rawat Inap',
  key: RAWAT_INAP_ROOT_PATH,
  icon: <DeploymentUnitOutlined />,
  module: Modules.RAWAT_INAP,
  children: [
    {
      label: 'Peta Bed',
      key: RAWAT_INAP_PAGE_PATHS.bedMap,
      icon: <DeploymentUnitOutlined />
    },
    {
      label: 'Admisi Baru',
      key: RAWAT_INAP_PAGE_PATHS.admisi,
      icon: <UserAddOutlined />
    },
    {
      label: 'Transfer Antar Bangsal',
      key: RAWAT_INAP_PAGE_PATHS.transfer,
      icon: <SwapOutlined />
    },
    {
      label: 'Daftar Pasien',
      key: RAWAT_INAP_PAGE_PATHS.pasien,
      icon: <TeamOutlined />
    }
  ]
}
