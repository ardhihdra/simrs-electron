import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { ItemType } from 'antd/es/menu/interface'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import ProfileMenu from '@renderer/components/ProfileMenu'
import logoUrl from '@renderer/assets/logo.png'
import {
  CalendarOutlined,
  DashboardOutlined,
  LeftCircleFilled,
  RightCircleFilled,
  UserOutlined,
  WalletOutlined
} from '@ant-design/icons'

const items = [
  {
    label: 'Dashboard',
    key: '/dashboard',
    icon: <DashboardOutlined />
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
        label: 'Kunjungan Pasien',
        key: '/dashboard/encounter',
        icon: <CalendarOutlined />
      },
      {
        label: 'Data Jaminan',
        key: '/dashboard/registration/insurance',
        icon: <CalendarOutlined />
      },
      {
        label: 'Jadwal Praktek Dokter',
        key: '/dashboard/registration/doctor-schedule',
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
    label: 'Laboratorium',
    key: '/dashboard/laboratory',
    icon: <DashboardOutlined />,
    children: [
      {
        label: 'Pemeriksaan Lab',
        key: '/dashboard/laboratory/exam',
        icon: <DashboardOutlined />
      },
      {
        label: 'Hasil Lab',
        key: '/dashboard/laboratory/result',
        icon: <DashboardOutlined />
      },
      {
        label: 'Laporan Lab',
        key: '/dashboard/laboratory/report',
        icon: <DashboardOutlined />
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
    '/dashboard/queue',
    '/dashboard/diagnostic',
    '/dashboard/services'
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
    setActiveSide(
      childKeys.includes(location.pathname) ? location.pathname : (children[0]?.key as string)
    )
  }, [location.pathname])
  return (
    <div className="min-h-screen flex">
      <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white shadow-sm flex flex-col`}>
        <div className="h-14 px-4 flex items-center shadow-sm justify-center">
          <div className="flex items-center justify-center gap-2">
            <img src={logoUrl} alt="Logo" className="w-8 h-8" />
            <span className={`${collapsed ? 'hidden' : 'font-semibold text-lg'}`}>SIMRS</span>
          </div>
        </div>
        <Menu
          onClick={onSideClick}
          selectedKeys={[activeSide]}
          mode="inline"
          inlineCollapsed={collapsed}
          items={sideItems}
          className=""
        />
        <div className="mt-auto px-4 py-3 flex justify-center">
          <button
            aria-label="Toggle sidebar"
            className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 shadow"
            onClick={() => setCollapsed((p) => !p)}
          >
            {collapsed ? <RightCircleFilled /> : <LeftCircleFilled />}
          </button>
        </div>
      </aside>
      <div className="flex-1">
        <header className="sticky top-0 z-50 bg-white shadow-sm h-14 px-4 flex items-center justify-between gap-4">
          <Menu
            mode="horizontal"
            onClick={onTopClick}
            selectedKeys={[activeTop]}
            items={topItems}
            className="flex-1"
          />
          <ProfileMenu />
        </header>
        <div className="p-4">
          {isRegisteredPath(location.pathname) ? (
            <Outlet />
          ) : (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
              <div className="text-base md:text-lg font-medium">
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
