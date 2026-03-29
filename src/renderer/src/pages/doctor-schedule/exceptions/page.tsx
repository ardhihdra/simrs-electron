import { App, Form } from 'antd'
import { useNavigate, useOutletContext } from 'react-router'
import { DoctorScheduleExceptionsCard } from '../components/form/DoctorScheduleExceptionsCard'
import { DoctorScheduleFormActions } from '../components/form/DoctorScheduleFormActions'
import type { DoctorScheduleEditorOutletContext, DoctorScheduleExceptionsFormValues } from '../doctor-schedule-form.types'
import { useDoctorScheduleExceptionsPage } from '../hooks/useDoctorScheduleExceptionsPage'

export default function DoctorScheduleExceptionsPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<DoctorScheduleExceptionsFormValues>()
  const { scheduleId } = useOutletContext<DoctorScheduleEditorOutletContext>()

  const exceptionsPage = useDoctorScheduleExceptionsPage({
    form,
    scheduleId,
    message
  })

  return (
    <Form form={form} layout="vertical" onFinish={exceptionsPage.onFinish} initialValues={{ exceptions: [] }}>
      <DoctorScheduleExceptionsCard form={form} isEdit />
      <DoctorScheduleFormActions
        isEdit
        isLoading={exceptionsPage.isSubmitting}
        currentSection="exceptions"
        onCancel={() => navigate('/dashboard/registration/doctor-schedule')}
      />
    </Form>
  )
}
