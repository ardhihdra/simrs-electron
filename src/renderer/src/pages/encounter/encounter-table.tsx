import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { SelectPoli } from '@renderer/components/molecules/SelectPoli'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { useDeleteEncounter } from '@renderer/hooks/query/use-encounter'
import { singkatPoli } from '@renderer/utils/singkatPoli'
import { EncounterRow, EncounterTableRow } from '@shared/encounter'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Popconfirm,
  Select,
  Tabs,
  Tooltip
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { QueueTicketResponse } from 'simrs-types'

// --- Queue Ticket Logic & Columns ---
const queueColumns: ColumnsType<QueueTicketResponse> = [
  {
    title: 'No',
    dataIndex: 'no',
    key: 'no',
    width: 60,
    render: (value, record, index) => index + 1
  },
  {
    title: 'Nomor Antrian',
    dataIndex: ['queueTicket', 'queueNumber'],
    key: 'queueNumber',
    render: (value, record) => `${singkatPoli(record.poli?.name)} - ${record.queueNumber}`
  },
  {
    title: 'MRN',
    dataIndex: ['patient', 'medicalRecordNumber'],
    key: 'medicalRecordNumber'
  },
  {
    title: 'Asuransi',
    dataIndex: ['assurance', 'display'],
    key: 'assurance'
  },
  {
    title: 'Nama',
    dataIndex: ['patient', 'name'],
    key: 'name'
  },
  {
    title: 'Gender',
    dataIndex: ['patient', 'gender'],
    key: 'gender',
    render: (value: string) => (value === 'male' ? 'Laki-laki' : 'Perempuan')
  }
]

// --- Encounter Logic & Columns ---
const encounterColumns: ColumnsType<EncounterTableRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
  {
    title: 'Kode Antrian',
    dataIndex: 'encounterCode',
    key: 'encounterCode',
    render: (v: string | null) => (v ? v : '-')
  },
  {
    title: 'Tanggal Kunjungan',
    dataIndex: 'visitDate',
    key: 'visitDate',
    render: (v: string | Date) => (v ? dayjs(v).format('DD MMMM YYYY HH:mm') : '-')
  },
  { title: 'Pasien', dataIndex: ['patient', 'name'], key: 'patient' },
  { title: 'Layanan', dataIndex: 'serviceType', key: 'serviceType' },
  { title: 'Alasan', dataIndex: 'reason', key: 'reason' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  {
    title: 'Status Perawat',
    key: 'nurseStatus',
    render: (_, record) => {
      // Dummy logic for Nurse Status based on Encounter Status
      const status = record.status?.toLowerCase()
      if (status === 'arrived') return <span className="text-orange-500">Menunggu Pemeriksaan</span>
      if (status === 'triaged') return <span className="text-green-500">Sudah Diperiksa</span>
      if (status === 'in-progress')
        return <span className="text-blue-500">Dalam Penanganan Dokter</span>
      if (status === 'finished') return <span className="text-gray-500">Selesai</span>
      return <span className="text-gray-400">-</span>
    }
  },
  { title: 'Catatan', dataIndex: 'note', key: 'note' }
]

function EncounterRowActions({ record }: { record: EncounterTableRow }) {
  const navigate = useNavigate()
  const deleteMutation = useDeleteEncounter()
  return (
    <div className="flex gap-2">
      <Tooltip title="Lihat Detail">
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {
            if (record.id) navigate(`/dashboard/encounter/edit/${record.id}?mode=view`)
          }}
        />
      </Tooltip>
      <Tooltip title="Edit">
        <Button
          icon={<EditOutlined />}
          size="small"
          onClick={() => {
            if (record.id) navigate(`/dashboard/encounter/edit/${record.id}`)
          }}
        />
      </Tooltip>
      <Popconfirm
        title="Hapus Kunjungan"
        description="Apakah anda yakin ingin menghapus data ini?"
        onConfirm={() => {
          if (record.id) deleteMutation.mutate(record.id)
        }}
        okText="Ya"
        cancelText="Batal"
        disabled={deleteMutation.isPending}
      >
        <Tooltip title="Hapus">
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deleteMutation.isPending}
          />
        </Tooltip>
      </Popconfirm>
    </div>
  )
}

