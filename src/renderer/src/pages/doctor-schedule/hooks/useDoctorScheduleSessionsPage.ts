import type { MessageInstance } from 'antd/es/message/interface'
import type { FormInstance } from 'antd'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'
import { client } from '@renderer/utils/client'
import { defaultRegularSession } from '../doctor-schedule-form.constants'
import { ensureSuccess, ensureTimeRange, extractErrorMessage, normalizeTime } from '../doctor-schedule-form.utils'
import type {
  ApiSuccessResponse,
  DoctorScheduleSessionDetail,
  DoctorScheduleSessionsFormValues
} from '../doctor-schedule-form.types'

interface UseDoctorScheduleSessionsPageProps {
  form: FormInstance<DoctorScheduleSessionsFormValues>
  scheduleId: number
  message: MessageInstance
}

export function useDoctorScheduleSessionsPage({
  form,
  scheduleId,
  message
}: UseDoctorScheduleSessionsPageProps) {
  const sessionsQuery = client.registration.getScheduleSessions.useQuery(
    { scheduleId },
    {
      queryKey: ['doctorScheduleEditor', 'sessions', scheduleId]
    } as any
  )

  const saveSessionsMutation = client.registration.saveScheduleSessions.useMutation()
  const response = sessionsQuery.data as ApiSuccessResponse<DoctorScheduleSessionDetail[]> | undefined

  useEffect(() => {
    const sessions = response?.result ?? []
    form.setFieldsValue({
      sessions:
        sessions.length > 0
          ? [...sessions]
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.sessionNumber - b.sessionNumber)
              .map((session) => ({
                id: Number(session.id),
                dayOfWeek: Number(session.dayOfWeek),
                sessionNumber: Number(session.sessionNumber),
                startTime: normalizeTime(session.startTime),
                endTime: normalizeTime(session.endTime),
                quota: session.quota ?? undefined,
                isActive: session.isActive
              }))
          : [defaultRegularSession()]
    })
  }, [form, response?.result])

  const onFinish = async (values: DoctorScheduleSessionsFormValues) => {
    try {
      const sessions = (values.sessions ?? []).map((session, index) => {
        ensureTimeRange(session.startTime, session.endTime, `pada sesi reguler #${index + 1}`)
        return {
          dayOfWeek: Number(session.dayOfWeek),
          sessionNumber: Number(session.sessionNumber),
          startTime: session.startTime,
          endTime: session.endTime,
          quota: typeof session.quota === 'number' ? Number(session.quota) : null,
          isActive: session.isActive !== false
        }
      })

      if (sessions.length === 0) {
        throw new Error('Minimal harus ada satu sesi praktik')
      }

      await ensureSuccess(
        await saveSessionsMutation.mutateAsync({ scheduleId, sessions }),
        'Gagal menyimpan sesi praktik'
      )

      await queryClient.invalidateQueries({ queryKey: ['doctorScheduleEditor', 'sessions', scheduleId] })
      message.success('Sesi praktik berhasil disimpan')
    } catch (error) {
      message.error(extractErrorMessage(error, 'Terjadi kesalahan saat menyimpan sesi praktik'))
    }
  }

  return {
    onFinish,
    isLoading: sessionsQuery.isPending,
    isSubmitting: saveSessionsMutation.isPending
  }
}
