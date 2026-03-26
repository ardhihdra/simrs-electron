import { Layout, Menu, theme, Input, Empty, Typography, Tag } from 'antd'
import { useState, useMemo } from 'react'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  SendOutlined,
  HomeOutlined,
  AlertOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileProtectOutlined,
  CheckSquareOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons'
import { PengajuanOKForm } from '../../components/organisms/OK/PengajuanOKForm'
import { DetailPengajuanForm } from '../../components/organisms/OK/DetailPengajuanForm'
import { VerifikasiOKTable } from '../../components/organisms/OK/VerifikasiOKTable'
import { ChecklistPreOpForm } from '../../components/organisms/OK/ChecklistPreOpForm'
import { SignInForm, TimeOutForm, SignOutForm } from '../../components/organisms/OK/WHOChecklist'
import {
  ChecklistPostOpForm,
  AdministrasiOKForm,
  TagihanOKView
} from '../../components/organisms/OK/PostOpForms'

interface OKWorkspaceProps {
  encounterId?: string
  patientData?: any
  defaultView?: 'pengajuan' | 'admin'
}

export const OKWorkspace = ({
  encounterId = '',
  patientData = {},
  defaultView = 'pengajuan'
}: OKWorkspaceProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState(
    defaultView === 'admin' ? 'verifikasi-ok' : 'pengajuan-rajal'
  )
  const [searchText, setSearchText] = useState('')
  const { token } = theme.useToken()

  const items = useMemo(
    () => [
      {
        key: 'group-pengajuan',
        label: (
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: token.colorTextSecondary }}
          >
            Fase 1 — Pengajuan OK
          </span>
        ),
        type: 'group' as const,
        children: [
          { key: 'pengajuan-rajal', icon: <SendOutlined />, label: 'Pengajuan RAJAL' },
          { key: 'pengajuan-ranap', icon: <HomeOutlined />, label: 'Pengajuan RANAP' },
          {
            key: 'pengajuan-igd',
            icon: <AlertOutlined style={{ color: token.colorError }} />,
            label: (
              <span>
                Pengajuan IGD{' '}
                <Tag color="red" className="ml-1 text-[10px]">
                  CYTO
                </Tag>
              </span>
            )
          }
        ]
      },
      {
        key: 'group-detail',
        label: (
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: token.colorTextSecondary }}
          >
            Fase 2 — Detail Pengajuan
          </span>
        ),
        type: 'group' as const,
        children: [
          { key: 'jadwal-tim', icon: <CalendarOutlined />, label: 'Jadwal & Tim Operasi' },
          { key: 'jenis-tindakan', icon: <DollarOutlined />, label: 'Jenis Tindakan & Tarif' },
          { key: 'penandaan-consent', icon: <FileProtectOutlined />, label: 'Penandaan & Consent' }
        ]
      },
      {
        key: 'group-verifikasi',
        label: (
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: token.colorTextSecondary }}
          >
            Fase 3 — Verifikasi (Admin OK)
          </span>
        ),
        type: 'group' as const,
        children: [
          { key: 'verifikasi-ok', icon: <CheckSquareOutlined />, label: 'Antrian & Verifikasi OK' },
          { key: 'checklist-preop', icon: <CheckSquareOutlined />, label: 'Checklist Pre-Operasi' },
          {
            key: 'penilaian-preop',
            icon: <MedicineBoxOutlined />,
            label: 'Penilaian Pre-Op & Anestesi'
          }
        ]
      },
      {
        key: 'group-intraop',
        label: (
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: token.colorTextSecondary }}
          >
            Fase 4 — Intraoperasi (WHO Checklist)
          </span>
        ),
        type: 'group' as const,
        children: [
          {
            key: 'sign-in',
            icon: <SafetyCertificateOutlined />,
            label: 'Sign-In (Sebelum Anestesi)'
          },
          {
            key: 'time-out',
            icon: <SafetyCertificateOutlined />,
            label: 'Time-Out (Sebelum Insisi)'
          },
          { key: 'sign-out', icon: <SafetyCertificateOutlined />, label: 'Sign-Out & Tim Operasi' }
        ]
      },
      {
        key: 'group-postop',
        label: (
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: token.colorTextSecondary }}
          >
            Fase 5 — Post Operasi
          </span>
        ),
        type: 'group' as const,
        children: [
          {
            key: 'checklist-postop',
            icon: <CheckCircleOutlined />,
            label: 'Checklist Post-Operasi'
          },
          { key: 'administrasi', icon: <FileTextOutlined />, label: 'Administrasi' },
          { key: 'tagihan', icon: <DollarOutlined />, label: 'Tagihan Operasi' }
        ]
      }
    ],
    [token]
  )

  // Daftar semua leaf items untuk search
  const allLeafItems = useMemo(() => {
    return items.flatMap((group) =>
      (group.children || []).map((child) => ({ ...child, groupKey: group.key }))
    )
  }, [items])

  const filteredItems = useMemo(() => {
    if (!searchText) return items
    const lower = searchText.toLowerCase()
    return items
      .map((group) => {
        const matchingChildren = (group.children || []).filter((child) => {
          const labelStr =
            typeof child.label === 'string' ? child.label : child.key.replace(/-/g, ' ')
          return labelStr.toLowerCase().includes(lower)
        })
        return matchingChildren.length > 0 ? { ...group, children: matchingChildren } : null
      })
      .filter(Boolean) as typeof items
  }, [items, searchText])

  const renderContent = () => {
    switch (selectedKey) {
      case 'pengajuan-rajal':
        return <PengajuanOKForm type="rajal" encounterId={encounterId} patientData={patientData} />
      case 'pengajuan-ranap':
        return <PengajuanOKForm type="ranap" encounterId={encounterId} patientData={patientData} />
      case 'pengajuan-igd':
        return <PengajuanOKForm type="igd" encounterId={encounterId} patientData={patientData} />
      case 'jadwal-tim':
      case 'jenis-tindakan':
      case 'penandaan-consent':
        return <DetailPengajuanForm encounterId={encounterId} patientData={patientData} />
      case 'verifikasi-ok':
        return <VerifikasiOKTable />
      case 'checklist-preop':
      case 'penilaian-preop':
        return <ChecklistPreOpForm />
      case 'sign-in':
        return <SignInForm />
      case 'time-out':
        return <TimeOutForm />
      case 'sign-out':
        return <SignOutForm />
      case 'checklist-postop':
        return <ChecklistPostOpForm />
      case 'administrasi':
        return <AdministrasiOKForm />
      case 'tagihan':
        return <TagihanOKView />
      default:
        return <Empty description="Pilih menu di sebelah kiri untuk mulai mengisi form" />
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Layout
        className="rounded-lg overflow-hidden flex-1"
        style={{ border: `1px solid ${token.colorBorderSecondary}` }}
      >
        <Layout.Sider
          width={270}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="light"
          trigger={
            <div className="flex items-center justify-center h-12 cursor-pointer transition-colors">
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          }
        >
          <div className="h-full flex flex-col">
            {/* Header sidebar */}
            <div
              className={`p-4 ${collapsed ? 'text-center' : ''}`}
              style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
            >
              {collapsed ? (
                <SearchOutlined
                  style={{ fontSize: 18, color: token.colorPrimary, cursor: 'pointer' }}
                />
              ) : (
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded"
                    style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                  >
                    <SafetyCertificateOutlined className="text-white text-sm" />
                  </div>
                  <span style={{ color: token.colorText }}>Kamar Operasi (OK)</span>
                </div>
              )}
            </div>

            <div className="flex flex-col flex-1 overflow-hidden mt-2">
              {!collapsed && (
                <div
                  className="px-4 pb-2"
                  style={{
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    paddingBottom: 10
                  }}
                >
                  <Input.Search
                    placeholder="Cari menu / form..."
                    allowClear
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              <div className="flex-1 overflow-y-auto pb-4">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 mt-10">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Form tidak ditemukan"
                    />
                  </div>
                ) : (
                  <Menu
                    className="custom-menu"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    style={{ borderRight: 0 }}
                    items={filteredItems}
                    onSelect={({ key }) => setSelectedKey(key)}
                  />
                )}
              </div>
            </div>
          </div>
        </Layout.Sider>

        <Layout>
          <Layout.Content className="p-6 overflow-y-auto h-full">{renderContent()}</Layout.Content>
        </Layout>
      </Layout>
    </div>
  )
}
