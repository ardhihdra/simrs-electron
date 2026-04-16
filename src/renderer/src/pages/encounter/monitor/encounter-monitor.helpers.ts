export type MonitorQueueTicket = {
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

export type PublicQueueSummary = {
  key: string
  poli: string
  doctor: string
  practitionerId?: string
  currentQueueLabel: string
  nextQueueLabel?: string
  patientInitials: string
  remainingCount: number
  handledCount: number
  isActive: boolean
}

export type DoctorFilterOption = {
  value: string
  label: string
}

const WAITING_STATUSES = new Set(['PRE_RESERVED', 'REGISTERED', 'RESERVED', 'WAITING'])
const ACTIVE_STATUSES = new Set(['CALLED', 'CHECKED_IN', 'IN_PROGRESS'])
const COMPLETED_STATUSES = new Set(['CHECKED_OUT', 'COMPLETED', 'DONE', 'FINISHED'])

const normalizeStatus = (status?: string) => (status || '').toUpperCase()

const getQueueNumber = (ticket?: MonitorQueueTicket): number | null => {
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

export const getQueueLabel = (ticket?: MonitorQueueTicket) => {
  if (!ticket) return '-'

  if (typeof ticket.formattedQueueNumber === 'string' && ticket.formattedQueueNumber.trim()) {
    return ticket.formattedQueueNumber.trim()
  }

  const queueNumber = getQueueNumber(ticket)
  if (queueNumber === null) return '-'

  return queueNumber.toString().padStart(3, '0')
}

export const getPatientInitials = (name?: string | null) => {
  const normalized = name?.trim()
  if (!normalized) return '--'

  const parts = normalized.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

const getPoliName = (ticket: MonitorQueueTicket) =>
  ticket.poliName?.trim() || ticket.serviceUnit?.display?.trim() || 'Poli belum ditentukan'

const getDoctorName = (ticket: MonitorQueueTicket) =>
  ticket.practitioner?.name?.trim() ||
  ticket.practitioner?.fullName?.trim() ||
  ticket.practitioner?.display?.trim() ||
  ticket.doctorName?.trim() ||
  'Dokter belum ditentukan'

const getPractitionerId = (ticket?: MonitorQueueTicket) => {
  if (ticket?.practitionerId === null || ticket?.practitionerId === undefined) {
    return undefined
  }

  return String(ticket.practitionerId)
}

const compareTicketByNumber = (a: MonitorQueueTicket, b: MonitorQueueTicket) => {
  const aNumber = getQueueNumber(a)
  const bNumber = getQueueNumber(b)

  if (aNumber === null && bNumber === null) return getQueueLabel(a).localeCompare(getQueueLabel(b))
  if (aNumber === null) return 1
  if (bNumber === null) return -1

  return aNumber - bNumber
}

export const buildPublicQueueSummaries = (tickets: MonitorQueueTicket[]): PublicQueueSummary[] => {
  const grouped = new Map<string, MonitorQueueTicket[]>()

  tickets.forEach((ticket) => {
    const poli = getPoliName(ticket)
    const doctor = getDoctorName(ticket)
    const key = `${ticket.poliCodeId || poli}-${ticket.practitionerId || doctor}-${ticket.serviceUnitCodeId || ''}`

    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)?.push(ticket)
  })

  return Array.from(grouped.entries())
    .map(([key, ticketList]) => {
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

      const currentTicket = activeTickets.at(-1)
      const currentQueueNumber = getQueueNumber(currentTicket)
      const nextTicket =
        currentQueueNumber === null
          ? waitingTickets[0]
          : waitingTickets.find((ticket) => {
              const queueNumber = getQueueNumber(ticket)
              return queueNumber !== null && queueNumber > currentQueueNumber
            })

      const pivotNumber = currentQueueNumber ?? getQueueNumber(nextTicket)
      const handledCount =
        pivotNumber === null
          ? doneTickets.length
          : sortedTickets.filter((ticket) => {
              const queueNumber = getQueueNumber(ticket)
              if (queueNumber === null || queueNumber >= pivotNumber) return false

              return !WAITING_STATUSES.has(normalizeStatus(ticket.status))
            }).length

      return {
        key,
        poli: getPoliName(sortedTickets[0] as MonitorQueueTicket),
        doctor: getDoctorName(sortedTickets[0] as MonitorQueueTicket),
        practitionerId: getPractitionerId(sortedTickets[0]),
        currentQueueLabel: getQueueLabel(currentTicket),
        nextQueueLabel: nextTicket ? getQueueLabel(nextTicket) : undefined,
        patientInitials: getPatientInitials(currentTicket?.patient?.name),
        remainingCount: waitingTickets.length,
        handledCount,
        isActive: Boolean(currentTicket)
      }
    })
    .sort((a, b) => a.poli.localeCompare(b.poli) || a.doctor.localeCompare(b.doctor))
}

export const buildDoctorFilterOptions = (summaries: PublicQueueSummary[]): DoctorFilterOption[] => {
  const optionsMap = new Map<string, DoctorFilterOption>()

  summaries.forEach((summary) => {
    const value = summary.practitionerId || `name:${summary.doctor}`
    if (!optionsMap.has(value)) {
      optionsMap.set(value, {
        value,
        label: summary.practitionerId
          ? `${summary.doctor} (${summary.practitionerId})`
          : summary.doctor
      })
    }
  })

  return Array.from(optionsMap.values()).sort((a, b) => a.label.localeCompare(b.label))
}

export const getSelectedDoctorValue = (
  selectedDoctor: string | undefined,
  summaries: PublicQueueSummary[]
) => {
  if (selectedDoctor) return selectedDoctor

  const activeSummary = summaries.find((summary) => summary.isActive)
  if (activeSummary) {
    return activeSummary.practitionerId || `name:${activeSummary.doctor}`
  }

  const firstSummary = summaries[0]
  if (!firstSummary) return undefined

  return firstSummary.practitionerId || `name:${firstSummary.doctor}`
}
