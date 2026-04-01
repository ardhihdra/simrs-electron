import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MoreOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Button, Dropdown } from 'antd'
import { useNavigate } from 'react-router'
import type { DoctorScheduleFormSection } from '../../doctor-schedule-form.types'
import { buildDoctorScheduleEditorPath } from '../../doctor-schedule-form.utils'
import type { DoctorScheduleRow } from './types'

export function DoctorScheduleRowActions({ record }: { record: DoctorScheduleRow }) {
  const navigate = useNavigate()
  const scheduleId = record.id
  const canNavigate = typeof scheduleId === 'number' && scheduleId > 0
  const goToSection = (section: DoctorScheduleFormSection) => {
    if (!canNavigate) return
    navigate(buildDoctorScheduleEditorPath(scheduleId, section))
  }

  const items: MenuProps['items'] = [
    {
      key: 'info',
      label: 'Detail Jadwal',
      icon: <EyeOutlined />,
      onClick: () => goToSection('info')
    },
    {
      key: 'quota',
      label: 'Quota Registrasi',
      icon: <AppstoreOutlined />,
      onClick: () => goToSection('quota')
    },
    {
      key: 'sessions',
      label: 'Sesi Praktik',
      icon: <ClockCircleOutlined />,
      onClick: () => goToSection('sessions')
    },
    {
      key: 'exceptions',
      label: 'Libur dan Exception',
      icon: <CalendarOutlined />,
      onClick: () => goToSection('exceptions')
    }
  ]

  return (
    <div className="flex justify-center">
      <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
        <Button type="default" icon={<MoreOutlined />} size="small"></Button>
      </Dropdown>
    </div>
  )
}
