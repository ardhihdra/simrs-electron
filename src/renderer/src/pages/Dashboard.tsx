import {
  BarcodeOutlined,
  CalendarOutlined,
  CameraOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileAddOutlined,
  FileProtectOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  LeftCircleFilled,
  MedicineBoxOutlined,
  PhoneOutlined,
  RightCircleFilled,
  UnorderedListOutlined,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons'
import logoUrl from '@renderer/assets/logo.png'
import {
  DesktopMenuShell,
  type DesktopMenuShellNavItem,
  type DesktopMenuShellTabItem
} from '@renderer/components/design-system/organisms/DesktopMenuShell'
import NotificationBell from '@renderer/components/molecules/NotificationBell'
import ProfileMenu from '@renderer/components/molecules/ProfileMenu'
import { useActiveLokasiKerjaName } from '@renderer/pages/non-medic-queue/useActiveLokasiKerjaName'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import type { PageAccessEntry, ScopeSession } from '@renderer/services/ModuleScope/type'
import { isPageVisible } from '@renderer/services/ModuleScope/utils'
import { client } from '@renderer/utils/client'
import dayjs from 'dayjs'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Modules } from 'simrs-types'
import {
  closeDashboardTab,
  isCloseActiveTabShortcut,
  ensureDashboardTab,
  resolveInitialDashboardTabs,
  syncDashboardTabsWithLocation,
  type DashboardTabItem
} from './Dashboard.shell.helpers'
// const SendNotificationButton = () => {
//   const { message } = AntdApp.useApp()
//   return (
//     <Button
//       size="small"
//       onClick={async () => {
//         try {
//           await window.api.notification.send({
//             title: 'Test Notification',
//             content: 'This is a test notification sent from the renderer.'
//           })
//           message.success('Notification sent!')
//         } catch (error) {
//           console.error(error)
//           message.error('Failed to send notification')
//         }
//       }}
//     >
//       Send Notification
//     </Button>
//   )
// }

const DEFAULT_VISIBILITY_ON_UNREGISTERED_PAGE = true

const needsWorkspacePicker = (hakAksesId: string | undefined | null): boolean => {
  return hakAksesId !== 'doctor' && hakAksesId !== 'nurse'
}

type DashboardMenuChild = {
  label: string
  key: string
  icon: ReactNode
  badge?: ReactNode
}

type DashboardMenuItem = DashboardMenuChild & {
  module?: string
  children?: DashboardMenuChild[]
}

const DASHBOARD_ROOT_KEY = '/dashboard'

