import { App, Form } from 'antd'
import dayjs from 'dayjs'
import { useNavigate, useOutletContext, useParams } from 'react-router'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { DoctorScheduleBasicInfoCard } from '../components/form/DoctorScheduleBasicInfoCard'
import { DoctorScheduleFormActions } from '../components/form/DoctorScheduleFormActions'
import { DoctorScheduleFormHeader } from '../components/form/DoctorScheduleFormHeader'
import { DoctorSchedulePeriodCard } from '../components/form/DoctorSchedulePeriodCard'
import type { DoctorScheduleEditorOutletContext, DoctorScheduleInfoFormValues } from '../doctor-schedule-form.types'
import { useDoctorScheduleInfoPage } from '../hooks/useDoctorScheduleInfoPage'

interface DoctorScheduleInfoPageProps {
  mode?: 'create' | 'edit'
}

function DoctorScheduleInfoPage({ mode = 'edit' }: DoctorScheduleInfoPageProps) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const params = useParams()
  const [form] = Form.useForm<DoctorScheduleInfoFormValues>()
  const session = useModuleScopeStore((state) => state.session)
  const outletContext = mode === 'edit' ? useOutletContext<DoctorScheduleEditorOutletContext>() : undefined
  const scheduleId = mode === 'edit' ? outletContext?.scheduleId : undefined

  const infoPage = useDoctorScheduleInfoPage({
    form,
    id: scheduleId ?? (params.id ? Number(params.id) : undefined),
    session,
    message,
    navigate
  })

  const content = (
    <Form
      form={form}
      layout="vertical"
      onFinish={infoPage.onFinish}
      initialValues={{
        berlakuDari: dayjs(),
        idLokasiKerja: session?.lokasiKerjaId ? Number(session.lokasiKerjaId) : undefined,
        status: 'active'
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DoctorScheduleBasicInfoCard
          doctorOptions={infoPage.doctorOptions}
          doctorLoading={infoPage.doctorLoading}
          doctorIsError={infoPage.doctorIsError}
          poliOptions={infoPage.poliOptions}
          poliLoading={infoPage.poliLoading}
          poliIsError={infoPage.poliIsError}
          selectedDoctorId={infoPage.selectedDoctorId}
          contractOptions={infoPage.contractOptions}
          hasSessionLokasiKerja={Boolean(session?.lokasiKerjaId)}
          locationKerjaDisplayValue={infoPage.locationKerjaDisplayValue}
        />

        <DoctorSchedulePeriodCard />
      </div>

      <DoctorScheduleFormActions
        isEdit={mode === 'edit'}
        isLoading={infoPage.isSubmitting}
        currentSection="info"
        onCancel={() => navigate('/dashboard/registration/doctor-schedule')}
      />
    </Form>
  )

  if (mode === 'create') {
    return (
      <div className="flex flex-col gap-4 h-full">
        <DoctorScheduleFormHeader
          isEdit={false}
          currentSection="info"
          onBack={() => navigate('/dashboard/registration/doctor-schedule')}
        />
        {content}
      </div>
    )
  }

  return content
}

export default DoctorScheduleInfoPage
