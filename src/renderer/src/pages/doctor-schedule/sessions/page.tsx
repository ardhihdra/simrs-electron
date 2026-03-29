import { App, Form } from 'antd'
import { useNavigate, useOutletContext } from 'react-router'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import { DoctorScheduleFormActions } from '../components/form/DoctorScheduleFormActions'
import { DoctorScheduleRegularSessionsCard } from '../components/form/DoctorScheduleRegularSessionsCard'
import type { DoctorScheduleEditorOutletContext, DoctorScheduleSessionsFormValues } from '../doctor-schedule-form.types'
import { useDoctorScheduleSessionsPage } from '../hooks/useDoctorScheduleSessionsPage'

export default function DoctorScheduleSessionsPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<DoctorScheduleSessionsFormValues>()
  const { scheduleId } = useOutletContext<DoctorScheduleEditorOutletContext>()

  const sessionsPage = useDoctorScheduleSessionsPage({
    form,
    scheduleId,
    message
  })

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={sessionsPage.onFinish}
      onFinishFailed={(errorInfo) =>
        notifyFormValidationError(form, message, errorInfo, 'Lengkapi sesi praktik terlebih dahulu.')
      }
      initialValues={{ sessions: [] }}
    >
      <DoctorScheduleRegularSessionsCard />
      <DoctorScheduleFormActions
        isEdit
        isLoading={sessionsPage.isSubmitting}
        currentSection="sessions"
        onCancel={() => navigate('/dashboard/registration/doctor-schedule')}
      />
    </Form>
  )
}
