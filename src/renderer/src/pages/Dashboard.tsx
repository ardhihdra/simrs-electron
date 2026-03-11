import {
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
import { useSelectedModuleStore } from '@renderer/store/selectedModuleStore'

import type { MenuProps } from 'antd'
import { Menu, theme } from 'antd'
import { ItemType } from 'antd/es/menu/interface'
import { useEffect, useState, type ReactNode } from 'react'
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

type DashboardMenuChild = {
  label: string
  key: string
  icon: ReactNode
}

type DashboardMenuItem = DashboardMenuChild & {
  moduleKey?: string
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
    label: 'Master Rumah Sakit',
    key: '/dashboard/pegawai',
    icon: <DashboardOutlined />,
    moduleKey: 'administrator',
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
  },
  {
    label: 'Pendaftaran Rumah Sakit',
    key: '/dashboard/registration',
    icon: <CalendarOutlined />,
    moduleKey: 'registration',
    children: [
      {
        label: 'Pasien',
        key: '/dashboard/patient',
        icon: <UserOutlined />
      },
      {
        label: 'Pendaftaran',
        key: '/dashboard/registration',
        icon: <DashboardOutlined />
      },
      // {
      //   label: 'Antrian',
      //   key: '/dashboard/registration/queue',
      //   icon: <DashboardOutlined />
      // },
      // {
      //   label: 'Pemeriksaan Awal',
      //   key: '/dashboard/registration/triage',
      //   icon: <DashboardOutlined />
      // },
      {
        label: 'Daftar kunjungan',
        key: '/dashboard/registration/active-encounters',
        icon: <UnorderedListOutlined />
      },
      // {
      //   label: 'Data Jaminan',
      //   key: '/dashboard/registration/jaminan',
      //   icon: <DashboardOutlined />
      // },
      // {
      //   label: 'Jadwal Praktek Dokter',
      //   key: '/dashboard/registration/doctor-schedule',
      //   icon: <CalendarOutlined />
      // },
      // {
      //   label: 'Jadwal Libur Dokter',
      //   key: '/dashboard/registration/doctor-leave',
      //   icon: <CalendarOutlined />
      // },
      // {
      //   label: 'Jadwal Praktek Petugas Medis',
      //   key: '/dashboard/registration/medical-staff-schedule',
      //   icon: <CalendarOutlined />
      // },
      // {
      //   label: 'Lap Data Jaminan',
      //   key: '/dashboard/registration/report-insurance',
      //   icon: <DashboardOutlined />
      // },
      // {
      //   label: 'Lap Data Registrasi Pasien',
      //   key: '/dashboard/registration/report-patient',
      //   icon: <DashboardOutlined />
      // },
      // {
      //   label: 'Lap Data Jadwal Praktek',
      //   key: '/dashboard/registration/report-schedule',
      //   icon: <DashboardOutlined />
      // },
      // {
      //   label: 'Lap Data Kunjungan Pasien',
      //   key: '/dashboard/registration/report-visit',
      //   icon: <DashboardOutlined />
      // }
    ]
  },
  {
    label: 'Antrian',
    key: '/dashboard/queue',
    icon: <CalendarOutlined />,
    moduleKey: 'registration',
    children: [
      {
        label: 'Antrian',
        key: '/dashboard/registration/queue',
        icon: <DashboardOutlined />
      }
    ]
  },
  {
    label: 'Obat',
    key: '/dashboard/medicine',
    icon: <WalletOutlined />,
    moduleKey: 'medicine',
    children: [
      { label: 'Dashboard Obat', key: '/dashboard/medicine', icon: <MedicineBoxOutlined /> },
      {
        label: 'Permintaan Obat (Resep)',
        key: '/dashboard/medicine/medication-requests',
        icon: <FileAddOutlined />
      },
      {
        label: 'Penyerahan Obat ',
        key: '/dashboard/medicine/medication-dispenses',
        icon: <MedicineBoxOutlined />
      },
      {
        label: 'Kategori Item',
        key: '/dashboard/medicine/medicine-categories',
        icon: <UnorderedListOutlined />
      },
      { label: 'Kode KFA', key: '/dashboard/medicine/kfa-codes', icon: <UnorderedListOutlined /> },
      { label: 'Obat dan Barang', key: '/dashboard/medicine/items', icon: <ExperimentOutlined /> },
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
    moduleKey: 'laboratory',
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
  // {
  //   label: 'Laboratorium',
  //   key: '/dashboard/laboratory',
  //   icon: <DashboardOutlined />,
  //   children: [
  //     {
  //       label: 'List Lab',
  //       key: '/dashboard/laboratory/list',
  //       icon: <UnorderedListOutlined />
  //     },
  //     {
  //       label: 'Permintaan Lab',
  //       key: '/dashboard/laboratory/permintaan',
  //       icon: <FileAddOutlined />
  //     },
  //     {
  //       label: 'Pemeriksaan Lab',
  //       key: '/dashboard/laboratory/result',
  //       icon: <ExperimentOutlined />
  //     },
  //     {
  //       label: 'Laporan Lab',
  //       key: '/dashboard/laboratory/report',
  //       icon: <FileTextOutlined />
  //     },
  //     {
  //       label: 'Pengambilan Spesimen',
  //       key: '/dashboard/laboratory/specimen',
  //       icon: <MedicineBoxOutlined />
  //     },
  //     {
  //       label: 'Diagnostic Report',
  //       key: '/dashboard/laboratory/diagnostic-report',
  //       icon: <FileSearchOutlined />
  //     }
  //   ]
  // },
  {
    label: 'Perawat',
    key: '/dashboard/nurse-calling',
    icon: <UserOutlined />,
    moduleKey: 'nurse',
    children: [
      {
        label: 'Pemanggilan Pasien',
        key: '/dashboard/nurse-calling',
        icon: <PhoneOutlined />
      }
    ]
  },
  {
    label: 'Dokter',
    key: '/dashboard/doctor',
    icon: <UserOutlined />,
    moduleKey: 'doctor',
    children: [
      {
        label: 'Rekam Medis',
        key: '/dashboard/doctor',
        icon: <FileTextOutlined />
      }
    ]
  },
  {
    label: 'Sistem Antrian',
    key: '/dashboard/queue',
    icon: <UserOutlined />,
    moduleKey: 'queue',
    children: [
      {
        label: 'Antrian Pendaftaran',
        key: '/dashboard/queue/registration',
        icon: <UserOutlined />
      },
      {
        label: 'Antrian Poli',
        key: '/dashboard/queue/poli',
        icon: <UserOutlined />
      },
      {
        label: 'Antrian Laboratorium',
        key: '/dashboard/queue/laboratory',
        icon: <UserOutlined />
      },
      {
        label: 'Monitor Antrian',
        key: '/dashboard/queue/monitor',
        icon: <UserOutlined />
      }
    ]
  }
]

const filterItemsBySelectedModule = (
  menuItems: DashboardMenuItem[],
  selectedModule: string | null
) => {
  if (!selectedModule) return menuItems

  const filteredItems = menuItems.filter(
    (item) => item.key === DASHBOARD_ROOT_KEY || item.moduleKey === selectedModule
  )

  return  filteredItems
}

function Dashboard() {
  const { token } = theme.useToken()
  const location = useLocation()
  const selectedModule = useSelectedModuleStore((state) => state.selectedModule)
  const visibleItems = filterItemsBySelectedModule(items, selectedModule)
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
    '/dashboard/nurse-calling'
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
  }, [location.pathname, selectedModule])

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
