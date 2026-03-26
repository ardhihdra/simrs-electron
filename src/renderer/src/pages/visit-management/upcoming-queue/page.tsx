import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { DatePicker, Form, Select, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

type UpcomingQueueRow = {
  id?: string
  queueId?: string
  formattedQueueNumber?: string
  queueNumber?: number | string
  patientName?: string
  status?: string
  paymentMethod?: string
  noSep?: string
  sepStatus?: string
  queueDate?: string
  poliId?: number | string
  poliName?: string
  poli?: {
    id?: number | string
    name?: string
  }
  serviceUnitName?: string
}

export default function UpcomingQueuePage() {
  const [searchParams, setSearchParams] = useState({
    queueDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    poliId: undefined as string | undefined
  })

  const { data: poliData } = client.visitManagement.poli.useQuery({})
  const {
    data: queueData,
    isLoading,
    isRefetching
  } = client.registration.getQueues.useQuery({
    queueDate: searchParams.queueDate,
    status: ['PRE_RESERVED', 'RESERVED', 'REGISTERED']
  })

  const poliOptions = useMemo(
    () =>
      (poliData?.result || []).map((poli) => ({
        label: poli.name,
        value: String(poli.id)
      })),
    [poliData]
  )

  const filteredData = useMemo(() => {
    const rows = (queueData?.result || []) as UpcomingQueueRow[]
    if (!searchParams.poliId) return rows

    return rows.filter((row) => {
      const rowPoliId = row.poliId ?? row.poli?.id
      return rowPoliId !== undefined && String(rowPoliId) === searchParams.poliId
    })
  }, [queueData, searchParams.poliId])

  const columns: ColumnsType<UpcomingQueueRow> = [
    {
      title: 'No. Antrian',
      key: 'queueNumber',
      width: 140,
      render: (_, record) => record.formattedQueueNumber || record.queueNumber || '-'
    },
    {
      title: 'Pasien',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (value) => value || <span className="text-gray-400 italic">Belum ada pasien</span>
    },
    {
      title: 'Poli / Unit',
      key: 'poli',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-medium">{record.poliName || record.poli?.name || '-'}</span>
          <span className="text-xs text-gray-500">{record.serviceUnitName || '-'}</span>
        </div>
      )
    },
    {
      title: 'Metode Bayar',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => {
        if (!method) return '-'
        const color = method === 'bpjs' ? 'blue' : method === 'cash' ? 'green' : 'default'
        return (
          <Tag color={color} className="uppercase">
            {method}
          </Tag>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap: Record<string, string> = {
          PRE_RESERVED: 'orange',
          RESERVED: 'blue',
          REGISTERED: 'cyan'
        }
        return <Tag color={colorMap[status || ''] ?? 'default'}>{status || '-'}</Tag>
      }
    }
  ]

  const onSearch = (values: { queueDate?: dayjs.Dayjs; poliId?: string }) => {
    setSearchParams({
      queueDate: values.queueDate
        ? dayjs(values.queueDate).format('YYYY-MM-DD')
        : dayjs().add(1, 'day').format('YYYY-MM-DD'),
      poliId: values.poliId
    })
  }

  return (
    <div>
      <TableHeader
        title="Antrian Mendatang"
        subtitle="Daftar antrian yang akan datang berdasarkan tanggal dan poli"
        onSearch={onSearch}
        loading={isLoading || isRefetching}
      >
        <Form.Item
          name="queueDate"
          label="Tanggal"
          style={{ width: '100%' }}
          initialValue={dayjs().add(1, 'day')}
        >
          <DatePicker allowClear={false} size="large" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="poliId" label="Poli" style={{ width: '100%' }}>
          <Select
            allowClear
            showSearch
            placeholder="Semua Poli"
            optionFilterProp="label"
            options={poliOptions}
            size="large"
          />
        </Form.Item>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => String(record.id || record.queueId || record.formattedQueueNumber)}
          loading={isLoading || isRefetching}
        />
      </div>
    </div>
  )
}

