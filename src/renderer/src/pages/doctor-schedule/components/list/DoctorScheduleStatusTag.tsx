import { Tag } from 'antd'

export function DoctorScheduleStatusTag({
  status
}: {
  status: 'active' | 'inactive'
}) {
  return <Tag color={status === 'active' ? 'green' : 'default'}>{status === 'active' ? 'Aktif' : 'Tidak Aktif'}</Tag>
}
