import { Card, Row, Col, Tag, Button } from 'antd'
import { EditOutlined } from '@ant-design/icons'
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
        return 'blue'
      case 'planned':
        return 'default'
      case 'finished':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Card className="mb-4 pb-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold m-0">Informasi Pasien</h3>
        {status && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Status:</span>
            <Tag color={getStatusColor(status)} className="mr-0">
              {status.toUpperCase()}
            </Tag>
            {onEditStatus && (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={onEditStatus}
                size="small"
                title="Ubah Status"
              />
            )}
          </div>
        )}
      </div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <div className="text-gray-500 text-sm">No. Rekam Medis</div>
          <div className="text-lg font-semibold">{patient.medicalRecordNumber || '-'}</div>
        </Col>
        <Col span={6}>
          <div className="text-gray-500 text-sm">Nama Pasien</div>
          <div className="text-lg font-semibold">{patient.name || 'Unknown'}</div>
        </Col>
        <Col span={6}>
          <div className="text-gray-500 text-sm">Jenis Kelamin / Umur</div>
          <div className="text-lg">
            {patient.gender === 'MALE' || patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'} /{' '}
            {patient.age} tahun
          </div>
        </Col>
        {visitDate && (
          <Col span={6}>
            <div className="text-gray-500 text-sm">Tanggal Kunjungan</div>
            <div className="text-lg">{dayjs(visitDate).format('DD MMM YYYY, HH:mm')}</div>
          </Col>
        )}
      </Row>
      <Row gutter={[16, 16]} className="mt-4">
        <Col span={6}>
          <div className="text-gray-500 text-sm">Poli</div>
          <div className="text-lg">{poli?.name || '-'}</div>
        </Col>
        <Col span={6}>
          <div className="text-gray-500 text-sm">Dokter</div>
          <div className="text-lg">{doctor?.name || '-'}</div>
        </Col>
        <Col span={6}>
          <div className="text-gray-500 text-sm">Penjamin</div>
          <Tag color="green" className="mt-1">
            {paymentMethod || 'Umum'}
          </Tag>
        </Col>
        <Col span={6}>
          <div className="text-gray-500 text-sm">Alergi</div>
          <div className="text-lg">
            {allergies && allergies !== '-' ? (
              <Tag color="red">{allergies}</Tag>
            ) : (
              <span className="text-gray-400">Tidak ada</span>
            )}
          </div>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="mt-4">
        <Col span={6}>
          <div className="text-gray-500 text-sm">NIK</div>
          <div className="text-lg">{patient.identityNumber || '-'}</div>
        </Col>
      </Row>
    </Card>
  )
}
