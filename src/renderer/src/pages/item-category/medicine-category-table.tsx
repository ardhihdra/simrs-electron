import { Button, Dropdown, Input, Switch, Table, Card, Spin, theme } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  SearchOutlined
} from '@ant-design/icons'

interface MedicineCategoryAttributes {
  id?: number
  name: string
  status?: boolean
  categoryType?: string | null
}

const columns = [
  { title: 'Nama', dataIndex: 'name', key: 'name' },
  { title: 'Tipe Kategori', dataIndex: 'categoryType', key: 'categoryType' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (value: boolean) => <Switch checked={Boolean(value)} disabled />
  },
  {
    title: 'Action',
    key: 'action',
    width: 80,
    align: 'center' as const,
    render: (_: MedicineCategoryAttributes, record: MedicineCategoryAttributes) => (
      <RowActions record={record} />
    )
  }
]

function RowActions({ record }: { record: MedicineCategoryAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['medicineCategory', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.medicineCategory?.deleteById
      if (!fn) throw new Error('API kategori item tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineCategory', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () =>
        typeof record.id === 'number' &&
        navigate(`/dashboard/medicine/medicine-categories/edit/${record.id}`)
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => typeof record.id === 'number' && deleteMutation.mutate(record.id)
    }
  ]
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        aria-label="Actions"
        className="p-1 rounded text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export function MedicineCategoryTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError, isLoading } = useQuery({
    queryKey: ['medicineCategory', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.medicineCategory?.list
      if (!fn) throw new Error('API kategori item tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: MedicineCategoryAttributes[] =
      (data?.result as MedicineCategoryAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => p.name.toLowerCase().includes(q))
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
                  <AppstoreOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">Kategori Item</h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen data jenis kategori beserta detailnya
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
                onClick={() => navigate('/dashboard/medicine/medicine-categories/create')}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Tambah
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
                <AppstoreOutlined style={{ color: '#fff', fontSize: 16 }} />
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
              placeholder="Cari kategori..."
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
                Gagal memuat data kategori item.
              </div>
            )}
            <Table
              dataSource={filtered}
              columns={columns}
              size="middle"
              className="flex-1 h-full"
              rowKey="id"
              scroll={{ x: 800, y: 'calc(100vh - 460px)' }}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} data`,
                showSizeChanger: true
              }}
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}

export default MedicineCategoryTable
