import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  SoundOutlined
} from '@ant-design/icons'
import { ReactNode, useMemo } from 'react'

import { Alert, Button, Card, Empty, Spin, Typography, theme } from 'antd'
import dayjs from 'dayjs'
import { useNavigate, useParams } from 'react-router'

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
  poliName?: string
  doctorName?: string
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
  ticket.poliName?.trim() ||
  ticket.serviceUnit?.name?.trim() ||
  ticket.serviceUnit?.display?.trim() ||
  'Poli belum ditentukan'

const getDoctorName = (ticket?: QueueTicket) =>
  ticket?.practitioner?.name?.trim() ||
  ticket?.practitioner?.fullName?.trim() ||
  ticket?.practitioner?.display?.trim() ||
  ticket?.doctorName?.trim() ||
  'Dokter belum ditentukan'

const sortByQueueNumber = (a: QueueTicket, b: QueueTicket) => {
  const aNumber = getQueueNumber(a)
  const bNumber = getQueueNumber(b)

  if (aNumber === null && bNumber === null) return getQueueLabel(a).localeCompare(getQueueLabel(b))
  if (aNumber === null) return 1
  if (bNumber === null) return -1

  return aNumber - bNumber
}

function QueueStripCard({
  title,
  subtitle,
  queues,
  icon,
  surface,
  borderColor,
  accentColor,
  iconSurface
}: {
  title: string
  subtitle: string
  queues: QueueTicket[]
  icon: ReactNode
  surface: string
  borderColor: string
  accentColor: string
  iconSurface: string
}) {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: '20px 24px' } }}
      style={{
        background: surface,
        border: `1px solid ${borderColor}`,
        borderRadius: 24,
        boxShadow: token.boxShadowTertiary
      }}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="fixed top-0 left-0 z-50">
          <Button type="default" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{
              background: iconSurface,
              color: accentColor
            }}
          >
            {icon}
          </div>
          <div>
            <div
              className="text-lg font-semibold uppercase tracking-wide"
              style={{ color: accentColor }}
            >
              {title}
            </div>
            <div className="text-base" style={{ color: token.colorTextSecondary }}>
              {subtitle}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {queues.length > 0 ? (
            queues.map((queue) => (
              <div
                key={queue.id || `${title}-${getQueueLabel(queue)}`}
                className="min-w-28 rounded-2xl px-5 py-3 text-center text-2xl font-bold"
                style={{
                  background: token.colorBgContainer,
                  color: accentColor,
                  boxShadow: token.boxShadowSecondary
                }}
              >
                {getQueueLabel(queue)}
              </div>
            ))
          ) : (
            <div
              className="min-w-28 rounded-2xl px-5 py-3 text-center text-2xl font-bold"
              style={{
                background: token.colorBgContainer,
                color: token.colorTextTertiary,
                boxShadow: token.boxShadowSecondary
              }}
            >
              -
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function DoctorQueueMonitor() {
  const { token } = theme.useToken()
  const { practitionerId = '' } = useParams()
  const queueDate = dayjs().format('YYYY-MM-DD')
  // const queueDate = '2026-03-17'

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

  const allTickets = useMemo<QueueTicket[]>(() => {
    if (!Array.isArray(queueQuery.data?.result)) return []
    return queueQuery.data.result as QueueTicket[]
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

  const completedTickets = useMemo(() => {
    const activeTicketId = activeTicket?.id

    return doctorTickets.filter((ticket) => {
      if (activeTicketId && ticket.id === activeTicketId) return false
      return !WAITING_STATUSES.has(normalizeStatus(ticket.status))
    })
  }, [activeTicket?.id, doctorTickets])

  const nextTickets = waitingTickets.slice(0, 2)
  const lastCalledTickets = completedTickets.slice(-2)
  const doctorName =
    getDoctorName(doctorTickets[0]) || (practitionerId ? `Dokter ${practitionerId}` : 'Dokter')
  const poliNames = Array.from(new Set(doctorTickets.map((ticket) => getPoliName(ticket)))).filter(
    Boolean
  )
  const poliLabel = poliNames.join(', ') || 'Poli belum ditentukan'
  const lastUpdatedLabel = queueQuery.dataUpdatedAt
    ? dayjs(queueQuery.dataUpdatedAt).format('HH:mm:ss')
    : '-'
  const currentInstruction = activeTicket
    ? 'Harap menuju ruang pemeriksaan'
    : 'Menunggu panggilan berikutnya'

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
      <Card
        variant="borderless"
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`
        }}
      >
        <div className="flex items-center justify-center py-16">
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (doctorTickets.length === 0) {
    return (
      <Card
        variant="borderless"
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`
        }}
      >
        <Empty
          description={`Belum ada antrian untuk dokter ${practitionerId} pada ${dayjs(queueDate).format('DD MMM YYYY')}`}
        />
      </Card>
    )
  }

  return (
    <div
      className="mx-auto w-full min-h-[calc(100vh-6rem)] h-screen px-4 py-6 md:px-8 flex flex-col justify-between"
      style={{
        background: `linear-gradient(180deg, ${token.colorBgContainer} 0%, ${token.colorPrimaryBg} 100%)`
      }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
              style={{
                background: token.colorPrimaryBg,
                color: token.colorPrimary
              }}
            >
              <MedicineBoxOutlined />
            </div>
            <div>
              <Title level={2} className="!mb-1" style={{ color: token.colorTextHeading }}>
                {poliLabel}
              </Title>
              <Text className="text-xl" style={{ color: token.colorTextSecondary }}>
                {doctorName}
              </Text>
            </div>
          </div>

          <div className="self-start lg:text-right">
            <Card
              variant="borderless"
              styles={{ body: { padding: '16px 20px' } }}
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 20,
                boxShadow: token.boxShadowTertiary
              }}
            >
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-3">
                  <CalendarOutlined style={{ color: token.colorPrimary, fontSize: 22 }} />
                  <Text className="text-2xl" style={{ color: token.colorTextHeading }}>
                    {dayjs(queueDate).format('DD MMM YYYY')}
                  </Text>
                </div>
                <div className="h-10 w-px" style={{ background: token.colorBorderSecondary }} />
                <div className="flex items-center gap-3">
                  <ClockCircleOutlined style={{ color: token.colorPrimary, fontSize: 22 }} />
                  <Text className="text-2xl" style={{ color: token.colorTextHeading }}>
                    {lastUpdatedLabel}
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="h-px" style={{ background: token.colorBorderSecondary }} />
      </div>

      <div className="flex justify-center">
        <Card
          variant="borderless"
          styles={{ body: { padding: '48px 56px' } }}
          style={{
            width: '100%',
            maxWidth: 1120,
            background: `
              radial-gradient(circle at top right, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 34%),
              radial-gradient(circle at bottom left, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 24%)
            `,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 32,
            boxShadow: token.boxShadowSecondary
          }}
        >
          <div className="text-center">
            <div
              className="text-4xl font-semibold uppercase tracking-[0.18em] md:text-5xl"
              style={{ color: token.colorTextSecondary }}
            >
              Antrian Sekarang
            </div>
            <div className="my-8 h-px" style={{ background: token.colorBorderSecondary }} />
            <div
              className="text-[92px] font-black leading-none md:text-[160px]"
              style={{ color: token.colorPrimary }}
            >
              {getQueueLabel(activeTicket)}
            </div>
            <div className="mt-6 text-3xl md:text-5xl" style={{ color: token.colorTextHeading }}>
              {activeTicket ? getPatientName(activeTicket) : 'Belum ada antrian aktif'}
            </div>
            <div className="my-8 h-px" style={{ background: token.colorBorderSecondary }} />
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-3 rounded-full px-8 py-4 text-2xl font-medium"
                style={{
                  background: token.colorPrimaryBg,
                  color: token.colorPrimary
                }}
              >
                <SoundOutlined />
                <span>{currentInstruction}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <QueueStripCard
          title="Antrian Selesai"
          subtitle="Finished"
          queues={lastCalledTickets}
          icon={<CheckCircleFilled />}
          surface={token.colorSuccessBg}
          borderColor={token.colorBorderSecondary}
          accentColor={token.colorSuccessText}
          iconSurface={token.colorBgContainer}
        />
        <QueueStripCard
          title="Antrian Berikutnya"
          subtitle="Next Queue"
          queues={nextTickets}
          icon={<ArrowRightOutlined />}
          surface={token.colorPrimaryBg}
          borderColor={token.colorBorderSecondary}
          accentColor={token.colorPrimary}
          iconSurface={token.colorBgContainer}
        />
      </div>
    </div>
  )
}