const items: DashboardMenuItem[] = [
  {
    label: 'Dashboard',
    key: DASHBOARD_ROOT_KEY,
    icon: <DashboardOutlined />
  },

  {
    label: 'Antrian Umum',
    key: '/dashboard/non-medic-queue',
    icon: <UnorderedListOutlined />,
    module: 'BILLING_KASIR',
    children: [
      {
        label: 'KIOSK Billing',
        key: '/dashboard/non-medic-queue/kiosk/billing',
        icon: <BarcodeOutlined />
      },
      {
        label: 'KIOSK Kasir',
        key: '/dashboard/non-medic-queue/kiosk/cashier',
        icon: <BarcodeOutlined />
      },
      {
        label: 'KIOSK Farmasi',
        key: '/dashboard/non-medic-queue/kiosk/pharmacy',
        icon: <BarcodeOutlined />
      },
      {
        label: 'KIOSK Pendaftaran',
        key: '/dashboard/non-medic-queue/kiosk/registration',
        icon: <BarcodeOutlined />
      },
      {
        label: 'Billing',
        key: '/dashboard/non-medic-queue/billing',
        icon: <WalletOutlined />
      },
      {
        label: 'Kasir',
        key: '/dashboard/non-medic-queue/cashier',
        icon: <WalletOutlined />
      },
      {
        label: 'Farmasi',
        key: '/dashboard/non-medic-queue/pharmacy',
        icon: <MedicineBoxOutlined />
      },
      {
        label: 'Pendaftaran',
        key: '/dashboard/non-medic-queue/registration',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Service Point',
        key: '/dashboard/non-medic-queue/service-points',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Workspace Counter',
        key: '/dashboard/non-medic-queue/workspace',
        icon: <PhoneOutlined />
      }
    ]
  },
  {
    label: 'Registrasi',
    key: '/dashboard/registration',
    icon: <CalendarOutlined />,
    module: 'REGISTRASI',
    children: [
      { label: 'Pasien', key: '/dashboard/patient', icon: <UserOutlined /> },
      {
        label: 'Pendaftaran',
        key: '/dashboard/registration/manage',
        icon: <DashboardOutlined />
      },
      {
        label: 'Antrian Poli',
        key: '/dashboard/registration/select',
        icon: <DashboardOutlined />
      },
      {
        label: 'Antrian Mendatang',
        key: '/dashboard/registration/upcoming-queue',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Antrian Global Pendaftaran',
        key: '/dashboard/registration/global-queue',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Antrian Pendaftaran Non-Medis',
        key: '/dashboard/registration/non-medic-queue',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Kioska',
        key: '/kioska/global',
        icon: <BarcodeOutlined />
      },
      // {
      //   label: 'Daftar Kunjungan',
      //   key: '/dashboard/registration/active-encounters',
      //   icon: <UnorderedListOutlined />
      // },
      { label: 'Monitor Antrian', key: '/dashboard/queue', icon: <CalendarOutlined /> },
      {
        label: 'Monitor Antrian Dokter',
        key: '/dashboard/queue/monitor',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Jadwal Dokter',
        key: '/dashboard/registration/doctor-schedule',
        icon: <CalendarOutlined />
      },
      {
        label: 'Laporan Kunjungan',
        key: '/dashboard/registration/laporan-kunjungan',
        icon: <FileTextOutlined />
      }
    ]
  },
  {
    label: 'Rawat Jalan',
    key: '/dashboard/poli',
    icon: <CalendarOutlined />,
    module: 'RAWAT_JALAN',
    children: [
      { label: 'Poli', key: '/dashboard/poli', icon: <CalendarOutlined /> },
      {
        label: 'Poli Umum',
        key: '/dashboard/poli/umum',
        icon: <CalendarOutlined />
      },
      {
        label: 'Rekam Medis Dokter',
        key: '/dashboard/doctor',
        icon: <FileTextOutlined />
      },
      {
        label: 'Pemanggilan Pasien',
        key: '/dashboard/nurse-calling',
        icon: <PhoneOutlined />
      }
    ]
  },
  {
    label: 'Rawat Inap',
    key: '/dashboard/rawat-inap',
    icon: <CalendarOutlined />,
    module: 'RAWAT_INAP',
    children: [
      {
        label: 'Rawat Inap 1',
        key: '/dashboard/rawat-inap/ranap-1/class-1',
        icon: <CalendarOutlined />
      },
      {
        label: 'Rawat Inap 2',
        key: '/dashboard/rawat-inap/ranap-2/class1',
        icon: <CalendarOutlined />
      }
    ]
  },
  {
    label: 'Kamar Operasi (OK)',
    key: '/dashboard/ok',
    icon: <FileTextOutlined />,
    module: 'OK',
    children: [
      {
        label: 'Dashboard OK',
        key: '/dashboard/ok/dashboard',
        icon: <DashboardOutlined />
      },
      {
        label: 'Pengajuan OK',
        key: '/dashboard/ok/pengajuan',
        icon: <FileAddOutlined />
      },
      {
        label: 'Antrian & Verifikasi OK',
        key: '/dashboard/ok/verifikasi',
        icon: <UnorderedListOutlined />
      }
    ]
  },
  {
    label: 'Farmasi',
    key: '/dashboard/medicine',
    icon: <WalletOutlined />,
    module: 'FARMASI',
    children: [
      { label: 'Dashboard Obat', key: '/dashboard/medicine', icon: <MedicineBoxOutlined /> },
      { label: 'Pasien', key: '/dashboard/medicine/patient', icon: <UserOutlined /> },
      {
        label: 'Permintaan Obat (Resep)',
        key: '/dashboard/medicine/medication-requests',
        icon: <FileAddOutlined />
      },
      {
        label: 'Penyerahan Obat',
        key: '/dashboard/medicine/medication-dispenses',
        icon: <MedicineBoxOutlined />
      },
      // {
      //   label: 'Kategori Item',
      //   key: '/dashboard/medicine/medicine-categories',
      //   icon: <UnorderedListOutlined />
      // },
      // { label: 'Kode KFA', key: '/dashboard/medicine/kfa-codes', icon: <UnorderedListOutlined /> },
      // { label: 'Obat dan Barang Umum', key: '/dashboard/medicine/items', icon: <ExperimentOutlined /> },
      // { label: 'Obat dan Barang BPJS', key: '/dashboard/medicine/items-bpjs', icon: <ExperimentOutlined /> },
      {
        label: 'Transaksi Penjualan Barang',
        key: '/dashboard/medicine/item-purchase',
        icon: <WalletOutlined />
      },
      { label: 'Laporan', key: '/dashboard/medicine/report', icon: <FileTextOutlined /> }
    ]
  },
  {
    label: 'Laboratorium',
    key: '/dashboard/laboratory-management',
    icon: <ExperimentOutlined />,
    module: 'LAB',
    children: [
      {
        label: 'Antrian',
        key: '/dashboard/laboratory-management/queue',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Permintaan',
        key: '/dashboard/laboratory-management/requests',
        icon: <FileAddOutlined />
      },
      {
        label: 'Hasil',
        key: '/dashboard/laboratory-management/results',
        icon: <FileTextOutlined />
      },
      {
        label: 'Laporan',
        key: '/dashboard/laboratory-management/reports',
        icon: <FileSearchOutlined />
      }
    ]
  },
  {
    label: 'Radiologi',
    key: '/dashboard/radiology-management',
    icon: <CameraOutlined />,
    module: Modules.RADIOLOGI,
    children: [
      {
        label: 'Antrian',
        key: '/dashboard/radiology-management/queue',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Permintaan',
        key: '/dashboard/radiology-management/requests',
        icon: <FileAddOutlined />
      },
      {
        label: 'Hasil',
        key: '/dashboard/radiology-management/results',
        icon: <FileTextOutlined />
      },
      {
        label: 'Laporan',
        key: '/dashboard/radiology-management/reports',
        icon: <FileSearchOutlined />
      }
    ]
  },
  {
    label: 'Kasir & Billing',
    key: '/dashboard/kasir',
    icon: <WalletOutlined />,
    module: 'BILLING_KASIR',
    children: [
      {
        label: 'Billing (Verifikasi)',
        key: '/dashboard/billing',
        icon: <FileProtectOutlined />
      },
      {
        label: 'Kasir (Pembayaran)',
        key: '/dashboard/kasir',
        icon: <FileTextOutlined />
      }
    ]
  },
  {
    label: 'Sistem',
    key: '/dashboard/pegawai',
    icon: <DashboardOutlined />,
    module: 'SYSTEM_ADMIN',
    children: [
      {
        label: 'Data Petugas Medis',
        key: '/dashboard/pegawai',
        icon: <UserOutlined />
      },
      {
        label: 'Lap Data Petugas Medis',
        key: '/dashboard/pegawai-report',
        icon: <DashboardOutlined />
      }
    ]
  }
]

