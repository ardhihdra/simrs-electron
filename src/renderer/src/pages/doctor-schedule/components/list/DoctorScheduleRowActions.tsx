import { Button } from 'antd'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import type { DoctorScheduleRow } from './types'

export function DoctorScheduleRowActions({ record }: { record: DoctorScheduleRow }) {
  const navigate = useNavigate()
  const scheduleId = Number(record.id)
  const canNavigate = Number.isFinite(scheduleId) && scheduleId > 0

  return (
    <div className="flex gap-2 justify-center">
      <Button
        type="default"
        icon={<EyeOutlined />}
        size="small"
        onClick={() => {
          if (canNavigate) {
            navigate(`/dashboard/registration/doctor-schedule/edit/${scheduleId}`)
          }
        }}
        title="Lihat Detail"
      />
      <Button
        type="primary"
        icon={<EditOutlined />}
        size="small"
        onClick={() => {
          if (canNavigate) {
            navigate(`/dashboard/registration/doctor-schedule/edit/${scheduleId}`)
          }
        }}
        title="Edit"
      />
    </div>
  )
}