export function EncounterTable() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('queue')

  // --- Date Range State ---
  const startDate = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now.toISOString()
  }, [])
  const endDate = useMemo(() => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    return now.toISOString()
  }, [])

  // --- Queue Ticket Query & State ---
  const {
    data: queueData,
    isLoading: isQueueLoading,
    isRefetching: isQueueRefetching,
    refetch: refetchQueue
  } = useQuery({
    queryKey: ['queue-ticket-list'],
    queryFn: () => {
      const fn = window.api.query.queueticket.listAll
      return fn({
        depth: 1,
        filter: 'status',
        equal: 'RESERVED',
        startDate: startDate,
        endDate: endDate
      })
    }
  })
  const [queueFilter, setQueueFilter] = useState({ name: '', medicalRecordNumber: '' })

  const filteredQueueData = useMemo(() => {
    const rawData = (queueData?.data as any[]) || []
    return rawData.filter((item) => {
      const patientName = item.patient?.name || ''
      const patientMrn = item.patient?.medicalRecordNumber || ''
      const filterName = queueFilter.name || ''
      const filterMrn = queueFilter.medicalRecordNumber || ''

      const matchName = patientName.toLowerCase().includes(filterName.toLowerCase())
      const matchMrn = patientMrn.toLowerCase().includes(filterMrn.toLowerCase())

      if (filterName && !matchName) return false
      if (filterMrn && !matchMrn) return false
      return true
    })
  }, [queueData, queueFilter])

  const handleCreateEncounterFromQueue = async (
    ticketId: string,
    shouldNavigate: boolean = false
  ) => {
    try {
      const tickets = (queueData?.data as any) || []
      const ticket = tickets.find((t: any) => t.id === ticketId)
      if (!ticket) throw new Error('Ticket not found')

      const isLab = ticket.serviceUnitCodeId === 'LAB'
      const payload: any = {
        patientId: ticket.patientId,
        queueTicketId: ticket.id,
        serviceUnitId: ticket.serviceUnit?.id,
        serviceUnitCodeId: ticket.serviceUnitCodeId
      }
      if (isLab) payload.source = 'WALK_IN'

      const createFn = isLab
        ? window.api.encounter.createLaboratory
        : window.api.encounter.createAmbulatory

      const encounterResponse = await createFn(payload)

      if (encounterResponse.success) {
        await window.api.query.queueticket.update({
          id: ticketId,
          status: 'CHECKED_IN'
        })
        message.success('Encounter created successfully and patient checked in')
        refetchQueue()

        if (shouldNavigate) {
          const resp = encounterResponse as any
          let createdEncounter = resp.data || resp.result
          if (createdEncounter && createdEncounter.result) {
            createdEncounter = createdEncounter.result
          }
          if (createdEncounter && createdEncounter.id) {
            navigate('/dashboard/encounter/triage', { state: { encounterId: createdEncounter.id } })
          } else {
            console.warn('Encounter created but ID not found in response', encounterResponse)
          }
        }
      } else {
        throw new Error(encounterResponse.error || 'Failed to create encounter')
      }
    } catch (error: unknown) {
      console.error('Failed to create encounter', error)
      const msg = error instanceof Error ? error.message : 'Failed to create encounter'
      message.error(msg)
    }
  }

  // --- Encounter List Query & State ---
  const {
    data: encounterData,
    isLoading: isEncounterLoading,
    isRefetching: isEncounterRefetching,
    refetch: refetchEncounter,
    isError: isEncounterError
  } = useQuery({
    queryKey: ['encounter-list'],
    queryFn: () => {
      // Fetch pure encounter list
      // Note: Adjust the API call if specific params needed
      return window.api.query.encounter.list({
        // items: '100', // Example
        // depth: 1
      })
    }
  })

  // Encounter Filters
  const [searchPatient, setSearchPatient] = useState('')
  const [searchService, setSearchService] = useState('')
  const [searchReason, setSearchReason] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [visitDate, setVisitDate] = useState<string | null>(null)

  const filteredEncounterData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const source: EncounterRow[] = Array.isArray(encounterData?.result)
      ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (encounterData!.result as EncounterRow[])
      : []

    const rows: EncounterTableRow[] = source.map((e, idx) => ({ ...e, no: idx + 1 }))
    return rows.filter((r) => {
      const matchPatient = searchPatient
        ? String(r.patient?.name || '')
            .toLowerCase()
            .includes(searchPatient.toLowerCase())
        : true
      const matchService = searchService
        ? String(r.serviceType || '')
            .toLowerCase()
            .includes(searchService.toLowerCase())
        : true
      const matchReason = searchReason
        ? String(r.reason || '')
            .toLowerCase()
            .includes(searchReason.toLowerCase())
        : true
      const matchStatus = status
        ? String(r.status || '').toLowerCase() === status.toLowerCase()
        : true
      const matchDate = visitDate ? dayjs(r.visitDate).isSame(dayjs(visitDate), 'day') : true
      return matchPatient && matchService && matchReason && matchStatus && matchDate
    })
  }, [encounterData, searchPatient, searchService, searchReason, status, visitDate])

  // --- Render ---

  const renderQueueTab = () => (
    <div>
      <TableHeader
        title="Daftar Antrian"
        onSearch={(values) => setQueueFilter(values)}
        onReset={() => setQueueFilter({ name: '', medicalRecordNumber: '' })}
        loading={isQueueLoading || isQueueRefetching}
      >
        <Col span={12}>
          <Form.Item name="name" label="Nama Pasien">
            <Input placeholder="Cari Nama Pasien" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="medicalRecordNumber" label="MRN">
            <Input placeholder="Cari MRN" allowClear />
          </Form.Item>
        </Col>
        <Col span={24}>
          <div className="text-gray-500">
            Menampilkan antrian untuk tanggal {new Date(startDate).toLocaleDateString()}
          </div>
        </Col>
      </TableHeader>
      <div className="mt-4">
        <GenericTable
          loading={isQueueLoading || isQueueRefetching}
          columns={queueColumns}
          dataSource={filteredQueueData}
          rowKey="id"
          action={{
            items(record) {
              return [
                {
                  key: 'start',
                  label: 'Pemeriksaan Awal',
                  onClick: () => handleCreateEncounterFromQueue(record.id, true),
                  confirm: {
                    title: 'Pemeriksaan Awal',
                    description: 'Apakah anda yakin ingin memulai pemeriksaan untuk pasien ini?'
                  }
                },
                {
                  key: 'transfer',
                  label: 'Panggil Pasien',
                  onClick: () => handleCreateEncounterFromQueue(record.id, false),
                  confirm: {
                    title: 'Panggil Pasien',
                    description: 'Apakah anda yakin ingin memanggil pasien ini?'
                  }
                }
              ]
            }
          }}
        />
      </div>
    </div>
  )

  const renderEncounterTab = () => (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/dashboard/encounter/create')}
        >
          Tambah
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetchEncounter()}>
          Refresh
        </Button>
        <Button
          onClick={async () => {
            try {
              const res = await window.api.query.export.exportCsv({
                entity: 'encounter',
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3 mb-3">
        <Input
          placeholder="Pasien"
          value={searchPatient}
          onChange={(e) => setSearchPatient(e.target.value)}
        />
        <SelectPoli
          valueType="name"
          placeholder="Layanan"
          value={searchService}
          onChange={(val) => setSearchService(val as string)}
          allowClear
          className="w-full"
        />
        <Input
          placeholder="Alasan"
          value={searchReason}
          onChange={(e) => setSearchReason(e.target.value)}
        />
        <Select
          allowClear
          placeholder="SEMUA STATUS"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { label: 'Planned', value: 'planned' },
            { label: 'Arrived', value: 'arrived' },
            { label: 'Triaged', value: 'triaged' },
            { label: 'In Progress', value: 'in-progress' },
            { label: 'On Hold', value: 'onhold' },
            { label: 'Finished', value: 'finished' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Entered In Error', value: 'entered-in-error' },
            { label: 'Unknown', value: 'unknown' }
          ]}
        />
        <DatePicker
          placeholder="Tanggal Kunjungan"
          value={visitDate ? dayjs(visitDate) : null}
          onChange={(d) => setVisitDate(d ? d.toISOString() : null)}
          className="w-full"
        />
        <div />
        <div />
      </div>

      {isEncounterError ||
        (!encounterData?.success && <div className="text-red-500">{encounterData?.error}</div>)}

      <GenericTable<EncounterTableRow>
        loading={isEncounterLoading || isEncounterRefetching}
        columns={encounterColumns}
        dataSource={filteredEncounterData}
        rowKey={(r) => String(r.id ?? `${r.serviceType}-${r.patient?.name || ''}`)}
        action={{
          title: 'Action',
          width: 100,
          align: 'center',
          fixedRight: true,
          render: (record) => <EncounterRowActions record={record} />
        }}
      />
    </div>
  )

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manajemen Kunjungan</h2>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'queue',
            label: 'Daftar Antrian (Pending)',
            children: renderQueueTab()
          },
          {
            key: 'encounter',
            label: 'Daftar Kunjungan (All)',
            children: renderEncounterTab()
          }
        ]}
      />
    </div>
  )
}

export default EncounterTable
