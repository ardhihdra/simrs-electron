import { Button, Dropdown, Input, Tag } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import type { DiagnosticReportAttributes } from '@shared/diagnostic'
import  { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/GenericTable'

const baseColumns = [
  { title: 'Code', dataIndex: 'code', key: 'code' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      let color = 'default'
      if (status === 'final') color = 'green'
      if (status === 'preliminary') color = 'orange'
      if (status === 'cancelled') color = 'red'
      return <Tag color={color}>{status}</Tag>
    }
  },
  {
    title: 'Effective Date',
    dataIndex: 'effectiveDateTime',
    key: 'effectiveDateTime',
    render: (value: string) =>
      value
        ? new Date(value).toLocaleDateString() + ' ' + new Date(value).toLocaleTimeString()
        : '-'
  },
  { title: 'Conclusiom', dataIndex: 'conclusion', key: 'conclusion', ellipsis: true },
]

function RowActions({ record }: { record: DiagnosticReportAttributes }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['diagnostic', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.diagnostic?.deleteById
      if (!fn)
        throw new Error('API diagnostic tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          navigate(`/dashboard/diagnostic/edit/${record.id}`)
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

export function DiagnosticTable() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, refetch, isError } = useQuery({
    queryKey: ['diagnostic', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.diagnostic?.list
      if (!fn)
        throw new Error('API diagnostic tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: DiagnosticReportAttributes[] = (data?.data as DiagnosticReportAttributes[]) || []
    const q = search.trim().toLowerCase()
    if (!q) return source
    return source.filter((p) => {
      const hay = [p.code, p.conclusion, p.status].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [data?.data, search])
  console.log(filtered)
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Diagnostic Reports</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Input
          type="text"
          placeholder="Search Code / Status / Conclusion"
          className="w-full md:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap md:justify-end">
          <Button onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" onClick={() => navigate('/dashboard/diagnostic/create')}>
            Add Diagnostic
          </Button>
        </div>
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
      <GenericTable<DiagnosticReportAttributes>
        columns={baseColumns}
        dataSource={filtered}
        rowKey={(r) => String(r.id ?? `${r.code}-${r.status}`)}
        action={{
          title: 'Action',
          width: 80,
          align: 'center',
          fixedRight: true,
          render: (record) => <RowActions record={record} />
        }}
        tableProps={{ size: 'small', className: 'mt-4 rounded-xl shadow-sm', scroll: { x: 'max-content' } }}
      />
    </div>
  )
}

export default DiagnosticTable
