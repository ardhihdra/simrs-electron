import { Button, Space } from 'antd'
import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import type { DoctorScheduleRow } from './types'
import type { DoctorScheduleFormSection } from '../../doctor-schedule-form.types'
import { buildDoctorScheduleEditorPath } from '../../doctor-schedule-form.utils'

export function DoctorScheduleRowActions({ record }: { record: DoctorScheduleRow }) {
  const navigate = useNavigate()
  const scheduleId = record.id
  const canNavigate = typeof scheduleId === 'number' && scheduleId > 0
  const goToSection = (section: DoctorScheduleFormSection) => {
    if (!canNavigate) return
    navigate(buildDoctorScheduleEditorPath(scheduleId, section))
  }

  return (
    <Space size={6} wrap className="justify-center">
      <Button
        type="default"
        icon={<EyeOutlined />}
        size="small"
        onClick={() => goToSection('info')}
        title="Detail Jadwal"
      >
        Detail
      </Button>
      <Button
        type="default"
        icon={<AppstoreOutlined />}
        size="small"
        onClick={() => goToSection('quota')}
        title="Atur Quota Registrasi"
      >
        Quota
      </Button>
      <Button
        type="primary"
        icon={<ClockCircleOutlined />}
        size="small"
        onClick={() => goToSection('sessions')}
        title="Atur Sesi Praktik"
      >
        Sesi
      </Button>
      <Button
        type="default"
        icon={<CalendarOutlined />}
        size="small"
        onClick={() => goToSection('exceptions')}
        title="Atur Libur dan Exception"
      >
        Libur
      </Button>
    </Space>
  )
}
