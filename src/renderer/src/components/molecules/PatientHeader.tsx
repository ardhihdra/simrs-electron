import { Card, Descriptions, Tag, Space, Button } from 'antd'
import { UserOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { PatientWithMedicalRecord } from '../../types/doctor.types'

interface PatientHeaderProps {
  patientData: PatientWithMedicalRecord
  onBack?: () => void
}

export const PatientHeader = ({ patientData, onBack }: PatientHeaderProps) => {
  const { patient, nurseRecord } = patientData

  // Calculate Age
  const age = dayjs().diff(dayjs(patient.birthDate), 'year')

  return (
    <Card size="small" className="mb-4 bg-blue-50/30 border-blue-100">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Space align="start" size="large">
            <div className="text-center min-w-[80px]">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 text-blue-600">
                <UserOutlined style={{ fontSize: '24px' }} />
              </div>
              <Tag color="blue" className="mr-0">
                {patient.medicalRecordNumber}
              </Tag>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 m-0 mb-1">{patient.name}</h2>
              <Space className="text-gray-500 text-sm mb-2">
                <span>
                  <CalendarOutlined /> {dayjs(patient.birthDate).format('DD MMM YYYY')} ({age} Th)
                </span>
                <span>•</span>
                <span>{patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
              </Space>

              <Descriptions size="small" column={2} className="mt-2">
                <Descriptions.Item label="Penjamin">
                  <Tag color="green">{patientData.paymentMethod || 'Umum'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Alergi">
                  {nurseRecord?.anamnesis.allergies ? (
                    <Tag color="red">{nurseRecord.anamnesis.allergies}</Tag>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Space>
        </div>

        {onBack && <Button onClick={onBack}>Kembali ke Daftar</Button>}
      </div>
    </Card>
  )
}
