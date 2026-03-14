import { useMemo } from 'react'

import { Alert, Card, Empty, Spin, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useParams } from 'react-router'

import { client } from '@renderer/utils/client'

const { Text, Title } = Typography

const WAITING_STATUSES = new Set(['PRE_RESERVED', 'REGISTERED', 'RESERVED', 'WAITING'])
const ACTIVE_STATUSES = new Set(['CALLED', 'CHECKED_IN', 'IN_PROGRESS'])

type QueueTicket = {
  id?: string
  status?: string
  queueNumber?: number | { value?: number } | null
  formattedQueueNumber?: string | null
  practitionerId?: string | number
  patient?: { name?: string | null } | null
  poli?: { name?: string | null } | null
  serviceUnit?: { name?: string | null; display?: string | null } | null
  practitioner?: { name?: string | null; display?: string | null; fullName?: string | null } | null
}

const normalizeStatus = (status?: string) => (status || '').toUpperCase()

const getQueueNumber = (ticket?: QueueTicket): number | null => {
  if (!ticket) return null

  if (typeof ticket.queueNumber === 'number' && Number.isFinite(ticket.queueNumber)) {
    return ticket.queueNumber
  }

  if (ticket.queueNumber && typeof ticket.queueNumber === 'object') {
    const value = ticket.queueNumber.value
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
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

  const number = getQueueNumber(ticket)
  if (number === null) return '-'
  return number.toString().padStart(3, '0')
}

const getPatientName = (ticket?: QueueTicket) => ticket?.patient?.name?.trim() || '-'

const getPoliName = (ticket: QueueTicket) =>
  ticket.poli?.name?.trim() ||
  ticket.serviceUnit?.name?.trim() ||
  ticket.serviceUnit?.display?.trim() ||
  'Poli belum ditentukan'

const getDoctorName = (ticket?: QueueTicket) =>
  ticket?.practitioner?.name?.trim() ||
  ticket?.practitioner?.fullName?.trim() ||
  ticket?.practitioner?.display?.trim() ||
  'Dokter belum ditentukan'

const sortByQueueNumber = (a: QueueTicket, b: QueueTicket) => {
  const aNumber = getQueueNumber(a)
  const bNumber = getQueueNumber(b)

  if (aNumber === null && bNumber === null) return getQueueLabel(a).localeCompare(getQueueLabel(b))
  if (aNumber === null) return 1
  if (bNumber === null) return -1

  return aNumber - bNumber
}

export default function DoctorQueueMonitor() {
  const { practitionerId = '' } = useParams()
  const queueDate = dayjs().format('YYYY-MM-DD')

  const queueQuery = client.visitManagement.getActiveQueues.useQuery(
    {
      queueDate
    },
    {
      refetchInterval: 5000,
      staleTime: 5000
    }
  )

  const allTickets = useMemo<QueueTicket[]>(() => {
    if (!Array.isArray(queueQuery.data?.data)) return []
    return queueQuery.data.data as QueueTicket[]
  }, [queueQuery.data])

  const doctorTickets = useMemo(
    () =>
      allTickets
        .filter((ticket) => String(ticket.practitionerId ?? '') === practitionerId)
        .sort(sortByQueueNumber),
    [allTickets, practitionerId]
  )

  const activeTicket = useMemo(
    () => doctorTickets.find((ticket) => ACTIVE_STATUSES.has(normalizeStatus(ticket.status))),
    [doctorTickets]
  )

  const waitingTickets = useMemo(
    () => doctorTickets.filter((ticket) => WAITING_STATUSES.has(normalizeStatus(ticket.status))),
    [doctorTickets]
  )

  const nextTicket = waitingTickets[0]
  const remainingTickets = waitingTickets.slice(nextTicket ? 1 : 0)

  const doctorName =
    getDoctorName(doctorTickets[0]) || (practitionerId ? `Dokter ${practitionerId}` : 'Dokter')

  const poliNames = useMemo(
    () => Array.from(new Set(doctorTickets.map((ticket) => getPoliName(ticket)))).filter(Boolean),
    [doctorTickets]
  )

  if (!practitionerId) {
    return <Alert type="warning" showIcon message="Dokter tidak ditemukan pada URL." />
  }

  if (queueQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Gagal memuat antrian dokter"
        description="Silakan periksa koneksi lalu coba lagi."
      />
    )
  }

  if (queueQuery.isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <div className="flex items-center justify-center py-16">
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (doctorTickets.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <Empty description={`Belum ada antrian untuk dokter ${practitionerId} hari ini`} />
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card className="border-0 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Text type="secondary">Monitor Dokter</Text>
            <Title level={3} className="!mb-1 !mt-0">
              {doctorName}
            </Title>
            <Text type="secondary">ID Dokter: {practitionerId}</Text>
          </div>
          <Tag color="processing">Update {dayjs().format('HH:mm:ss')}</Tag>
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Poli Bertugas</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {poliNames.map((poli) => (
              <Tag key={poli} color="blue">
                {poli}
              </Tag>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border-0 bg-slate-900 text-center shadow-sm">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-300">
          Antrian Sedang Dipanggil
        </div>
        <div className="mt-2 text-7xl font-bold leading-none text-white md:text-8xl">
          {getQueueLabel(activeTicket)}
        </div>
        <div className="mt-4 text-sm text-slate-200">{getPatientName(activeTicket)}</div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Next Queue</div>
          <div className="mt-2 text-4xl font-bold text-slate-900">{getQueueLabel(nextTicket)}</div>
          <div className="mt-2 text-sm text-slate-600">{getPatientName(nextTicket)}</div>
        </Card>

        <Card className="border-0 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Remaining Queue
          </div>
          <div className="mt-2 text-4xl font-bold text-slate-900">{remainingTickets.length}</div>
          <div className="mt-2 text-sm text-slate-600">
            {remainingTickets.length > 0
              ? remainingTickets.map((ticket) => getQueueLabel(ticket)).join(', ')
              : 'Tidak ada antrian tersisa'}
          </div>
        </Card>
      </div>
    </div>
  )
}
