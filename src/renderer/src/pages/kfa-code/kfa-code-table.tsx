import {
  BarcodeOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { Button, Dropdown, Input, Table, Card, Spin, theme, message, Modal } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

interface KfaCodeAttributes {
  id?: number
  code: number
  display: string
}

function RowActions({ record, onRefresh }: { record: KfaCodeAttributes; onRefresh?: () => void }) {
  const navigate = useNavigate()
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () =>
        typeof record.id === 'number' && navigate(`/dashboard/medicine/kfa-codes/edit/${record.id}`)
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => {
        Modal.confirm({
          title: 'Hapus Kode KFA',
          content: 'Apakah Anda yakin ingin menghapus data ini?',
          okText: 'Ya, Hapus',
          okType: 'danger',
          cancelText: 'Batal',
          onOk: async () => {
            try {
              if (typeof record.id !== 'number') return
              const fn = window.api?.query?.kfaCode?.deleteById
              if (!fn) throw new Error('API KFA Code tidak tersedia.')
              await fn({ id: record.id })
              message.success('Kode KFA berhasil dihapus')
              if (onRefresh) onRefresh()
              else window.location.reload()
            } catch (err: any) {
              message.error(`Gagal menghapus: ${err?.message || 'Unknown error'}`)
            }
          }
        })
      }
    }
  ]
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        type="button"
        aria-label="Actions"
        className="p-1 rounded bg-transparent border-none cursor-pointer text-gray-700 hover:bg-gray-100"
      >
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export function KfaCodeTable() {
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const [search, setSearch] = useState('')

  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ['kfaCode', 'list'],
    queryFn: async () => {
      const fn = window.api?.query?.kfaCode?.list
      if (!fn) throw new Error('API KFA Code tidak tersedia.')
      return await fn()
    }
  })

  // We should define columns here
  const columns: ColumnsType<KfaCodeAttributes> = [
    { title: 'Kode KFA', dataIndex: 'code', key: 'code', width: 200 },
    { title: 'Nama / Display', dataIndex: 'display', key: 'display' },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_: unknown, record: KfaCodeAttributes) => (
        <RowActions record={record} onRefresh={refetch} />
      )
    }
  ]

  const filtered = useMemo(() => {
    const source: KfaCodeAttributes[] = (data?.result as KfaCodeAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => p.display.toLowerCase().includes(q) || String(p.code).includes(q))
  }, [data?.result, search])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 1. Header Card */}
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <BarcodeOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Data Master Kode KFA
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen data referensi Kamus Farmasi dan Alat Kesehatan (KFA)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                Refresh
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/medicine/kfa-codes/create')}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Tambah Kode KFA
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <BarcodeOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {filtered.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Data
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Search Filter Card */}
      <Card styles={{ body: { padding: '16px 20px' } }} variant="borderless">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Pencarian
            </div>
            <Input
              placeholder="Cari kode KFA atau nama..."
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
        </div>
      </Card>

      {/* 3. Main Data Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading}>
          <div className="flex-1" style={{ background: token.colorBgContainer }}>
            {isError && (
              <div style={{ color: token.colorErrorText }} className="p-4">
                Gagal memuat data KFA. Pastikan Anda sudah login dan terhubung ke server.
              </div>
            )}
            <Table
              columns={columns}
              dataSource={filtered}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} data`,
                showSizeChanger: true
              }}
              scroll={{ x: 800, y: 'calc(100vh - 460px)' }}
              className="flex-1 h-full"
              size="middle"
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}

export default KfaCodeTable