const isPageNotRegistered = (access: PageAccessEntry | null) => {
  return (
    !access ||
    (!access.allowedModules.length && !access.roles.length && !access.allowedLokasiKerjaIds.length)
  )
}

const filterChildrenBySession = (
  children: DashboardMenuChild[] | undefined,
  pageAccessMap: Record<string, PageAccessEntry>,
  session: ScopeSession | null
): DashboardMenuChild[] => {
  if (!children?.length) return []
  if (!session) return []

  return children.filter((child) => {
    const access = pageAccessMap[child.key]
    if (isPageNotRegistered(access)) {
      console.error('page not registered! please register to PageAccount seeder', child, access)
      return DEFAULT_VISIBILITY_ON_UNREGISTERED_PAGE
    }
    return isPageVisible(access, session)
  })
}

const filterItemsBySession = (
  menuItems: DashboardMenuItem[],
  pageAccessMap: Record<string, PageAccessEntry>,
  session: ScopeSession | null
) => {
  return menuItems.reduce<DashboardMenuItem[]>((result, item) => {
    if (item.key === DASHBOARD_ROOT_KEY) {
      result.push({
        ...item,
        ...(item.children
          ? {
              children: filterChildrenBySession(item.children, pageAccessMap, session)
            }
          : {})
      })
      return result
    }

    if (!session) return result

    const access = pageAccessMap[item.key]
    const visibleChildren = filterChildrenBySession(item.children, pageAccessMap, session)

    // Parent is visible if its own access passes OR if it has visible children
    const parentVisible = isPageNotRegistered(access)
      ? DEFAULT_VISIBILITY_ON_UNREGISTERED_PAGE
      : isPageVisible(access, session)

    if (parentVisible || visibleChildren.length > 0) {
      result.push({
        ...item,
        ...(item.children ? { children: visibleChildren } : {})
      })
    }

    return result
  }, [])
}

