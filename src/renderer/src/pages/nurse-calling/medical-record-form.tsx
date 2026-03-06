import { useState, useEffect, useCallback } from 'react'
import { App, Spin, Layout, Menu, theme } from 'antd'
import {
  MonitorOutlined,
  SolutionOutlined,
  FormOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { PatientQueue } from '@renderer/types/nurse.types'
import { PatientStatus } from '@renderer/types/nurse.types'
import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'
import { InitialAssessmentForm } from '@renderer/components/organisms/Assessment/InitialAssessment/InitialAssessmentForm'
import { GeneralSOAPForm } from '@renderer/components/organisms/Assessment/GeneralSOAP/GeneralSOAPForm'
import { VitalSignsMonitoringForm } from '@renderer/components/organisms/Assessment/VitalSignsMonitoring/VitalSignsMonitoringForm'
import { CPPTForm } from '@renderer/components/organisms/Assessment/CPPT/CPPTForm'
import { TriageForm } from '@renderer/components/organisms/Assessment/Triage/TriageForm'

const MedicalRecordForm = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientQueue | null>(null)
  const [encounterType, setEncounterType] = useState<string>('')
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('initial-assessment')
  const { token } = theme.useToken()

  const loadPatientData = useCallback(async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const fn = window.api?.query?.encounter?.read
      if (!fn) throw new Error('API encounter tidak tersedia')

      const response = await fn({ id: encounterId })

      if (response.success && response.result) {
        const enc = response.result as any
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
        setEncounterType(enc.encounterType || '')
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
  }, [encounterId, message, navigate])

  useEffect(() => {
    loadPatientData()
  }, [encounterId, loadPatientData])

  const renderContent = () => {
    if (!patientData || !encounterId) return null

    switch (selectedKey) {
      case 'patient-info':
        return <PatientInfoCard patientData={patientData} />
      case 'initial-assessment':
        return (
          <InitialAssessmentForm
            encounterId={encounterId}
            patientData={patientData as any}
            mode="outpatient"
            role="nurse"
          />
        )
      case 'triage':
        return <TriageForm encounterId={encounterId} patientData={patientData as any} />
      case 'monitoring-ttv':
        return <VitalSignsMonitoringForm encounterId={encounterId} patientData={patientData} />
      case 'general-soap':
        return (
          <GeneralSOAPForm
            encounterId={encounterId}
            patientData={patientData}
            showTTVSection={true}
            allowedRoles={['nurse']}
          />
        )
      case 'cppt':
        return <CPPTForm encounterId={encounterId} patientData={patientData} />
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
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 px-4 pb-4 overflow-hidden relative flex flex-col min-h-0">
        <Layout className="rounded-lg overflow-hidden h-full ">
          <Layout.Sider
            width={260}
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            theme="light"
            trigger={
              <div
                className="flex items-center justify-center h-12 cursor-pointer transition-colors"
                style={{
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  color: token.colorTextTertiary
                }}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            }
          >
            <div className="h-full flex flex-col">
              <div className={`p-4 ${collapsed ? 'text-center' : ''}`}>
                {collapsed ? (
                  <MedicineBoxOutlined className="text-xl" />
                ) : (
                  <div className="font-bold flex items-center gap-2">
                    <MedicineBoxOutlined />
                    Perawat
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <Menu
                  mode="inline"
                  defaultSelectedKeys={['initial-assessment']}
                  style={{ borderRight: 0 }}
                  items={[
                    {
                      key: 'patient-info',
                      icon: <UserOutlined />,
                      label: 'Informasi Pasien'
                    },
                    ...(encounterType === 'EMER'
                      ? [
                          {
                            key: 'triage',
                            icon: <AlertOutlined style={{ color: token.colorError }} />,
                            label: 'Data Triase'
                          }
                        ]
                      : []),
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
                    },
                    ...(patientData?.poli?.name?.includes('RAWAT_INAP') ||
                    patientData?.poli?.code === 'RAWAT_INAP'
                      ? [
                          {
                            key: 'cppt',
                            icon: <SolutionOutlined />,
                            label: 'Catatan Perkembangan (CPPT)'
                          }
                        ]
                      : [])
                  ]}
                  onSelect={({ key }) => setSelectedKey(key)}
                />
              </div>
            </div>
          </Layout.Sider>
          <Layout>
            <Layout.Content className="p-6 overflow-y-auto h-full">
              {renderContent()}
            </Layout.Content>
          </Layout>
        </Layout>
      </div>
    </div>
  )
}

export default MedicalRecordForm
