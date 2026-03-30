import dayjs from 'dayjs'

export const formatDoctorScheduleDate = (value?: string | null) => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD MMM YYYY') : value
}
