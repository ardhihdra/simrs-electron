import { useMemo, useState } from 'react'

import { Alert, Button, Card, DatePicker, Empty, Select, Spin, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { Link } from 'react-router'

import { client } from '@renderer/utils/client'

const { Text, Title } = Typography

const WAITING_STATUSES = new Set(['PRE_RESERVED', 'REGISTERED', 'RESERVED', 'WAITING'])
const ACTIVE_STATUSES = new Set(['CALLED', 'CHECKED_IN', 'IN_PROGRESS'])
const COMPLETED_STATUSES = new Set(['CHECKED_OUT', 'COMPLETED', 'DONE', 'FINISHED'])

type QueueTicket = {
  id?: string
  status?: string
  queueNumber?: number | { value?: number } | null
  formattedQueueNumber?: string | null
  poliCodeId?: string | number
  practitionerId?: string | number
  serviceUnitCodeId?: string
  doctorName?: string
  patient?: { name?: string | null } | null
  poliName?: string
  serviceUnit?: { id?: string | number; name?: string | null; display?: string | null } | null
  practitioner?: { name?: string | null; display?: string | null; fullName?: string | null } | null
}

type QueueSummary = {
  key: string
  poli: string
  doctor: string
  practitionerId?: string
  currentTicket?: QueueTicket
  nextTicket?: QueueTicket
  handledCount: number
  remainingCount: number
}

type DoctorFilterOption = {
  value: string
  label: string
}

const normalizeStatus = (status?: string) => (status || '').toUpperCase()

const getQueueNumber = (ticket?: QueueTicket): number | null => {
  if (!ticket) return null

  if (typeof ticket.queueNumber === 'number' && Number.isFinite(ticket.queueNumber)) {
    return ticket.queueNumber
  }

  if (ticket.queueNumber && typeof ticket.queueNumber === 'object') {
    const queueValue = ticket.queueNumber.value
    if (typeof queueValue === 'number' && Number.isFinite(queueValue)) {
      return queueValue
    }
  }

  if (typeof ticket.formattedQueueNumber === 'string') {
    const numbers = ticket.formattedQueueNumber.match(/\d+/g)
    if (numbers?.length) {
      const parsed = Number(numbers[numbers.length - 1])
      return Number.isFinite(parsed) ? parsed : null
    }
  }

  return null
}

const getQueueLabel = (ticket?: QueueTicket) => {
  if (!ticket) return '-'

  if (typeof ticket.formattedQueueNumber === 'string' && ticket.formattedQueueNumber.trim()) {
    return ticket.formattedQueueNumber.trim()
  }

  const queueNumber = getQueueNumber(ticket)
  if (queueNumber === null) return '-'

  return queueNumber.toString().padStart(3, '0')
}

const getPatientName = (ticket?: QueueTicket) => ticket?.patient?.name?.trim() || '-'

const getPoliName = (ticket: QueueTicket) =>
  ticket.poliName?.trim() ||
  ticket.serviceUnit?.display?.trim() ||
  'Poli belum ditentukan'

const getDoctorName = (ticket: QueueTicket) =>
  ticket.practitioner?.name?.trim() ||
  ticket.practitioner?.fullName?.trim() ||
  ticket.practitioner?.display?.trim() ||
  ticket.doctorName?.trim() ||
  'Dokter belum ditentukan'

const getPractitionerId = (ticket?: QueueTicket) =>
  ticket?.practitionerId !== undefined ? String(ticket.practitionerId) : undefined

const compareTicketByNumber = (a: QueueTicket, b: QueueTicket) => {
  const aNumber = getQueueNumber(a)
  const bNumber = getQueueNumber(b)

  if (aNumber === null && bNumber === null) return getQueueLabel(a).localeCompare(getQueueLabel(b))
  if (aNumber === null) return 1
  if (bNumber === null) return -1

  return aNumber - bNumber
}

const createQueueSummary = (tickets: QueueTicket[]) => {
  const grouped = new Map<string, QueueTicket[]>()

  tickets.forEach((ticket) => {
    const poli = getPoliName(ticket)
    const doctor = getDoctorName(ticket)
    const key = `${ticket.poliCodeId || poli}-${ticket.practitionerId || doctor}-${ticket.serviceUnitCodeId || ''}`

    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)?.push(ticket)
  })

  return Array.from(grouped.entries())
    .map(([key, ticketList]): QueueSummary => {
      const sortedTickets = [...ticketList].sort(compareTicketByNumber)
      const waitingTickets = sortedTickets.filter((ticket) =>
        WAITING_STATUSES.has(normalizeStatus(ticket.status))
      )
      const activeTickets = sortedTickets.filter((ticket) =>
        ACTIVE_STATUSES.has(normalizeStatus(ticket.status))
      )
      const doneTickets = sortedTickets.filter((ticket) =>
        COMPLETED_STATUSES.has(normalizeStatus(ticket.status))
      )

      const currentTicket = activeTickets[0]
      const nextTicket = waitingTickets[0]

      let handledCount = doneTickets.length

      if (handledCount === 0) {
        const pivotNumber = getQueueNumber(currentTicket) ?? getQueueNumber(nextTicket)
        if (pivotNumber !== null) {
          handledCount = sortedTickets.filter((ticket) => {
            const queueNumber = getQueueNumber(ticket)
            if (queueNumber === null) return false
            return (
              queueNumber < pivotNumber && !WAITING_STATUSES.has(normalizeStatus(ticket.status))
            )
          }).length
        }
      }

      return {
        key,
        poli: getPoliName(sortedTickets[0]),
        doctor: getDoctorName(sortedTickets[0]),
        practitionerId: getPractitionerId(sortedTickets[0]),
        currentTicket,
        nextTicket,
        handledCount,
        remainingCount: waitingTickets.length
      }
    })
    .sort((a, b) => a.poli.localeCompare(b.poli) || a.doctor.localeCompare(b.doctor))
}

