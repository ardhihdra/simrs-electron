import {
  CheckCircleOutlined,
  DeploymentUnitOutlined,
  SwapOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import React from 'react'
import type { ReactNode } from 'react'

void React

import { Modules } from 'simrs-types'

export const RAWAT_INAP_ROOT_PATH = '/dashboard/rawat-inap'
export const REGISTRATION_RAWAT_INAP_ROOT_PATH = '/dashboard/registration/rawat-inap'

export const RAWAT_INAP_PAGE_PATHS = {
  bedMap: `${RAWAT_INAP_ROOT_PATH}/bed-map`,
  admisi: `${RAWAT_INAP_ROOT_PATH}/admisi`,
  transfer: `${RAWAT_INAP_ROOT_PATH}/transfer`,
  checkin: `${RAWAT_INAP_ROOT_PATH}/checkin`,
  pasien: `${RAWAT_INAP_ROOT_PATH}/pasien`,
} as const

export const REGISTRATION_RAWAT_INAP_PAGE_PATHS = {
  admisi: `${REGISTRATION_RAWAT_INAP_ROOT_PATH}/admisi`,
  checkin: `${REGISTRATION_RAWAT_INAP_ROOT_PATH}/checkin`,
  pasien: `${REGISTRATION_RAWAT_INAP_ROOT_PATH}/pasien`
} as const

export type RawatInapDashboardChildItem = {
  label: string
  key: string
  icon: ReactNode
}

export type RawatInapDashboardItem = RawatInapDashboardChildItem & {
  module: Modules
  children: RawatInapDashboardChildItem[]
}

// eslint-disable-next-line react-refresh/only-export-components
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
      label: 'Siap Checkin',
      key: RAWAT_INAP_PAGE_PATHS.checkin,
      icon: <CheckCircleOutlined />
    },
    {
      label: 'Daftar Pasien',
      key: RAWAT_INAP_PAGE_PATHS.pasien,
      icon: <TeamOutlined />
    }
  ]
}
