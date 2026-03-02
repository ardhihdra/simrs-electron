import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import { Button, Dropdown, Input, Table } from 'antd'
import type { MenuProps } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

interface KfaCodeAttributes {
  id?: number
  code: number
  display: string
}

const columns = [
  { title: 'Kode', dataIndex: 'code', key: 'code' },
  { title: 'Nama', dataIndex: 'display', key: 'display' },
  {
    title: 'Action',
    key: 'action',
    width: 80,
    align: 'center' as const,
    render: (_: KfaCodeAttributes, record: KfaCodeAttributes) => <RowActions record={record} />
  }
]

function RowActions({ record }: { record: KfaCodeAttributes }) {
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
      onClick: async () => {
        if (typeof record.id !== 'number') return
        const fn = window.api?.query?.kfaCode?.deleteById
        if (!fn) throw new Error('API KFA Code tidak tersedia.')
        await fn({ id: record.id })
        window.location.reload()
      }
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

export function KfaCodeTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isError } = useQuery({
    queryKey: ['kfaCode', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.kfaCode?.list
      if (!fn) throw new Error('API KFA Code tidak tersedia.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: KfaCodeAttributes[] = (data?.result as KfaCodeAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => p.display.toLowerCase().includes(q) || String(p.code).includes(q))
  }, [data?.result, search])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Kode KFA</h2>
      {isError && <div className="text-red-500">Gagal memuat data KFA. Pastikan Anda sudah login.</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Cari"
          className="w-full md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => window.location.reload()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/medicine/kfa-codes/create')}>
            Tambah
          </Button>
        </div>
      </div>
      <Table
        dataSource={filtered}
        columns={columns}
        size="small"
        className="mt-4 rounded-xl shadow-sm"
        rowKey="id"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default KfaCodeTable
