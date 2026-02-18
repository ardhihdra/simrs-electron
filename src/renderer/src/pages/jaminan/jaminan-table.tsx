import { Button, Dropdown, Input, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'

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
    <div>
      <h2 className="text-2xl font-bold mb-4">Master Jaminan</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Search"
          className="w-full md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button
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
          >
            Export CSV
          </Button>
          <Button type="primary" onClick={() => navigate('/dashboard/registration/jaminan/create')}>
            Tambah Jaminan
          </Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.message}</div>)}
      <GenericTable<JaminanAttributes>
        columns={baseColumns}
        dataSource={filtered}
        rowKey={(r) => String(r.id ?? `${r.kode}-${r.nama}`)}
        action={{
          title: 'Action',
          width: 80,
          align: 'center',
          fixedRight: true,
          render: (record) => <RowActions record={record} />
        }}
        tableProps={{ size: 'small', className: 'mt-4 rounded-xl ', scroll: { x: 'max-content' } }}
      />
    </div>
  )
}

export default JaminanTable
