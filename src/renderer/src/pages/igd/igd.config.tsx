import { AlertOutlined, DeploymentUnitOutlined, FormOutlined, UnorderedListOutlined } from '@ant-design/icons'
import React from 'react'
import type { ReactNode } from 'react'

import { Modules } from 'simrs-types'

export const IGD_ROOT_PATH = '/dashboard/igd'

export const IGD_PAGE_PATHS = {
  daftar: `${IGD_ROOT_PATH}/daftar`,
  registrasi: `${IGD_ROOT_PATH}/registrasi`,
  triase: `${IGD_ROOT_PATH}/triase`,
  bedMap: `${IGD_ROOT_PATH}/bed-map`
} as const

export type IgdDashboardChildItem = {
  label: string
  key: string
  icon: ReactNode
}

export type IgdDashboardItem = IgdDashboardChildItem & {
  module: Modules
  children: IgdDashboardChildItem[]
}

export const IGD_DASHBOARD_ITEM: IgdDashboardItem = {
  label: 'IGD',
  key: IGD_ROOT_PATH,
  icon: <AlertOutlined />,
  module: Modules.RAWAT_DARURAT,
  children: [
    {
      label: 'Daftar Pasien',
      key: IGD_PAGE_PATHS.daftar,
      icon: <UnorderedListOutlined />
    },
    {
      label: 'Registrasi',
      key: IGD_PAGE_PATHS.registrasi,
      icon: <FormOutlined />
    },
    {
      label: 'Triase',
      key: IGD_PAGE_PATHS.triase,
      icon: <AlertOutlined />
    },
    {
      label: 'Peta Bed',
      key: IGD_PAGE_PATHS.bedMap,
      icon: <DeploymentUnitOutlined />
    }
  ]
}
