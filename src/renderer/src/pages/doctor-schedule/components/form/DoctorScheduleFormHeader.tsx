import { ArrowLeftOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Card, Tag } from 'antd'

interface DoctorScheduleFormHeaderProps {
  isEdit: boolean
  onBack: () => void
}

export function DoctorScheduleFormHeader({
  isEdit,
  onBack
}: DoctorScheduleFormHeaderProps) {
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
              ? 'Perbarui data master, sesi praktik, dan exception jadwal dokter'
              : 'Isi formulir berikut untuk mendaftarkan jadwal dokter beserta sesi praktiknya'}
          </p>
        </div>
        <Tag
          color={isEdit ? 'blue' : 'green'}
          icon={isEdit ? <CalendarOutlined /> : <CheckCircleOutlined />}
          className="px-3 py-1 text-sm m-0"
        >
          {isEdit ? 'Mode Edit' : 'Jadwal Baru'}
        </Tag>
      </div>
    </Card>
  )
}