function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = useModuleScopeStore((state) => state.session)
  const { lokasiKerjaName } = useActiveLokasiKerjaName()

  const { data: poliData } = client.visitManagement.poli.useQuery({})
  const isAdministrator = session?.hakAksesId === 'administrator'
  const listPoli = useMemo(
    () =>
      (poliData?.result ?? [])
        .map((poli) => ({
          id: poli.id,
          name: poli.name,
          code: poli.code || poli.id.toString(),
          lokasiKerjaId: poli.location?.id
        }))
        .filter((poli) => {
          if (isAdministrator) return true
          return poli.lokasiKerjaId === session?.lokasiKerjaId
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'id')),
    [isAdministrator, poliData?.result, session?.lokasiKerjaId]
  )

  const billingBoard = client.nonMedicQueue.getBoard.useQuery(
    {
      lokasiKerjaId: session?.lokasiKerjaId ?? 0,
      serviceTypeCode: 'BILLING',
      queueDate: dayjs().format('YYYY-MM-DD')
    },
    {
      enabled: !!session?.lokasiKerjaId,
      refetchInterval: 60000,
      queryKey: [
        'nonMedicQueue.getBoard',
        {
          lokasiKerjaId: session?.lokasiKerjaId ?? 0,
          serviceTypeCode: 'BILLING',
          queueDate: dayjs().format('YYYY-MM-DD')
        }
      ]
    }
  )

  const cashierBoard = client.nonMedicQueue.getBoard.useQuery(
    {
      lokasiKerjaId: session?.lokasiKerjaId ?? 0,
      serviceTypeCode: 'CASHIER',
      queueDate: dayjs().format('YYYY-MM-DD')
    },
    {
      enabled: !!session?.lokasiKerjaId,
      refetchInterval: 60000,
      queryKey: [
        'nonMedicQueue.getBoard',
        {
          lokasiKerjaId: session?.lokasiKerjaId ?? 0,
          serviceTypeCode: 'CASHIER',
          queueDate: dayjs().format('YYYY-MM-DD')
        }
      ]
    }
  )

  // Map from normalized poli key → original poli metadata (for role-aware navigation)
  const poliKeyMeta = useMemo(() => {
    const map: Record<string, { code: string; name: string }> = {}
    listPoli.forEach((poli) => {
      const key = `/dashboard/poli/${String(poli.code).trim().toLowerCase()}`
      map[key] = { code: String(poli.code).trim().toLowerCase(), name: poli.name }
    })
    return map
  }, [listPoli])

  const dynamicItems = useMemo(() => {
    return items.map((item) => {
      if (item.key === '/dashboard/poli') {
        const dynamicPoliChildren = listPoli.map((poli) => {
          const lowerName = poli.name.toLowerCase()
          const nameWithPrefix = lowerName.startsWith('poli') ? poli.name : `Poli ${poli.name}`

          return {
            label: nameWithPrefix,
            key: `/dashboard/poli/${String(poli.code).trim().toLowerCase()}`,
            icon: <CalendarOutlined />
          }
        })
        return {
          ...item,
          children: [
            { label: 'Poli', key: '/dashboard/poli', icon: <CalendarOutlined /> },
            ...dynamicPoliChildren
          ]
        }
      }
      if (item.key === '/dashboard/non-medic-queue') {
        const waitingBilling =
          (billingBoard.data?.result as { waitingTotal?: number } | undefined)?.waitingTotal ?? 0
        const waitingCashier =
          (cashierBoard.data?.result as { waitingTotal?: number } | undefined)?.waitingTotal ?? 0

        return {
          ...item,
          children: (item.children ?? []).map((child) => {
            if (child.key === '/dashboard/non-medic-queue/billing') {
              return {
                ...child,
                badge:
                  waitingBilling > 0 ? <span className="text-xs font-semibold">{waitingBilling}</span> : undefined
              }
            }
            if (child.key === '/dashboard/non-medic-queue/cashier') {
              return {
                ...child,
                badge:
                  waitingCashier > 0 ? <span className="text-xs font-semibold">{waitingCashier}</span> : undefined
              }
            }
            return child
          })
        }
      }
      return item
    })
  }, [listPoli, billingBoard.data, cashierBoard.data])

  const { data: pageAccessData } = client.pageAccess.list.useQuery({})
  const pageAccessMap = useMemo(() => {
    const map: Record<string, PageAccessEntry> = {}
    for (const item of pageAccessData?.result ?? []) {
      map[item.page_path] = {
        allowedModules: (item.allowedModules as string[] | undefined) ?? [],
        roles: (item.roles as string[] | undefined) ?? [],
        allowedLokasiKerjaIds: (item.allowedLokasiKerjaIds as number[] | undefined) ?? []
      }
    }
    return map
  }, [pageAccessData])

  if (!Object.keys(pageAccessMap).length) {
    console.error('PageAccess map not found!')
  }
  const visibleItems = useMemo(
    () => filterItemsBySession(dynamicItems, pageAccessMap, session),
    [dynamicItems, pageAccessMap, session]
  )
  const registeredPrefixes = [
    '/dashboard/expense',
    '/dashboard/patient',
    '/dashboard/encounter',
    '/dashboard/income',
    '/dashboard/registration/jaminan',
    '/dashboard/registration/medical-staff-schedule',
    '/dashboard/pegawai',
    '/dashboard/registration',
    '/dashboard/registration/doctor-schedule',
    '/dashboard/registration/medical-staff-schedule',
    '/dashboard/queue',
    '/dashboard/diagnostic',
    '/dashboard/services',
    '/dashboard/service-request',
    '/dashboard/pharmacy',
    '/dashboard/pendaftaran',
    '/dashboard/registration/doctor-leave',
    '/dashboard/pharmacy',
    '/dashboard/laboratory',
    '/dashboard/laboratory-management',
    '/dashboard/radiology-management',
    '/dashboard/medicine',
    '/dashboard/registration/doctor-leave',
    '/dashboard/doctor',
    '/dashboard/nurse-calling',
    '/dashboard/rawat-inap',
    '/dashboard/poli',
    '/dashboard/kasir',
    '/dashboard/billing',
    '/dashboard/ok',
    '/dashboard/non-medic-queue'
  ]
  const isRegisteredPath = (path: string): boolean => {
    if (path === DASHBOARD_ROOT_KEY) return true
    return registeredPrefixes.some((prefix) => path.startsWith(prefix))
  }
  const findLabelByPath = useCallback((path: string): string => {
    const candidates = visibleItems.flatMap((item) => [item, ...(item.children ?? [])])
    const match = candidates
      .filter((item) => path.startsWith(item.key))
      .sort((a, b) => b.key.length - a.key.length)[0]

    return match?.label ?? path
  }, [visibleItems])
  const getTopKeyFromPath = (path: string): string => {
    if (
      path.startsWith('/dashboard/doctor') &&
      visibleItems.some((item) => item.key === '/dashboard/poli')
    ) {
      return '/dashboard/poli'
    }
    for (const top of visibleItems) {
      const children = Array.isArray(top.children) ? top.children : []
      const match = children.find((c) => path.startsWith(c.key))
      if (match) return top.key
    }
    const sorted = [...visibleItems].sort((a, b) => b.key.length - a.key.length)
    const found = sorted.find((item) => path.startsWith(item.key))
    return found?.key || visibleItems[0]?.key || DASHBOARD_ROOT_KEY
  }
  const childrenOfTop = (key: string): DashboardMenuChild[] => {
    const top = visibleItems.find((i) => i.key === key)
    if (!top) return []
    if (Array.isArray(top.children) && top.children.length > 0) {
      return top.children
    }
    return [{ label: top.label, key: top.key, icon: top.icon, badge: top.badge }]
  }
  const childKeysOfTop = useCallback((key: string): string[] => {
    const top = visibleItems.find((i) => i.key === key)
    if (!top) return []
    if (Array.isArray(top.children) && top.children.length > 0)
      return top.children.map((c) => c.key)
    return [top.key]
  }, [visibleItems])
  const routeTopKey = getTopKeyFromPath(location.pathname)
  const [selectedModuleKey, setSelectedModuleKey] = useState<string>(routeTopKey)
  const activeTop = visibleItems.some((item) => item.key === selectedModuleKey)
    ? selectedModuleKey
    : routeTopKey
  const sideItems = childrenOfTop(activeTop)
  const [collapsed, setCollapsed] = useState(false)
  const [tabState, setTabState] = useState<{ tabs: DashboardTabItem[]; activeKey: string }>({
    tabs: [],
    activeKey: ''
  })
  const KIOSKA_KEY = '/dashboard/registration/kioska'
  const resolveNavigationForMenuKey = useCallback((
    key: string
  ): { tab: DashboardTabItem; navigateTo: string } => {
    const selectedPoli = poliKeyMeta[key]

    if (selectedPoli && needsWorkspacePicker(session?.hakAksesId)) {
      const params = new URLSearchParams({ selectPoli: selectedPoli.code })
      return {
        tab: {
          key,
          href: `/dashboard/poli?${params.toString()}`,
          label: findLabelByPath(key)
        },
        navigateTo: `/dashboard/poli?${params.toString()}`
      }
    }

    return {
      tab: {
        key,
        href: key,
        label: findLabelByPath(key)
      },
      navigateTo: key
    }
  }, [findLabelByPath, poliKeyMeta, session?.hakAksesId])
  const activeSide = (() => {
    const childKeys = childKeysOfTop(activeTop)

    if (location.pathname.startsWith('/dashboard/doctor')) {
      const searchParams = new URLSearchParams(location.search)
      const poliCode = searchParams.get('poliCode')

      if (poliCode) {
        const poliKey = `/dashboard/poli/${poliCode.trim().toLowerCase()}`
        if (childKeys.includes(poliKey)) return poliKey
      }
    }

    return (
      childKeys
        .filter((key) => location.pathname.startsWith(key))
        .sort((a, b) => b.length - a.length)[0] || sideItems[0]?.key
    )
  })()
  const openSidebarKey = (key: string) => {
    if (key === KIOSKA_KEY) {
      const base = window.location.href.split('#')[0]
      window.open(`${base}#${key}`, '_blank')
      return
    }

    setSelectedModuleKey(getTopKeyFromPath(key))
    const navigation = resolveNavigationForMenuKey(key)
    setTabState((current) => ensureDashboardTab(current.tabs, navigation.tab))
    navigate(navigation.navigateTo)
  }
  const activateModule = (key: string) => {
    setSelectedModuleKey(key)
  }

  const isWorkspaceRoute =
    location.pathname.match(/^\/dashboard\/(doctor|nurse-calling\/medical-record)\/[^/]+$/) !== null
  const locationTab = useMemo(() => {
    if (isWorkspaceRoute) return null
    const currentLocationHref = location.search
      ? `${location.pathname}${location.search}`
      : location.pathname

    if (location.pathname === '/dashboard/poli') {
      const searchParams = new URLSearchParams(location.search)
      const selectedPoli = searchParams.get('selectPoli')

      if (selectedPoli) {
        const menuKey = `/dashboard/poli/${selectedPoli.trim().toLowerCase()}`

        return {
          key: menuKey,
          href: currentLocationHref,
          label: findLabelByPath(menuKey)
        }
      }
    }

    return {
      key: currentLocationHref,
      href: currentLocationHref,
      label: findLabelByPath(location.pathname)
    }
  }, [findLabelByPath, isWorkspaceRoute, location.pathname, location.search])

  useEffect(() => {
    setSelectedModuleKey(routeTopKey)
  }, [routeTopKey])

  useEffect(() => {
    if (!locationTab) return

    setTabState((current) => {
      if (!current.tabs.length) {
        return resolveInitialDashboardTabs({
          pathname: locationTab.key,
          fallbackTab: locationTab,
          findTab: (key) => (key === locationTab.key ? locationTab : undefined)
        })
      }

      return syncDashboardTabsWithLocation(current, locationTab)
    })
  }, [locationTab])

  const onTabSelect = (key: string) => {
    const tab = tabState.tabs.find((item) => item.key === key)
    if (!tab) return

    setSelectedModuleKey(getTopKeyFromPath((tab.href ?? tab.key).split('?')[0]))
    setTabState((current) => ({ ...current, activeKey: key }))
    navigate(tab.href ?? tab.key)
  }
  const onTabClose = (key: string) => {
    const fallbackKey = childKeysOfTop(activeTop)[0] ?? activeTop
    const fallbackNavigation = resolveNavigationForMenuKey(fallbackKey)
    const nextState = closeDashboardTab({
      tabs: tabState.tabs,
      activeKey: tabState.activeKey,
      closingKey: key,
      fallbackTab: fallbackNavigation.tab
    })

    setTabState(nextState)

    if (tabState.activeKey !== key) return

    const nextTab = nextState.tabs.find((tab) => tab.key === nextState.activeKey)
    navigate(nextTab?.href ?? nextTab?.key ?? fallbackNavigation.navigateTo)
  }

  useEffect(() => {
    const activeKey = tabState.activeKey
    if (!activeKey) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isCloseActiveTabShortcut(event)) return

      event.preventDefault()
      const fallbackKey = childKeysOfTop(activeTop)[0] ?? activeTop
      const fallbackNavigation = resolveNavigationForMenuKey(fallbackKey)
      const nextState = closeDashboardTab({
        tabs: tabState.tabs,
        activeKey: tabState.activeKey,
        closingKey: activeKey,
        fallbackTab: fallbackNavigation.tab
      })

      setTabState(nextState)

      const nextTab = nextState.tabs.find((tab) => tab.key === nextState.activeKey)
      navigate(nextTab?.href ?? nextTab?.key ?? fallbackNavigation.navigateTo)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeTop, childKeysOfTop, navigate, resolveNavigationForMenuKey, tabState.activeKey, tabState.tabs])

  if (isWorkspaceRoute) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-ds-background">
        <Outlet />
      </div>
    )
  }
  const currentModuleLabel = visibleItems.find((item) => item.key === activeTop)?.label ?? 'Dashboard'
  const sidebarNavItems: DesktopMenuShellNavItem[] = sideItems.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    badge: item.badge
  }))
  const moduleNavItems: DesktopMenuShellNavItem[] = visibleItems.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon
  }))
  const shellTabs: DesktopMenuShellTabItem[] = tabState.tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    closable: true
  }))

  return (
    <DesktopMenuShell
      activeModuleKey={activeTop}
      activeSidebarKey={activeSide}
      activeTabKey={tabState.activeKey}
      brandMark={<img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />}
      brandSubtitle={session?.hakAksesId ? String(session.hakAksesId).toUpperCase() : 'Operasional'}
      brandTitle="SIMRS"
      headerActions={
        <>
          <NotificationBell />
          <ProfileMenu />
        </>
      }
      moduleItems={moduleNavItems}
      onModuleSelect={activateModule}
      onSidebarSelect={openSidebarKey}
      onTabClose={onTabClose}
      onTabSelect={onTabSelect}
      sidebarCollapsed={collapsed}
      sidebarFooter={
        <div className="flex justify-center">
          <button
            aria-label="Toggle sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ds-border bg-ds-surface text-ds-accent transition-colors hover:bg-ds-surface-muted"
            onClick={() => setCollapsed((current) => !current)}
            type="button"
          >
            {collapsed ? <RightCircleFilled /> : <LeftCircleFilled />}
          </button>
        </div>
      }
      sidebarItems={sidebarNavItems}
      statusBar={
        <>
          <span className="font-semibold text-ds-muted">Server online</span>
          <span>{currentModuleLabel}</span>
          <span>{dayjs().format('DD MMM YYYY')}</span>
          <span className="ml-auto">Lokasi kerja aktif: {lokasiKerjaName}</span>
        </>
      }
      subtitle={findLabelByPath(location.pathname)}
      tabs={shellTabs}
      title={currentModuleLabel}
    >
      <div className="min-h-full bg-ds-background">
          {isRegisteredPath(location.pathname) ? (
            <Outlet />
          ) : (
            <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
              <div className="text-base font-medium text-ds-text md:text-lg">
                {findLabelByPath(location.pathname)}
              </div>
            </div>
          )}
      </div>
    </DesktopMenuShell>
  )
}

export default Dashboard
