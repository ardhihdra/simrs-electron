import { Button, Card, Result, Spin, Tag } from 'antd'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router'
import { DoctorScheduleFormHeader } from '../form/DoctorScheduleFormHeader'
import { DoctorScheduleSectionNavigation } from '../form/DoctorScheduleSectionNavigation'
import type { DoctorScheduleEditorOutletContext } from '../../doctor-schedule-form.types'
import { normalizeDoctorScheduleRouteSection } from '../../doctor-schedule-form.utils'
import { useDoctorScheduleSummary } from '../../hooks/useDoctorScheduleSummary'

export function DoctorScheduleEditorShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const scheduleId = Number(params.id)
  const currentSection = useMemo(
    () => normalizeDoctorScheduleRouteSection(location.pathname.split('/').at(-1)),
    [location.pathname]
  )

  const { summary, isLoading, isError, refetch } = useDoctorScheduleSummary(scheduleId)

  if (!Number.isFinite(scheduleId) || scheduleId <= 0) {
    return (
      <Result
        status="warning"
        title="ID jadwal dokter tidak valid"
        extra={
          <Button onClick={() => navigate('/dashboard/registration/doctor-schedule')}>
            Kembali ke daftar
          </Button>
        }
      />
    )
  }

  if (isLoading) {
    return (
      <Card className="border-none">
        <div className="min-h-[320px] flex items-center justify-center">
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  if (isError || !summary) {
    return (
      <Result
        status="error"
        title="Gagal memuat editor jadwal dokter"
        extra={[
          <Button key="back" onClick={() => navigate('/dashboard/registration/doctor-schedule')}>
            Kembali
          </Button>,
          <Button key="retry" type="primary" onClick={() => void refetch()}>
            Muat Ulang
          </Button>
        ]}
      />
    )
  }

  const outletContext: DoctorScheduleEditorOutletContext = {
    scheduleId,
    summary
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <DoctorScheduleFormHeader
        isEdit
        currentSection={currentSection}
        onBack={() => navigate('/dashboard/registration/doctor-schedule')}
      />

      <Card bodyStyle={{ padding: '16px 20px' }} className="border-none">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Tag color="blue" className="m-0 px-3 py-1">
            {summary.scheduleName?.trim() || `Jadwal #${summary.id}`}
          </Tag>
          <span className="text-gray-600">Dokter: {summary.doctorName || '-'}</span>
          <span className="text-gray-600">Poli: {summary.poliName || '-'}</span>
          <span className="text-gray-600">Kategori: {summary.category || '-'}</span>
          <span className="text-gray-600">Status: {summary.status}</span>
        </div>
      </Card>

      <DoctorScheduleSectionNavigation
        currentSection={currentSection}
        onSectionChange={(section) =>
          navigate(`/dashboard/registration/doctor-schedule/${scheduleId}/${section === 'quota' ? 'quotas' : section}`)
        }
      />

      <Outlet context={outletContext} />
    </div>
  )
}
