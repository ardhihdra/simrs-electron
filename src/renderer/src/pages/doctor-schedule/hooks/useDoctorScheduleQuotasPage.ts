import type { MessageInstance } from 'antd/es/message/interface'
import type { FormInstance } from 'antd'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'
import { client } from '@renderer/utils/client'
import { EMPTY_REGISTRATION_QUOTA, buildRegistrationQuotaKey, DAY_OPTIONS, REGISTRATION_QUOTA_FIELDS } from '../doctor-schedule-form.constants'
import { ensureSuccess, extractErrorMessage } from '../doctor-schedule-form.utils'
import type {
  ApiSuccessResponse,
  DoctorScheduleQuotasDto,
  DoctorScheduleQuotasFormValues
} from '../doctor-schedule-form.types'

interface UseDoctorScheduleQuotasPageProps {
  form: FormInstance<DoctorScheduleQuotasFormValues>
  scheduleId: number
  doctorId: number
  message: MessageInstance
}

export function useDoctorScheduleQuotasPage({
  form,
  scheduleId,
  doctorId,
  message
}: UseDoctorScheduleQuotasPageProps) {
  const quotasQuery = client.registration.getScheduleQuotas.useQuery(
    { scheduleId },
    {
      queryKey: ['doctorScheduleEditor', 'quotas', scheduleId]
    } as any
  )

  const saveQuotasMutation = client.registration.saveScheduleQuotas.useMutation()
  const response = quotasQuery.data as ApiSuccessResponse<DoctorScheduleQuotasDto> | undefined

  useEffect(() => {
    const values = response?.result?.values ?? []
    form.setFieldsValue({
      registrationQuota: {
        ...EMPTY_REGISTRATION_QUOTA,
        ...Object.fromEntries(
          values.map((value) => [
            buildRegistrationQuotaKey(value.hari, value.source, value.paymentMethod),
            value.quotaValue
          ])
        )
      }
    })
  }, [form, response?.result?.values])

  const onFinish = async (values: DoctorScheduleQuotasFormValues) => {
    try {
      const payloadValues = DAY_OPTIONS.flatMap((day) =>
        REGISTRATION_QUOTA_FIELDS.map((field) => {
          const rawValue = values.registrationQuota?.[
            buildRegistrationQuotaKey(day.value, field.source, field.paymentMethod)
          ]

          return {
            hari: day.value,
            source: field.source,
            paymentMethod: field.paymentMethod,
            quotaValue:
              typeof rawValue === 'number' && Number.isFinite(rawValue) ? Number(rawValue) : null
          }
        })
      )

      await ensureSuccess(
        await saveQuotasMutation.mutateAsync({
          scheduleId,
          doctorId,
          status: 'active',
          values: payloadValues
        }),
        'Gagal menyimpan quota registrasi'
      )

      await queryClient.invalidateQueries({ queryKey: ['doctorScheduleEditor', 'quotas', scheduleId] })
      message.success('Quota registrasi berhasil disimpan')
    } catch (error) {
      message.error(extractErrorMessage(error, 'Terjadi kesalahan saat menyimpan quota registrasi'))
    }
  }

  return {
    onFinish,
    isLoading: quotasQuery.isPending,
    isSubmitting: saveQuotasMutation.isPending
  }
}
