import { Button, Input, Tag } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { useEncounterList } from '@renderer/hooks/query/use-encounter'
import { EncounterRow } from '@shared/encounter'

interface QueueListProps {
  title: string
  serviceType?: string
}

export default function QueueList({ title, serviceType }: QueueListProps) {
  const navigate = useNavigate()
  const { data, isLoading } = useEncounterList()
  const [search, setSearch] = useState('')

  const filteredData = useMemo(() => {
    const source: EncounterRow[] = Array.isArray(data?.data) ? data.data : []
    if (!source.length) return []
    const today = dayjs().startOf('day')

    return source.filter((item) => {
      // Filter by date (today) - Antrian biasanya per hari ini
      const isToday = dayjs(item.visitDate).isSame(today, 'day')
      if (!isToday) return false

      // Filter by service type if provided
      if (serviceType) {
        // Flexible matching: contains or equals
        const type = (item.serviceType || '').toLowerCase()
        const target = serviceType.toLowerCase()
        if (!type.includes(target)) return false
      }

      // Search filter
      if (search) {
        const q = search.toLowerCase()
        return (
          item.patient?.name?.toLowerCase().includes(q) ||
          String(item.id ?? '')
            .toLowerCase()
            .includes(q)
        )
      }

      return true
    })
  }, [data, serviceType, search])

  const columns = [
    {
      title: 'Kode',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (v: EncounterRow['id']) => (v ? String(v) : '-')
    },
    {
      title: 'Waktu',
      dataIndex: 'visitDate',
      key: 'visitDate',
      render: (v: EncounterRow['visitDate']) => dayjs(v).format('HH:mm'),
      width: 100
    },
    { title: 'Nama Pasien', dataIndex: ['patient', 'name'], key: 'patientName' },
    {
      title: 'Layanan',
      dataIndex: 'serviceType',
      key: 'serviceType',
      render: (v: EncounterRow['serviceType']) => <span className="capitalize">{v}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: EncounterRow['status']) => (
        <Tag color={status === 'finished' ? 'green' : status === 'cancelled' ? 'red' : 'blue'}>
          {String(status ?? '').toUpperCase()}
        </Tag>
      )
    }
  ]

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold dark:text-white">{title}</h2>
        <Input.Search
          placeholder="Cari pasien..."
          className="max-w-xs"
          onSearch={setSearch}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-lg shadow border border-gray-200 dark:border-gray-800">
        <GenericTable<EncounterRow>
          columns={columns}
          dataSource={filteredData}
          rowKey={(r) => String(r.id ?? `${r.patientId}-${r.visitDate}`)}
          tableProps={{ loading: isLoading }}
          action={{
            title: 'Action',
            width: 100,
            align: 'center',
            render: (record) => (
              <Button
                size="small"
                onClick={() => {
                  if (record.id) navigate(`/dashboard/encounter/edit/${record.id}`)
                }}
              >
                Detail
              </Button>
            )
          }}
        />
      </div>
    </div>
  )
}
