import type { MessageInstance } from 'antd/es/message/interface'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'
import { client } from '@renderer/utils/client'
import { ensureSuccess, ensureTimeRange, extractErrorMessage, normalizeTime } from '../doctor-schedule-form.utils'
import type {
  ApiSuccessResponse,
  DoctorScheduleExceptionDetail,
  DoctorScheduleExceptionsFormValues
} from '../doctor-schedule-form.types'

interface UseDoctorScheduleExceptionsPageProps {
  form: FormInstance<DoctorScheduleExceptionsFormValues>
  scheduleId: number
  message: MessageInstance
}

export function useDoctorScheduleExceptionsPage({
  form,
  scheduleId,
  message
}: UseDoctorScheduleExceptionsPageProps) {
  const exceptionsQuery = client.registration.getScheduleExceptions.useQuery(
    { scheduleId },
    {
      queryKey: ['doctorScheduleEditor', 'exceptions', scheduleId]
    } as any
  )

  const saveExceptionsMutation = client.registration.saveScheduleExceptions.useMutation()
  const response = exceptionsQuery.data as ApiSuccessResponse<DoctorScheduleExceptionDetail[]> | undefined

  useEffect(() => {
    const exceptions = response?.result ?? []
    form.setFieldsValue({
      exceptions: exceptions.map((exception) => ({
        id: Number(exception.id),
        date: dayjs(exception.date),
        type: exception.type,
        mode: exception.mode,
        description: exception.description ?? undefined,
        isActive: exception.isActive,
        sessions: (exception.sessions ?? []).map((session) => ({
          id: Number(session.id),
          sessionNumber: Number(session.sessionNumber),
          startTime: normalizeTime(session.startTime),
          endTime: normalizeTime(session.endTime),
          quota: session.quota ?? undefined,
          isActive: session.isActive
        }))
      }))
    })
  }, [form, response?.result])

  const onFinish = async (values: DoctorScheduleExceptionsFormValues) => {
    try {
      const exceptions = (values.exceptions ?? []).map((exception, index) => {
        const sessions =
          exception.mode === 'partial_session'
            ? (exception.sessions ?? []).map((session, sessionIndex) => {
                ensureTimeRange(
                  session.startTime,
                  session.endTime,
                  `pada sesi exception #${index + 1}.${sessionIndex + 1}`
                )

                return {
                  sessionNumber: Number(session.sessionNumber),
                  startTime: session.startTime,
                  endTime: session.endTime,
                  quota: typeof session.quota === 'number' ? Number(session.quota) : null,
                  isActive: session.isActive !== false
                }
              })
            : []

        if (exception.mode === 'partial_session' && sessions.length === 0) {
          throw new Error(`Exception #${index + 1} dengan mode partial session harus punya sesi override`)
        }

        return {
          date: exception.date.format('YYYY-MM-DD'),
          type: exception.type,
          mode: exception.mode,
          description: exception.description?.trim() || undefined,
          isActive: exception.isActive !== false,
          sessions
        }
      })

      await ensureSuccess(
        await saveExceptionsMutation.mutateAsync({
          scheduleId,
          exceptions
        }),
        'Gagal menyimpan exception jadwal'
      )

      await queryClient.invalidateQueries({ queryKey: ['doctorScheduleEditor', 'exceptions', scheduleId] })
      message.success('Libur dan exception berhasil disimpan')
    } catch (error) {
      message.error(extractErrorMessage(error, 'Terjadi kesalahan saat menyimpan exception jadwal'))
    }
  }

  return {
    onFinish,
    isLoading: exceptionsQuery.isPending,
    isSubmitting: saveExceptionsMutation.isPending
  }
}
