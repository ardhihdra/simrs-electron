import { useState, useEffect } from 'react'
import { Button, App, Spin, Layout, Menu, theme } from 'antd'
import {
  ArrowLeftOutlined,
  MonitorOutlined,
  SolutionOutlined,
  FormOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { PatientQueue } from '../../types/nurse.types'
import { PatientStatus } from '../../types/nurse.types'
import { PatientInfoCard } from '../../components/molecules/PatientInfoCard'
import { InitialAssessmentForm } from '../../components/organisms/Assessment/InitialAssessmentForm'
import { GeneralSOAPForm } from '@renderer/components/organisms/GeneralSOAPForm'
import { VitalSignsMonitoringForm } from '../../components/organisms/VitalSignsMonitoringForm'

const MedicalRecordForm = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientQueue | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('overview')
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  useEffect(() => {
    loadPatientData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId])

  const loadPatientData = async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const fn = window.api?.query?.encounter?.getById
      if (!fn) throw new Error('API encounter tidak tersedia')

      const response = await fn({ id: encounterId })

      if (response.success && response.data) {
        const enc = response.data as any
        const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
        const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0

        const mappedData: PatientQueue = {
          id: enc.id,
          encounterId: enc.id,
          queueNumber: enc.queueTicket?.queueNumber || 0,
          patient: {
            id: enc.patient?.id || '',
            name: enc.patient?.name || 'Unknown',
            medicalRecordNumber: enc.patient?.medicalRecordNumber || '',
            gender: (enc.patient?.gender === 'male' ? 'MALE' : 'FEMALE') as any,
            birthDate: enc.patient?.birthDate || '',
            age: age,
            phone: '',
            address: '',
            identityNumber: enc.patient?.nik || ''
          },
          poli: {
            id: enc.queueTicket?.poli?.id?.toString() || '1',
            code: 'POL',
            name: enc.queueTicket?.poli?.name || enc.serviceUnitCodeId || '-'
          },
          doctor: {
            id: enc.queueTicket?.practitioner?.id?.toString() || 'doc1',
            name: enc.queueTicket?.practitioner?.namaLengkap || 'Dr. Umum',
            specialization: 'General',
            sipNumber: enc.queueTicket?.practitioner?.nik || '-'
          },
          status: PatientStatus.EXAMINING,
          registrationDate:
            enc.startTime || enc.createdAt || enc.visitDate || new Date().toISOString()
        }

        setPatientData(mappedData)
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/nurse-calling')
      }
    } catch (error) {
      message.error('Gagal memuat data pasien')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (!patientData || !encounterId) return null

    switch (selectedKey) {
      case 'overview':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Ringkasan Pasien</h2>
            <p className="text-gray-600">
              Informasi ringkasan dan timeline pasien akan ditampilkan di sini.
            </p>
          </div>
        )
      case 'initial-assessment':
        return (
          <InitialAssessmentForm
            encounterId={encounterId}
            patientData={patientData}
            mode="outpatient"
            role="nurse"
          />
        )
      case 'monitoring-ttv':
        return <VitalSignsMonitoringForm encounterId={encounterId} patientData={patientData} />
      case 'general-soap':
        return (
          <GeneralSOAPForm
            encounterId={encounterId}
            patientData={patientData}
            showTTVSection={false}
            allowedRoles={['nurse']}
          />
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (!patientData || !encounterId) {
    return null
  }

  return (
    <div className="p-4">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/dashboard/nurse-calling')}
        className="mb-4"
      >
        Kembali ke Antrian
      </Button>

      <div className="mb-4">
        <PatientInfoCard
          patientData={{
            ...patientData,
            visitDate: patientData.registrationDate,
            status: String(patientData.status)
          }}
        />
      </div>

      <Layout className="rounded-lg overflow-hidden h-full border border-gray-200">
        <Layout.Sider
          width={260}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="light"
          className="border-r border-gray-200"
          trigger={
            <div className="bg-white border-t border-gray-200">
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          }
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              {collapsed ? (
                <MedicineBoxOutlined className="text-blue-600 text-xl" />
              ) : (
                <div className="font-bold text-gray-700 flex items-center gap-2">
                  <MedicineBoxOutlined className="text-blue-600" />
                  Perawat
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                onClick={({ key }) => setSelectedKey(key)}
                style={{ borderRight: 0 }}
                items={[
                  {
                    key: 'overview',
                    icon: <MonitorOutlined />,
                    label: 'Ringkasan Pasien'
                  },
                  {
                    key: 'initial-assessment',
                    icon: <SolutionOutlined />,
                    label: 'Asesmen Awal'
                  },
                  {
                    key: 'monitoring-ttv',
                    icon: <MonitorOutlined />,
                    label: 'Monitoring TTV'
                  },
                  {
                    key: 'general-soap',
                    icon: <FormOutlined />,
                    label: 'SOAP Umum'
                  }
                ]}
              />
            </div>
          </div>
        </Layout.Sider>

        <Layout.Content
          style={{
            background: colorBgContainer,
            minHeight: '600px'
          }}
          className="overflow-y-auto"
        >
          {renderContent()}
        </Layout.Content>
      </Layout>
    </div>
  )
}

export default MedicalRecordForm