function MonitorMetric({
  label,
  value,
  note
}: {
  label: string
  value: string | number
  note?: string
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold leading-tight text-slate-900">{value}</div>
      {note ? <div className="mt-1 text-xs text-slate-600">{note}</div> : null}
    </div>
  )
}

export default function EncounterMonitor() {
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState(() => dayjs())
  const queueDate = selectedDate.format('YYYY-MM-DD')

  const queueQuery = client.visitManagement.getActiveQueues.useQuery(
    {
      queueDate
    },
    {
      refetchInterval: 5000,
      staleTime: 5000,
      queryKey: ['queue-monitor', { queueDate }]
    }
  )

  const tickets = useMemo<QueueTicket[]>(() => {
    if (!Array.isArray(queueQuery.data?.result)) return []
    return queueQuery.data.result as QueueTicket[]
  }, [queueQuery.data])

  const summaries = useMemo(() => createQueueSummary(tickets), [tickets])
  const doctorOptions = useMemo<DoctorFilterOption[]>(() => {
    const optionsMap = new Map<string, DoctorFilterOption>()

    summaries.forEach((summary) => {
      const value = summary.practitionerId || `name:${summary.doctor}`
      if (!optionsMap.has(value)) {
        optionsMap.set(value, {
          value,
          label: summary.practitionerId ? `${summary.doctor} (${summary.practitionerId})` : summary.doctor
        })
      }
    })

    return Array.from(optionsMap.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [summaries])

  const filteredSummaries = useMemo(() => {
    if (!selectedDoctor) return summaries

    return summaries.filter((summary) => {
      const summaryValue = summary.practitionerId || `name:${summary.doctor}`
      return summaryValue === selectedDoctor
    })
  }, [selectedDoctor, summaries])

  const totalHandled = useMemo(
    () => filteredSummaries.reduce((total, summary) => total + summary.handledCount, 0),
    [filteredSummaries]
  )
  const totalRemaining = useMemo(
    () => filteredSummaries.reduce((total, summary) => total + summary.remainingCount, 0),
    [filteredSummaries]
  )
  const totalInTreatment = useMemo(
    () => filteredSummaries.filter((summary) => Boolean(summary.currentTicket)).length,
    [filteredSummaries]
  )

  if (queueQuery.isError) {
    return (
      <Alert
        type="error"
        message="Gagal memuat data monitor antrian"
        description="Silakan periksa koneksi atau coba beberapa saat lagi."
        showIcon
      />
    )
  }
console.log(queueQuery.data)
  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Title level={4} className="!mb-1">
              Monitor Antrian Poli Dokter
            </Title>
            <Text type="secondary">
              Tanggal antrian {selectedDate.format('DD MMM YYYY')} • update otomatis setiap 5 detik
            </Text>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
            <DatePicker
              allowClear={false}
              className="min-w-[260px]"
              format="DD MMM YYYY"
              value={selectedDate}
              onChange={(value) => setSelectedDate(value ?? dayjs())}
            />
            <Select
              allowClear
              showSearch
              placeholder="Filter dokter"
              className="min-w-[260px]"
              value={selectedDoctor}
              onChange={(value) => setSelectedDoctor(value)}
              options={doctorOptions}
              optionFilterProp="label"
            />
            {queueQuery.isFetching ? <Tag color="processing">Memperbarui data</Tag> : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <MonitorMetric label="Poli Dokter Aktif" value={filteredSummaries.length} />
          <MonitorMetric label="Sedang Ditangani" value={totalInTreatment} />
          <MonitorMetric label="Sudah Ditangani" value={totalHandled} />
          <MonitorMetric label="Sisa Antrian" value={totalRemaining} />
        </div>
      </Card>

      {queueQuery.isLoading ? (
        <Card className="border-0 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <Spin size="large" />
          </div>
        </Card>
      ) : filteredSummaries.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <Empty
            description={
              selectedDoctor
                ? 'Tidak ada antrian untuk dokter yang dipilih'
                : `Belum ada antrian aktif untuk ${selectedDate.format('DD MMM YYYY')}`
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSummaries.map((summary) => (
            <Card key={summary.key} className="border-0 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{summary.poli}</div>
                  <div className="text-sm text-slate-500">{summary.doctor}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color={summary.currentTicket ? 'green' : 'default'}>
                    {summary.currentTicket ? 'Sedang berjalan' : 'Menunggu giliran'}
                  </Tag>
                  {summary.practitionerId ? (
                    <Link to={`/monitor/doctor/${summary.practitionerId}`}>
                      <Button size="small" type="default">
                        Lihat Antrian Dokter
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MonitorMetric
                  label="Sedang Ditangani"
                  value={getQueueLabel(summary.currentTicket)}
                  note={getPatientName(summary.currentTicket)}
                />
                <MonitorMetric label="Sudah Ditangani" value={summary.handledCount} />
                <MonitorMetric
                  label="Next Antrian"
                  value={getQueueLabel(summary.nextTicket)}
                  note={getPatientName(summary.nextTicket)}
                />
                <MonitorMetric label="Sisa Antrian" value={summary.remainingCount} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
