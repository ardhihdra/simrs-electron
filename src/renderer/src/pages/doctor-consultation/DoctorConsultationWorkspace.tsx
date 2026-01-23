import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { App, Card, Tabs, Spin, Empty, Button } from 'antd'
import {
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SolutionOutlined
} from '@ant-design/icons'
import { PatientHeader } from '../../components/PatientHeader'
import { NurseAssessmentSummary } from '../../components/NurseAssessmentSummary'
import DiagnosisProceduresForm from '../doctor-procedures/diagnosis-procedures-form'
import { PrescriptionForm } from '../doctor-prescription/prescription-form'
import { getPatientMedicalRecord } from '../../services/doctor.service'
import { PatientWithMedicalRecord } from '../../types/doctor.types'

const DoctorConsultationWorkspace = () => {
  const { encounterId } = useParams<{ encounterId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState('1')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId])

  const loadData = async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const data = await getPatientMedicalRecord(encounterId)
      if (data) {
        setPatientData(data)
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/doctor-medical-records')
      }
    } catch (error) {
      message.error('Gagal memuat data medis pasien')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Memuat Rekam Medis..." />
      </div>
    )
  }

  if (!patientData) {
    return <Empty description="Data pasien tidak ditemukan" />
  }

  // Handle back to list
  const handleBack = () => {
    navigate('/dashboard/doctor-medical-records')
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      {/* Sticky Header with Back Button and Patient Info */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-2 flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            type="text"
            className="hover:bg-gray-100"
          />
          <div className="flex-1">
            <PatientHeader patientData={patientData} />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <Card className="shadow-sm rounded-lg" bordered={false}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size="large"
            className="doctor-emr-tabs"
            items={[
              {
                key: '1',
                label: (
                  <span>
                    <SolutionOutlined />
                    Pemeriksaan Awal
                  </span>
                ),
                children: (
                  <div className="p-4">
                    <NurseAssessmentSummary encounterId={encounterId || ''} />
                  </div>
                )
              },
              {
                key: '2',
                label: (
                  <span>
                    <FileTextOutlined />
                    Diagnosis & Tindakan (CPPT)
                  </span>
                ),
                children: (
                  <div className="p-4">
                    <DiagnosisProceduresForm
                      encounterId={encounterId || ''}
                      patientData={patientData}
                    />
                  </div>
                )
              },
              {
                key: '3',
                label: (
                  <span>
                    <MedicineBoxOutlined />
                    E-Resep
                  </span>
                ),
                children: (
                  <div className="p-4">
                    <PrescriptionForm encounterId={encounterId || ''} patientData={patientData} />
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>
    </div>
  )
}

export default DoctorConsultationWorkspace
