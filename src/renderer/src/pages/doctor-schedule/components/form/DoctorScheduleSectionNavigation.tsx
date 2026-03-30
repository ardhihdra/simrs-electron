import { Card } from 'antd'
import {
  DOCTOR_SCHEDULE_SECTION_OPTIONS
} from '../../doctor-schedule-form.constants'
import type { DoctorScheduleFormSection } from '../../doctor-schedule-form.types'

interface DoctorScheduleSectionNavigationProps {
  currentSection: DoctorScheduleFormSection
  onSectionChange: (section: DoctorScheduleFormSection) => void
}

export function DoctorScheduleSectionNavigation({
  currentSection,
  onSectionChange
}: DoctorScheduleSectionNavigationProps) {
  return (
    <Card bodyStyle={{ padding: '16px 20px' }} className="border-none">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-sm font-medium text-gray-900">Area Pengaturan</div>
          <div className="text-sm text-gray-500">
            Pindah ke section yang ingin Anda kelola tanpa mencampur quota, sesi, dan libur dalam
            satu layar panjang.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {DOCTOR_SCHEDULE_SECTION_OPTIONS.map((section) => {
            const isActive = section.value === currentSection

            return (
              <button
                key={section.value}
                type="button"
                onClick={() => onSectionChange(section.value)}
                className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {section.shortLabel}
                </div>
                <div className="mt-1 text-base font-semibold text-gray-900">{section.label}</div>
                <div className="mt-2 text-sm text-gray-500">{section.description}</div>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
