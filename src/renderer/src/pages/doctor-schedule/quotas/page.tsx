import { App, Form } from 'antd'
import { useNavigate, useOutletContext } from 'react-router'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import { DoctorScheduleFormActions } from '../components/form/DoctorScheduleFormActions'
import { DoctorScheduleRegistrationQuotaCard } from '../components/form/DoctorScheduleRegistrationQuotaCard'
import { EMPTY_REGISTRATION_QUOTA } from '../doctor-schedule-form.constants'
import type { DoctorScheduleEditorOutletContext, DoctorScheduleQuotasFormValues } from '../doctor-schedule-form.types'
import { useDoctorScheduleQuotasPage } from '../hooks/useDoctorScheduleQuotasPage'

export default function DoctorScheduleQuotasPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<DoctorScheduleQuotasFormValues>()
  const { scheduleId, summary } = useOutletContext<DoctorScheduleEditorOutletContext>()

  const quotasPage = useDoctorScheduleQuotasPage({
    form,
    scheduleId,
    doctorId: summary.doctorId,
    message
  })

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={quotasPage.onFinish}
      onFinishFailed={(errorInfo) =>
        notifyFormValidationError(form, message, errorInfo, 'Lengkapi quota registrasi terlebih dahulu.')
      }
      initialValues={{ registrationQuota: EMPTY_REGISTRATION_QUOTA }}
    >
      <DoctorScheduleRegistrationQuotaCard />
      <DoctorScheduleFormActions
        isEdit
        isLoading={quotasPage.isSubmitting}
        currentSection="quota"
        onCancel={() => navigate('/dashboard/registration/doctor-schedule')}
      />
    </Form>
  )
}
