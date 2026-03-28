import {
  BarcodeOutlined,
  CalendarOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileAddOutlined,
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
import NotificationBell from '@renderer/components/molecules/NotificationBell'
import ProfileMenu from '@renderer/components/molecules/ProfileMenu'
import { useMyProfile } from '@renderer/hooks/useProfile'
import { getModuleScopeState } from '@renderer/services/ModuleScope/module-scope'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import type { PageAccessEntry, ScopeSession } from '@renderer/services/ModuleScope/type'
import { client } from '@renderer/utils/client'

// Mirrors simrs-api Modules enum — keep in sync with src/utils/constant.ts
const Modules = {
  REGISTRASI: 'REGISTRASI',
  ANTRIAN: 'ANTRIAN',
  RAWAT_JALAN: 'RAWAT_JALAN',
  RAWAT_INAP: 'RAWAT_INAP',
  OK: 'OK',
  VK: 'VK',
  MCU: 'MCU',
  RAWAT_DARURAT: 'RAWAT_DARURAT',
  LAB: 'LAB',
  RADIOLOGI: 'RADIOLOGI',
  REKAM_MEDIK: 'REKAM_MEDIK',
  FARMASI: 'FARMASI',
  KEUANGAN: 'KEUANGAN',
  PONEK: 'PONEK',
  GUDANG_FARMASI: 'GUDANG_FARMASI',
  GUDANG_UMUM: 'GUDANG_UMUM',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  BILLING_KASIR: 'BILLING_KASIR',
  MOBILE_PASIEN: 'MOBILE_PASIEN'
} as const
type Module = (typeof Modules)[keyof typeof Modules]

import type { MenuProps } from 'antd'
import { Menu, theme } from 'antd'
import { ItemType } from 'antd/es/menu/interface'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'

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

const DEFAULT_VISIBILITY_ON_UNREGISTERED_PAGE = false;

type DashboardMenuChild = {
  label: string
  key: string
  icon: ReactNode
}

type DashboardMenuItem = DashboardMenuChild & {
  module?: Module
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
    label: 'Registrasi',
    key: '/dashboard/registration',
    icon: <CalendarOutlined />,
    module: Modules.REGISTRASI,
    children: [
      { label: 'Pasien', key: '/dashboard/patient', icon: <UserOutlined /> },
      { label: 'Pendaftaran', key: '/dashboard/registration', icon: <DashboardOutlined /> },
      {
        label: 'Antrian Pasien',
        key: '/dashboard/registration/select',
        icon: <DashboardOutlined />
      },
      {
        label: 'Antrian Mendatang',
        key: '/dashboard/registration/upcoming-queue',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Kioska',
        key: '/dashboard/registration/kioska',
        icon: <BarcodeOutlined />
      },
      // {
      //   label: 'Daftar Kunjungan',
      //   key: '/dashboard/registration/active-encounters',
      //   icon: <UnorderedListOutlined />
      // },
      { label: 'Antrian', key: '/dashboard/queue', icon: <CalendarOutlined /> },
      {
        label: 'Monitor Antrian Dokter',
        key: '/dashboard/queue/monitor',
        icon: <UnorderedListOutlined />
      }
    ]
  },
  {
    label: 'Rawat Jalan',
    key: '/dashboard/poli',
    icon: <CalendarOutlined />,
    module: Modules.RAWAT_JALAN,
    children: [
      { label: 'Poli', key: '/dashboard/poli', icon: <CalendarOutlined /> },
      { label: 'Poli Umum', key: '/dashboard/poli/umum', icon: <CalendarOutlined /> },
      { label: 'Rekam Medis Dokter', key: '/dashboard/doctor', icon: <FileTextOutlined /> },
      { label: 'Pemanggilan Pasien', key: '/dashboard/nurse-calling', icon: <PhoneOutlined /> }
    ]
  },
  {
    label: 'Rawat Inap',
    key: '/dashboard/rawat-inap',
    icon: <CalendarOutlined />,
    module: Modules.RAWAT_INAP,
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
    label: 'Farmasi',
    key: '/dashboard/medicine',
    icon: <WalletOutlined />,
    module: Modules.FARMASI,
    children: [
      { label: 'Dashboard Obat', key: '/dashboard/medicine', icon: <MedicineBoxOutlined /> },
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
      {
        label: 'Kategori Item',
        key: '/dashboard/medicine/medicine-categories',
        icon: <UnorderedListOutlined />
      },
      { label: 'Kode KFA', key: '/dashboard/medicine/kfa-codes', icon: <UnorderedListOutlined /> },
      { label: 'Obat dan Barang Umum', key: '/dashboard/medicine/items', icon: <ExperimentOutlined /> },
      { label: 'Obat dan Barang BPJS', key: '/dashboard/medicine/items-bpjs', icon: <ExperimentOutlined /> },
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
    module: Modules.LAB,
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
    label: 'Kasir & Billing',
    key: '/dashboard/kasir',
    icon: <WalletOutlined />,
    module: Modules.BILLING_KASIR,
    children: [
      {
        label: 'Tagihan Pasien',
        key: '/dashboard/kasir',
        icon: <FileTextOutlined />
      }
    ]
  },
  {
    label: 'Sistem',
    key: '/dashboard/pegawai',
    icon: <DashboardOutlined />,
    module: Modules.SYSTEM_ADMIN,
    children: [
      { label: 'Data Petugas Medis', key: '/dashboard/pegawai', icon: <UserOutlined /> },
      {
        label: 'Lap Data Petugas Medis',
        key: '/dashboard/pegawai-report',
        icon: <DashboardOutlined />
      }
    ]
  }
]

const isPageVisible = (access: PageAccessEntry | undefined, session: ScopeSession): boolean => {
  // return true
  if (!access) return true

  const { allowedModules, roles, allowedLokasiKerjaIds } = access

  // Administrator bypasses module restrictions
  const isAdministrator = session.hakAksesId === 'administrator';

  if (allowedModules.length > 0 && !session.allowedModules.some((m) => allowedModules.includes(m))) {
    // console.log('no module akses for modules', session.allowedModules, 'allowed:', allowedModules)
    return false
  }
  if (allowedLokasiKerjaIds.length > 0 && !allowedLokasiKerjaIds.includes(session.lokasiKerjaId)) {
    // console.log('no lokasi akses for lokasi', session.lokasiKerjaId, 'allowed:', access.allowedLokasiKerjaIds)
    return false
  }

  const isRoleAllowed = isAdministrator || (roles.length > 0 && session.hakAksesId && roles.includes(session.hakAksesId))
  if (!isRoleAllowed) {
    // console.log('no role akses for role', session.hakAksesId, 'allowed:', roles)
    return false
  }

  // console.log('access granted for', session)
  // console.log('checked againts', access)
  return true
}

const isPageNotRegistered = (access: PageAccessEntry | null) => {
  return !access ||
      (!access.allowedModules.length &&
        !access.roles.length &&
        !access.allowedLokasiKerjaIds.length);
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
      console.error('page not registered! please register to PageAccount seeder', child, access);
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
          ? { children: filterChildrenBySession(item.children, pageAccessMap, session) }
          : {})
      })
      return result
    }

    if (!session) return result

    const access = pageAccessMap[item.key]
    const visibleChildren = filterChildrenBySession(item.children, pageAccessMap, session)

    // Parent is visible if its own access passes OR if it has visible children
    const parentVisible = isPageNotRegistered(access) ? DEFAULT_VISIBILITY_ON_UNREGISTERED_PAGE
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
  const { token } = theme.useToken()
  const location = useLocation()
  const session = useModuleScopeStore((state) => state.session)
  const visibleModuleState = getModuleScopeState(session)

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

  const { profile } = useMyProfile()
  console.log('session', session)
  console.log('profile', profile)
  
  if (!Object.keys(pageAccessMap).length) {
    console.error('PageAccess map not found!')
  }
  const visibleItems = filterItemsBySession(items, pageAccessMap, session)
  const registeredPrefixes = [
    '/dashboard/expense',
    '/dashboard/patient',
    '/dashboard/encounter',
    '/dashboard/income',
    '/dashboard/registration/jaminan',
    '/dashboard/registration/medical-staff-schedule',
    '/dashboard/pegawai',
    '/dashboard/registration',
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
    '/dashboard/medicine',
    '/dashboard/registration/doctor-leave',
    '/dashboard/doctor',
    '/dashboard/nurse-calling',
    '/dashboard/rawat-inap',
    '/dashboard/poli',
    '/dashboard/kasir'
  ]
  const isRegisteredPath = (path: string): boolean => {
    if (path === DASHBOARD_ROOT_KEY) return true
    return registeredPrefixes.some((prefix) => path.startsWith(prefix))
  }
  const findLabelByPath = (path: string): string => {
    const top = visibleItems.find((i) => path.startsWith(i.key))
    if (top && path === top.key) return top.label
    for (const i of visibleItems) {
      const child = (i.children || []).find((c) => path.startsWith(c.key))
      if (child) return child.label
    }
    return top ? top.label : path
  }
  const getTopKeyFromPath = (path: string): string => {
    if (
      path.startsWith('/dashboard/doctor') &&
      visibleItems.some((item) => item.key === '/dashboard/doctor')
    ) {
      return '/dashboard/doctor'
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
  const initialTop = getTopKeyFromPath(location.pathname)
  const [activeTop, setActiveTop] = useState<string>(initialTop)
  const childrenOfTop = (key: string) => {
    const top = visibleItems.find((i) => i.key === key)
    if (!top) return [] as ItemType[]
    if (Array.isArray(top.children) && top.children.length > 0) {
      return top.children.map((c) => ({ label: c.label, key: c.key, icon: c.icon })) as ItemType[]
    }
    return [{ label: top.label, key: top.key, icon: top.icon } as ItemType]
  }
  const childKeysOfTop = (key: string): string[] => {
    const top = visibleItems.find((i) => i.key === key)
    if (!top) return []
    if (Array.isArray(top.children) && top.children.length > 0)
      return top.children.map((c) => c.key)
    return [top.key]
  }
  const [sideItems, setSideItems] = useState<ItemType[]>(childrenOfTop(initialTop))
  const initialSide = location.pathname.startsWith(initialTop)
    ? location.pathname
    : (sideItems[0]?.key as string)
  const [activeSide, setActiveSide] = useState<string>(initialSide)
  const [collapsed, setCollapsed] = useState(false)

  const navigate = useNavigate()
  const onSideClick: MenuProps['onClick'] = (e) => {
    const key = String(e.key)
    navigate(key)
    setActiveSide(key)
  }
  const topItems = visibleItems.map((i) => ({
    label: i.label,
    key: i.key,
    icon: i.icon
  })) as ItemType[]
  const onTopClick: MenuProps['onClick'] = (e) => {
    const key = String(e.key)
    setActiveTop(key)
    const children = childrenOfTop(key)
    setSideItems(children)
    const nextSide = (children[0]?.key as string) || key
    setActiveSide(nextSide)
    navigate(key)
  }

  useEffect(() => {
    const newTop = getTopKeyFromPath(location.pathname)
    setActiveTop(newTop)
    const children = childrenOfTop(newTop)
    setSideItems(children)
    const childKeys = childKeysOfTop(newTop)
    const match = childKeys
      .filter((key) => location.pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0]

    setActiveSide(match || (children[0]?.key as string))
  }, [location.pathname, session, visibleModuleState.visibleModules.join('|')])

  const isWorkspaceRoute =
    location.pathname.match(/^\/dashboard\/(doctor|nurse-calling\/medical-record)\/[^/]+$/) !== null

  if (isWorkspaceRoute) {
    return (
      <div
        className="h-screen w-screen overflow-hidden"
        style={{ backgroundColor: token.colorBgLayout }}
      >
        <Outlet />
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <aside
        style={{
          backgroundColor: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`
        }}
        className={`${collapsed ? 'w-20' : 'w-64'} flex flex-col transition-all duration-300`}
      >
        <div
          style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
          className="h-14 px-4 flex items-center justify-center"
        >
          <div className="flex items-center justify-center gap-2">
            <img src={logoUrl} alt="Logo" className="w-8 h-8" />
            <span
              style={{ color: token.colorText }}
              className={`${collapsed ? 'hidden' : 'font-semibold text-lg'}`}
            >
              SIMRS
            </span>
          </div>
        </div>
        <Menu
          onClick={onSideClick}
          selectedKeys={[activeSide]}
          mode="inline"
          inlineCollapsed={collapsed}
          items={sideItems}
          style={{ borderInlineEnd: 0, backgroundColor: 'transparent' }}
        />
        <div className="mt-auto px-4 py-3 flex justify-center">
          <button
            aria-label="Toggle sidebar"
            className="p-2 rounded-full transition-colors flex items-center justify-center border-none cursor-pointer"
            style={{
              backgroundColor: token.colorBgLayout,
              color: token.colorPrimary,
              width: 36,
              height: 36
            }}
            onClick={() => setCollapsed((p) => !p)}
          >
            {collapsed ? <RightCircleFilled /> : <LeftCircleFilled />}
          </button>
        </div>
      </aside>
      <div
        className={`flex-1 transition-all duration-300 flex flex-col overflow-y-auto h-full ${collapsed ? 'max-w-[calc(100vw-5rem)]' : 'max-w-[calc(100vw-16rem)]'}`}
      >
        <header
          className="sticky top-0 z-50 px-4 flex items-center justify-between gap-4 transition-colors"
          style={{
            height: 56,
            minHeight: 56,
            maxHeight: 56,
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`
          }}
        >
          <Menu
            mode="horizontal"
            onClick={onTopClick}
            selectedKeys={[activeTop]}
            items={topItems}
            style={{
              minWidth: 0,
              flex: 'auto',
              height: 55,
              lineHeight: '55px',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              borderBottom: 'none'
            }}
          />
          {/* <SendNotificationButton /> */}
          <NotificationBell />
          <ProfileMenu />
        </header>
        <div className="p-4 flex-1" style={{ backgroundColor: token.colorBgLayout }}>
          {isRegisteredPath(location.pathname) ? (
            <Outlet />
          ) : (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
              <div className="text-base md:text-lg font-medium" style={{ color: token.colorText }}>
                {findLabelByPath(location.pathname)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
