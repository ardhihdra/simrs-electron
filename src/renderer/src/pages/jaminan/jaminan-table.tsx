import { Button, Dropdown, Input, Tag, Card, theme, Table } from 'antd'
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
  SearchOutlined,
  TagsOutlined,
  WalletOutlined
} from '@ant-design/icons'

interface JaminanAttributes {
  id?: number
  nama: string
  kode: string
  keterangan?: string
  status: 'active' | 'inactive'
}

const baseColumns = [
  {
    title: 'Kode',
    dataIndex: 'kode',
    key: 'kode',
    width: 120
  },
  {
    title: 'Nama Jaminan',
    dataIndex: 'nama',
    key: 'nama'
  },
  {
    title: 'Keterangan',
    dataIndex: 'keterangan',
    key: 'keterangan',
    render: (value: string) => value || '-'
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (value: string) => (
      <Tag color={value === 'active' ? 'green' : 'red'}>
        {value === 'active' ? 'Aktif' : 'Tidak Aktif'}
      </Tag>
    )
  }
]

function RowActions({ record }: { record: JaminanAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['jaminan', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.jaminan?.deleteById
      if (!fn) throw new Error('API jaminan tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jaminan', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          navigate(`/dashboard/registration/jaminan/edit/${record.id}`)
        }
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') deleteMutation.mutate(record.id)
      }
    }
  ]
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button aria-label="Actions" className="p-1 rounded hover:bg-gray-100">
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export function JaminanTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError } = useQuery({
    queryKey: ['jaminan', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.jaminan?.list
      if (!fn) throw new Error('API jaminan tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: JaminanAttributes[] = (data?.result as JaminanAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => {
      const hay = [p.nama, p.kode, p.keterangan].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [data?.result, search])

  return (
    <div className="flex flex-col gap-4 h-full">
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
                  <WalletOutlined
                    className="text-base"
                    style={{ color: token.colorSuccessBg, fontSize: 16 }}
                  />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">Master Jaminan</h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen data jaminan pasien dan asuransi
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                className="border-white/30 text-white hover:border-white hover:text-white"
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
                type="default"
                onClick={async () => {
                  try {
                    const res = await window.api.query.export.exportCsv({
                      entity: 'jaminan',
                      usePagination: false
                    })
                    if (
                      res &&
                      typeof res === 'object' &&
                      'success' in res &&
                      res.success &&
                      'url' in res &&
                      res.url
                    ) {
                      window.open(res.url as string, '_blank')
                    }
                  } catch (e) {
                    console.error(e instanceof Error ? e.message : String(e))
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                Export CSV
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/registration/jaminan/create')}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Tambah Jaminan
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
                <WalletOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {filtered.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Jaminan
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorSuccess}33` }}
              >
                <TagsOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {filtered.filter((j) => j.status === 'active').length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Jaminan Aktif
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

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
              placeholder="Nama Jaminan / Kode"
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
        </div>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <div className="flex-1" style={{ background: token.colorBgContainer }}>
          {isError ||
            (!data?.success && (
              <div style={{ color: token.colorErrorText }} className="p-4">
                {data?.message}
              </div>
            ))}
          <Table
            columns={[
              ...baseColumns,
              {
                title: 'Aksi',
                key: 'action',
                width: 80,
                align: 'center',
                fixed: 'right',
                render: (_, record) => <RowActions record={record} />
              }
            ]}
            dataSource={filtered}
            rowKey={(r) => String(r.id ?? `${r.kode}-${r.nama}`)}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} jaminan`,
              showSizeChanger: true
            }}
            scroll={{ x: 800, y: 'calc(100vh - 460px)' }}
            className="flex-1 h-full"
            size="middle"
          />
        </div>
      </Card>
    </div>
  )
}

export default JaminanTable
