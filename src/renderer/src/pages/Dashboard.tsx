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
  UserAddOutlined,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons'
import logoUrl from '@renderer/assets/logo.png'
import NotificationBell from '@renderer/components/molecules/NotificationBell'
import ProfileMenu from '@renderer/components/molecules/ProfileMenu'

import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { ItemType } from 'antd/es/menu/interface'
import { useEffect, useState } from 'react'
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

const items = [
  {
    label: 'Dashboard',
    key: '/dashboard',
    icon: <DashboardOutlined />
  },
  {
    label: 'Master Rumah Sakit',
    key: '/dashboard/pegawai',
    icon: <DashboardOutlined />,
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
    children: [
      {
        label: 'Pasien',
        key: '/dashboard/patient',
        icon: <UserOutlined />
      },
      {
        label: 'Pendaftaran',
        key: '/dashboard/registration',
        icon: <UserAddOutlined />
      },
      {
        label: 'Daftar Antrian',
        key: '/dashboard/encounter',
        icon: <UserAddOutlined />
      },
      {
        label: 'Confirm Antrian (Pre-Reserved)',
        key: '/dashboard/registration/pre-reserved',
        icon: <UserAddOutlined />
      },
      {
        label: 'Kunjungan Pasien',
        key: '/dashboard/encounter/transition',
        icon: <CalendarOutlined />
      },
      {
        label: 'Triage',
        key: '/dashboard/encounter/triage',
        icon: <MedicineBoxOutlined />
      },
      {
        label: 'Data Jaminan',
        key: '/dashboard/registration/jaminan',
        icon: <DashboardOutlined />
      },
      {
        label: 'Jadwal Praktek Dokter',
        key: '/dashboard/registration/doctor-schedule',
        icon: <CalendarOutlined />
      },
      {
        label: 'Jadwal Libur Dokter',
        key: '/dashboard/registration/doctor-leave',
        icon: <CalendarOutlined />
      },
      {
        label: 'Data Jaminan',
        key: '/dashboard/registration/insurance',
        icon: <CalendarOutlined />
      },
      {
        label: 'Jadwal Praktek Petugas Medis',
        key: '/dashboard/registration/medical-staff-schedule',
        icon: <CalendarOutlined />
      },
      {
        label: 'Lap Data Jaminan',
        key: '/dashboard/registration/report-insurance',
        icon: <DashboardOutlined />
      },
      {
        label: 'Lap Data Registrasi Pasien',
        key: '/dashboard/registration/report-patient',
        icon: <DashboardOutlined />
      },
      {
        label: 'Lap Data Jadwal Praktek',
        key: '/dashboard/registration/report-schedule',
        icon: <DashboardOutlined />
      },
      {
        label: 'Lap Data Kunjungan Pasien',
        key: '/dashboard/registration/report-visit',
        icon: <DashboardOutlined />
      }
    ]
  },
  {
    label: 'Pelayanan Rumah Sakit',
    key: '/dashboard/services',
    icon: <WalletOutlined />,
    children: [
      {
        label: 'Diagnosa',
        key: '/dashboard/diagnostic',
        icon: <DashboardOutlined />
      },
      {
        label: 'Pemeriksaan Utama',
        key: '/dashboard/services/pemeriksaan-utama',
        icon: <WalletOutlined />
      },
      {
        label: 'Pemeriksaan Umum',
        key: '/dashboard/services/general-checkup',
        icon: <WalletOutlined />
      },
      {
        label: 'Pemeriksaan Khusus',
        key: '/dashboard/services/special-checkup',
        icon: <WalletOutlined />
      },
      {
        label: 'Tindakan Medis',
        key: '/dashboard/services/medical-action',
        icon: <WalletOutlined />
      },
      {
        label: 'Resep Obat',
        key: '/dashboard/services/prescription',
        icon: <WalletOutlined />
      }
    ]
  },
  {
    label: 'Obat',
    key: '/dashboard/medicine',
    icon: <WalletOutlined />,
    children: [
      { label: 'Dashboard Obat', key: '/dashboard/medicine', icon: <DashboardOutlined /> },
      {
        label: 'Master Obat - Kategori',
        key: '/dashboard/medicine/medicine-categories',
        icon: <DashboardOutlined />
      },
      {
        label: 'Master Obat - Merek',
        key: '/dashboard/medicine/medicine-brands',
        icon: <DashboardOutlined />
      },
      { label: 'Master Obat', key: '/dashboard/medicine/medicines', icon: <DashboardOutlined /> },
      {
        label: 'Permintaan Obat (Resep)',
        key: '/dashboard/medicine/medication-requests',
        icon: <DashboardOutlined />
      },
      {
        label: 'Penyerahan Obat (Dispensing)',
        key: '/dashboard/medicine/medication-dispenses',
        icon: <DashboardOutlined />
      }
    ]
  },
  {
    label: 'Farmasi',
    key: '/dashboard/farmasi',
    icon: <WalletOutlined />,
    children: [
      { label: 'Dashboard Farmasi', key: '/dashboard/farmasi', icon: <DashboardOutlined /> },
      { label: 'Bahan Baku', key: '/dashboard/farmasi/raw-materials', icon: <DashboardOutlined /> },
      {
        label: 'Kategori Bahan Baku',
        key: '/dashboard/farmasi/raw-material-categories',
        icon: <DashboardOutlined />
      },
      { label: 'Pemasok', key: '/dashboard/farmasi/suppliers', icon: <DashboardOutlined /> },
      {
        label: 'Formula Produksi',
        key: '/dashboard/farmasi/formulas',
        icon: <DashboardOutlined />
      },
      {
        label: 'Permintaan Produksi',
        key: '/dashboard/farmasi/production-requests',
        icon: <DashboardOutlined />
      },
      { label: 'Item', key: '/dashboard/farmasi/items', icon: <DashboardOutlined /> }
    ]
  },
  {
    label: 'Laboratorium',
    key: '/dashboard/laboratory',
    icon: <DashboardOutlined />,
    children: [
      {
        label: 'List Lab',
        key: '/dashboard/laboratory/list',
        icon: <UnorderedListOutlined />
      },
      {
        label: 'Permintaan Lab',
        key: '/dashboard/laboratory/permintaan',
        icon: <FileAddOutlined />
      },
      {
        label: 'Pemeriksaan Lab',
        key: '/dashboard/laboratory/result',
        icon: <ExperimentOutlined />
      },
      {
        label: 'Laporan Lab',
        key: '/dashboard/laboratory/report',
        icon: <FileTextOutlined />
      },
      {
        label: 'Pengambilan Spesimen',
        key: '/dashboard/laboratory/specimen',
        icon: <MedicineBoxOutlined />
      },
      {
        label: 'Diagnostic Report',
        key: '/dashboard/laboratory/diagnostic-report',
        icon: <FileSearchOutlined />
      }
    ]
  },
  {
    label: 'Perawat',
    key: '/dashboard/nurse-calling',
    icon: <UserOutlined />,
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

function Dashboard() {
  const location = useLocation()
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
    '/dashboard/medicine',
    '/dashboard/farmasi',
    '/dashboard/registration/doctor-leave',
    '/dashboard/nurse-calling',
    '/dashboard/doctor'
  ]
  const isRegisteredPath = (path: string): boolean => {
    if (path === '/dashboard') return true
    return registeredPrefixes.some((prefix) => path.startsWith(prefix))
  }
  const findLabelByPath = (path: string): string => {
    const top = items.find((i) => path.startsWith(i.key))
    if (top && path === top.key) return top.label
    for (const i of items) {
      const child = (i.children || []).find((c) => path.startsWith(c.key))
      if (child) return child.label
    }
    return top ? top.label : path
  }
  const getTopKeyFromPath = (path: string): string => {
    if (path.startsWith('/dashboard/doctor')) return '/dashboard/doctor'
    for (const top of items) {
      const children = Array.isArray(top.children) ? top.children : []
      const match = children.find((c) => path.startsWith(c.key))
      if (match) return top.key
    }
    const sorted = [...items].sort((a, b) => b.key.length - a.key.length)
    const found = sorted.find((item) => path.startsWith(item.key))
    return found?.key || items[0].key
  }
  const initialTop = getTopKeyFromPath(location.pathname)
  const [activeTop, setActiveTop] = useState<string>(initialTop)
  const childrenOfTop = (key: string) => {
    const top = items.find((i) => i.key === key)
    if (!top) return [] as ItemType[]
    if (Array.isArray(top.children) && top.children.length > 0) {
      return top.children.map((c) => ({ label: c.label, key: c.key, icon: c.icon })) as ItemType[]
    }
    return [{ label: top.label, key: top.key, icon: top.icon } as ItemType]
  }
  const childKeysOfTop = (key: string): string[] => {
    const top = items.find((i) => i.key === key)
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
  const topItems = items.map((i) => ({ label: i.label, key: i.key, icon: i.icon })) as ItemType[]
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
  }, [location.pathname])
  return (
    <div className="min-h-screen flex overflow-hidden">
      <aside
        className={`${collapsed ? 'w-20' : 'w-64'} bg-white dark:bg-[#141414] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300`}
      >
        <div className="h-14 px-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center gap-2">
            <img src={logoUrl} alt="Logo" className="w-8 h-8" />
            <span className={`${collapsed ? 'hidden' : 'font-semibold text-lg dark:text-white'}`}>
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
          className="dark:bg-[#141414]"
          style={{ borderInlineEnd: 0 }}
        />
        <div className="mt-auto px-4 py-3 flex justify-center">
          <button
            aria-label="Toggle sidebar"
            className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 shadow transition-colors"
            onClick={() => setCollapsed((p) => !p)}
          >
            {collapsed ? <RightCircleFilled /> : <LeftCircleFilled />}
          </button>
        </div>
      </aside>
      <div
        className={`flex-1 transition-all duration-300 flex flex-col ${collapsed ? 'max-w-[calc(100vw-5rem)]' : 'max-w-[calc(100vw-16rem)]'}`}
      >
        <header className="sticky top-0 z-50 bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 h-14 px-4 flex items-center justify-between gap-4 transition-colors">
          <Menu
            mode="horizontal"
            onClick={onTopClick}
            selectedKeys={[activeTop]}
            items={topItems}
            className="dark:bg-[#141414] border-none"
            style={{ minWidth: 0, flex: 'auto' }}
          />
          {/* <SendNotificationButton /> */}
          <NotificationBell />
          <ProfileMenu />
        </header>
        <div className="p-4 flex-1 bg-gray-50 dark:bg-[#000000]">
          {isRegisteredPath(location.pathname) ? (
            <Outlet />
          ) : (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
              <div className="text-base md:text-lg font-medium dark:text-gray-200">
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
