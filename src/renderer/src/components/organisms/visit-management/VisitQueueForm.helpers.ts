import dayjs, { type Dayjs } from 'dayjs'

type VisitQueueDoctorFilterValue = Dayjs | Date | string | null | undefined

type BuildDoctorQueryInputArgs = {
  visitDate?: VisitQueueDoctorFilterValue
  poliId?: number | string | null
  hour?: VisitQueueDoctorFilterValue
}

const toOptionalNumber = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const formatDateOnly = (value?: VisitQueueDoctorFilterValue) => {
  if (!value) return undefined

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined
}

const formatHour = (value?: VisitQueueDoctorFilterValue) => {
  if (!value) return undefined

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('HH:mm') : undefined
}

export const buildDoctorQueryInput = ({ visitDate, poliId, hour }: BuildDoctorQueryInputArgs) => {
  const input = {
    date: formatDateOnly(visitDate),
    poliId: toOptionalNumber(poliId),
    hour: formatHour(hour)
  }

  if (!input.hour) {
    return {
      date: input.date,
      poliId: input.poliId
    }
  }

  return input
}

export const buildDoctorSelectionResetKey = (args: BuildDoctorQueryInputArgs) =>
  JSON.stringify(buildDoctorQueryInput(args))
