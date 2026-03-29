import { ArrowLeftOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Card, Tag } from 'antd'
import { DOCTOR_SCHEDULE_SECTION_OPTIONS } from '../../doctor-schedule-form.constants'
import type { DoctorScheduleFormSection } from '../../doctor-schedule-form.types'

interface DoctorScheduleFormHeaderProps {
  isEdit: boolean
  currentSection: DoctorScheduleFormSection
  onBack: () => void
}

export function DoctorScheduleFormHeader({
  isEdit,
  currentSection,
  onBack
}: DoctorScheduleFormHeaderProps) {
  const activeSection =
    DOCTOR_SCHEDULE_SECTION_OPTIONS.find((section) => section.value === currentSection) ??
    DOCTOR_SCHEDULE_SECTION_OPTIONS[0]

  return (
    <Card bodyStyle={{ padding: '20px 24px' }} className="border-none">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={onBack}
              className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowLeftOutlined />
              <span>Jadwal Praktek Dokter</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold mb-0">{isEdit ? 'Edit Jadwal Dokter' : 'Tambah Jadwal Dokter'}</h1>
          <p className="text-sm text-gray-400 m-0">
            {isEdit
              ? activeSection.description
              : 'Lengkapi informasi jadwal, lalu atur quota, sesi, dan exception sesuai kebutuhan.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Tag
            color={isEdit ? 'blue' : 'green'}
            icon={isEdit ? <CalendarOutlined /> : <CheckCircleOutlined />}
            className="px-3 py-1 text-sm m-0"
          >
            {isEdit ? 'Mode Edit' : 'Jadwal Baru'}
          </Tag>
          <Tag color="purple" className="px-3 py-1 text-sm m-0">
            {activeSection.label}
          </Tag>
        </div>
      </div>
    </Card>
  )
}
