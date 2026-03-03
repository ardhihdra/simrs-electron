import { Card, Tag, Button } from 'antd'
import { EditOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

interface PatientInfoCardProps {
  patientData: {
    patient: {
      medicalRecordNumber: string
      name: string
      gender: string
      age: number
      identityNumber?: string
    }
    poli?: {
      name: string
    }
    doctor?: {
      name: string
    }
    visitDate?: string
    paymentMethod?: string
    status?: string
    allergies?: string
  }
  onEditStatus?: () => void
}

export const PatientInfoCard = ({ patientData, onEditStatus }: PatientInfoCardProps) => {
  const { patient, poli, doctor, visitDate, paymentMethod, status, allergies } = patientData

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'arrived':
      case 'examining':
      case 'in_progress':
        return 'warning' // orange for in-progress
      case 'planned':
        return 'processing' // blue for planned
      case 'finished':
        return 'success' // green for finished
      case 'cancelled':
        return 'error' // red for cancelled
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'arrived':
        return 'Menunggu'
      case 'examining':
      case 'in_progress':
        return 'Sedang Diperiksa'
      case 'planned':
        return 'Menunggu'
      case 'finished':
        return 'Selesai'
      case 'cancelled':
        return 'Dibatalkan'
      default:
        return status ? status.toUpperCase() : 'UNKNOWN'
    }
  }

  return (
    <Card bodyStyle={{ padding: '24px' }} className="border-none rounded-xl bg-white">
      <div className="flex flex-col gap-6">
        {/* Header Section: Name, RM, Status */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <UserOutlined className="text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1 text-gray-800 tracking-tight">
                {patient.name || 'Unknown'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-xs text-gray-600 font-medium">
                  RM: {patient.medicalRecordNumber || '-'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="font-medium text-gray-600">
                  {patient.gender === 'MALE' || patient.gender === 'male'
                    ? 'Laki-laki'
                    : 'Perempuan'}
                  , {patient.age} th
                </span>
              </div>
            </div>
          </div>

          {status && (
            <div className="flex flex-col items-end gap-2">
              <Tag
                color={getStatusColor(status)}
                bordered={false}
                className="m-0 font-bold px-3 py-1 text-xs rounded-md uppercase tracking-wider"
              >
                {getStatusLabel(status)}
              </Tag>
              {onEditStatus && (
                <Button
                  type="link"
                  size="small"
                  onClick={onEditStatus}
                  icon={<EditOutlined />}
                  className="text-xs p-0 m-0 h-auto text-gray-400 hover:text-blue-600 transition-colors"
                >
                  Ubah Status
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 w-full rounded" />

        {/* Info Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              Poliklinik / Unit
            </div>
            <div className="text-sm font-semibold text-gray-800">{poli?.name || '-'}</div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              Dokter Pemeriksa
            </div>
            <div className="text-sm font-semibold text-gray-800">{doctor?.name || '-'}</div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              Tgl Kunjungan
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {visitDate ? dayjs(visitDate).format('DD MMM YYYY, HH:mm') : '-'}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              Penjamin
            </div>
            <Tag
              color="cyan"
              bordered={false}
              className="m-0 font-semibold rounded-md text-xs px-2.5"
            >
              {paymentMethod || 'Umum'}
            </Tag>
          </div>
        </div>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4 pt-2">
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Nomor Induk Kependudukan (NIK)
            </div>
            <div className="text-sm font-semibold text-gray-800 font-mono">
              {patient.identityNumber || '-'}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Riwayat Alergi
            </div>
            <div>
              {allergies && allergies !== '-' ? (
                <Tag
                  color="error"
                  bordered={false}
                  className="m-0 font-medium rounded-md whitespace-normal wrap-break-word py-1 px-3 text-sm leading-relaxed"
                >
                  {allergies}
                </Tag>
              ) : (
                <span className="text-xs text-gray-400 italic bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100 inline-block">
                  Aman, tidak ada catatan alergi
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
