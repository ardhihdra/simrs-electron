import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Card } from 'antd'
import { DOCTOR_SCHEDULE_SECTION_OPTIONS } from '../../doctor-schedule-form.constants'
import type { DoctorScheduleFormSection } from '../../doctor-schedule-form.types'

interface DoctorScheduleFormActionsProps {
  isEdit: boolean
  isLoading: boolean
  currentSection: DoctorScheduleFormSection
  onCancel: () => void
}

export function DoctorScheduleFormActions({
  isEdit,
  isLoading,
  currentSection,
  onCancel
}: DoctorScheduleFormActionsProps) {
  const activeSection =
    DOCTOR_SCHEDULE_SECTION_OPTIONS.find((section) => section.value === currentSection) ??
    DOCTOR_SCHEDULE_SECTION_OPTIONS[0]

  return (
    <Card bodyStyle={{ padding: '16px 24px' }} className="border-none mt-4">
      <div className="flex items-center justify-end gap-3">
        <Button size="large" onClick={onCancel} icon={<ArrowLeftOutlined />}>
          Batal
        </Button>
        <Button type="primary" size="large" htmlType="submit" loading={isLoading} icon={<SaveOutlined />}>
          {isEdit ? `Simpan ${activeSection.shortLabel}` : 'Simpan Jadwal'}
        </Button>
      </div>
    </Card>
  )
}
