import GenericTable from '@renderer/components/organisms/GenericTable'
import {
  QueueItem,
  useActiveQueues,
  useConfirmAttendance
} from '@renderer/hooks/query/use-visit-management'
import { Button, Input, Tag } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

interface QueueListProps {
  title: string
  serviceType?: string
}

export default function QueueList({ title, serviceType }: QueueListProps) {
  // Use new hook
  const { data, isLoading } = useActiveQueues()
  const { mutate: confirmAttendance } = useConfirmAttendance()
  const [search, setSearch] = useState('')

  const filteredData = useMemo(() => {
    // Data filtering logic
    const source: QueueItem[] = Array.isArray(data?.data) ? data.data : []
    if (!source.length) return []
    const today = dayjs().startOf('day')

    return source.filter((item) => {
      // Filter by date (today)
      const isToday = dayjs(item.queueDate).isSame(today, 'day')
      if (!isToday) return false

      // Filter by service type if provided (checking against poli or service unit name)
      if (serviceType) {
        const type = (item.poli?.name || item.serviceUnit?.name || '').toLowerCase()
        const target = serviceType.toLowerCase()
        if (!type.includes(target)) return false
      }

      // Search filter
      if (search) {
        const q = search.toLowerCase()
        return (
          item.patient?.name?.toLowerCase().includes(q) ||
          item.formattedQueueNumber.toLowerCase().includes(q)
        )
      }

      return true
    })
  }, [data, serviceType, search])

  const columns = [
    {
      title: 'Nomor Antrian',
      dataIndex: 'formattedQueueNumber',
      key: 'formattedQueueNumber',
      width: 150,
      render: (v: string) => <span className="font-bold text-lg">{v}</span>
    },
    {
      title: 'Waktu',
      dataIndex: 'queueDate',
      key: 'queueDate',
      render: (v: string) => dayjs(v).format('DD MMM YYYY'), // Queue usually doesn't have time, just date
      width: 120
    },
    {
      title: 'Nama Pasien',
      dataIndex: ['patient', 'name'],
      key: 'patientName'
    },
    {
      title: 'Poli / Unit',
      key: 'poli',
      render: (_, record: QueueItem) => (
        <span>{record.poli?.name || record.serviceUnit?.name || '-'}</span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        let color = 'blue'
        if (status === 'IN_PROGRESS') color = 'green'
        if (status === 'CALLED') color = 'orange'
        if (status === 'RESERVED') color = 'default'

        return <Tag color={color}>{String(status ?? '').replace('_', ' ')}</Tag>
      }
    }
  ]

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">{title}</h2>
        <Input.Search
          placeholder="Cari pasien / no antrian..."
          className="max-w-xs"
          onSearch={setSearch}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-lg shadow border border-gray-200 dark:border-gray-800">
        <GenericTable<QueueItem>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          tableProps={{ loading: isLoading }}
          action={{
            title: 'Action',
            width: 100,
            align: 'center',
            render: (record) => {
              if (record.status === 'PRE_RESERVED') {
                return (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      confirmAttendance({ queueId: record.id, patientId: record.patientId })
                    }}
                  >
                    Confirm
                  </Button>
                )
              }
              return (
                <Button
                  size="small"
                  onClick={() => {
                    // TODO: Navigate to where? Maybe queue detail or encounter start?
                    // For now, keep it simple or remove if generic action not needed
                    console.log('Action for', record.id)
                  }}
                >
                  Detail
                </Button>
              )
            }
          }}
        />
      </div>
    </div>
  )
}
