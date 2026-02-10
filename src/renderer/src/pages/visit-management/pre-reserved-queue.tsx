import GenericTable from '@renderer/components/organisms/GenericTable'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { TableHeader } from '@renderer/components/TableHeader'
import {
  QueueItem,
  useActiveQueues,
  useConfirmAttendance,
  useStartEncounter
} from '@renderer/hooks/query/use-visit-management'
import type { MenuProps } from 'antd'
import { Button, Col, Dropdown, Form, Input, Select, Tag, message } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { PatientSelectionModal } from './components/PatientSelectionModal'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'PRE_RESERVED', label: 'Pre-Reserved' },
  { value: 'REGISTERED', label: 'Registered' },
  { value: 'CALLED', label: 'Called' },
  { value: 'IN_PROGRESS', label: 'In Progress' }
]

const STATUS_COLORS: Record<string, string> = {
  PRE_RESERVED: 'orange',
  REGISTERED: 'blue',
  CALLED: 'purple',
  IN_PROGRESS: 'green'
}

export default function PreReservedQueuePage() {
  const [filterParams, setFilterParams] = useState<{
    status?: string
    poliCodeId?: string
  }>({})
  const { data, isLoading } = useActiveQueues(filterParams)

  const { mutate: confirmAttendance, isPending: isConfirming } = useConfirmAttendance()
  const { mutate: startEncounter, isPending: isStarting } = useStartEncounter()
  const [searchValues, setSearchValues] = useState<Record<string, string>>({})

  // Patient selection for queues without patientId
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const [pendingQueueId, setPendingQueueId] = useState<string | null>(null)

  const filteredData = useMemo(() => {
    const source: QueueItem[] = Array.isArray(data?.data) ? data.data : []
    if (!source.length) return []

    return source.filter((item) => {
      // Search filter
      const q = searchValues.name?.toLowerCase()
      if (q) {
        return (
          item.patient?.name?.toLowerCase().includes(q) ||
          item.formattedQueueNumber.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [data, searchValues])

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
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
      width: 120
    },
    {
      title: 'Nama Pasien',
      dataIndex: ['patient', 'name'],
      key: 'patientName',
      render: (v: string) =>
        v ? v : <span className="text-gray-400 italic">Belum teridentifikasi</span>
    },
    {
      title: 'Poli / Unit',
      key: 'poli',
      render: (_: unknown, record: QueueItem) => (
        <span>{record.poli?.name || record.serviceUnit?.name || '-'}</span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>{String(status).replace(/_/g, ' ')}</Tag>
      )
    }
  ]

  const handleConfirm = (id: string, patientId?: string, patientName?: string) => {
    if (!patientId) {
      setPendingQueueId(id)
      setIsPatientModalOpen(true)
      return
    }

    confirmAttendance(
      { queueId: id, patientId },
      {
        onSuccess: () => {
          message.success(`Berhasil mengkonfirmasi kehadiran ${patientName || ''}`)
          setPendingQueueId(null)
        },
        onError: (err: Error) => {
          message.error(`Gagal mengkonfirmasi: ${err.message}`)
        }
      }
    )
  }

  const handleStartEncounter = (record: QueueItem, recordTriage: boolean) => {
    if (!record.patientId) {
      message.error('Pasien belum teridentifikasi')
      return
    }

    startEncounter(
      {
        queueId: record.id,
        patientId: record.patientId,
        serviceUnitId: record.serviceUnitCodeId,
        serviceUnitCodeId: record.serviceUnitCodeId,
        recordTriage
      },
      {
        onSuccess: () => {
          message.success(
            recordTriage
              ? 'Encounter dimulai, silakan catat triage'
              : 'Encounter dimulai tanpa triage'
          )
        },
        onError: (err: Error) => {
          message.error(`Gagal memulai encounter: ${err.message}`)
        }
      }
    )
  }

  const renderActionButton = (record: QueueItem) => {
    if (record.status === 'PRE_RESERVED') {
      return (
        <Button
          type="primary"
          size="small"
          loading={isConfirming && pendingQueueId === record.id}
          onClick={() => handleConfirm(record.id, record.patientId, record.patient?.name)}
        >
          Konfirmasi Hadir
        </Button>
      )
    }

    if (record.status === 'REGISTERED') {
      const items: MenuProps['items'] = [
        {
          key: 'with-triage',
          label: 'Mulai dengan Triage',
          onClick: () => handleStartEncounter(record, true)
        },
        {
          key: 'without-triage',
          label: 'Mulai tanpa Triage',
          onClick: () => handleStartEncounter(record, false)
        }
      ]

      return (
        <Dropdown menu={{ items }} trigger={['click']}>
          <Button type="primary" size="small" loading={isStarting}>
            Mulai Layanan
          </Button>
        </Dropdown>
      )
    }

    if (record.status === 'CALLED' || record.status === 'IN_PROGRESS') {
      return (
        <Tag color={STATUS_COLORS[record.status]}>
          {record.status === 'IN_PROGRESS' ? 'Sedang Berlangsung' : 'Dipanggil'}
        </Tag>
      )
    }

    return null
  }

  return (
    <div>
      <TableHeader
        title="Manajemen Antrian"
        onSearch={setSearchValues}
        onReset={() => setSearchValues({})}
      >
        <Col span={6}>
          <Form.Item name="name" label="Cari">
            <Input placeholder="Nama pasien / No antrian..." />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item label="Status">
            <Select
              options={STATUS_OPTIONS}
              value={filterParams.status || ''}
              onChange={(val) => setFilterParams((prev) => ({ ...prev, status: val || undefined }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item label="Poli">
            <SelectAsync
              entity="poli"
              value={filterParams.poliCodeId}
              onChange={(val) =>
                setFilterParams((prev) => ({ ...prev, poliCodeId: val || undefined }))
              }
              placeHolder="Semua Poli"
            />
          </Form.Item>
        </Col>
      </TableHeader>

      <div className="mt-4">
        <GenericTable<QueueItem>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          tableProps={{ loading: isLoading }}
          action={{
            title: 'Aksi',
            width: 150,
            align: 'center',
            render: renderActionButton
          }}
        />
      </div>

      <PatientSelectionModal
        open={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSelect={(patient) => {
          if (pendingQueueId) {
            handleConfirm(pendingQueueId, patient.id, patient.name)
          }
        }}
      />
    </div>
  )
}
