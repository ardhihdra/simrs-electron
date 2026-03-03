import {
  AlertOutlined,
  ExperimentOutlined,
  ExportOutlined,
  FormOutlined,
  MedicineBoxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MonitorOutlined,
  SolutionOutlined,
  UserOutlined
} from '@ant-design/icons'
import { AllergyForm } from '../../components/organisms/Assessment/Allergy/AllergyForm'
import { RiwayatPerjalananPenyakitForm } from '../../components/organisms/Assessment/RiwayatPerjalananPenyakitForm'
import { FamilyHistoryForm } from '../../components/organisms/Assessment/FamilyHistory/FamilyHistoryForm'
import { MedicationForm } from '../../components/organisms/Assessment/Medication/MedicationForm'
import { PainAssessmentForm } from '../../components/organisms/Assessment/PainAssessment/PainAssessmentForm'
import { FallRiskAssessmentForm } from '../../components/organisms/Assessment/FallRiskAssessment/FallRiskAssessmentForm'
import { DecubitusRiskAssessmentForm } from '../../components/organisms/DecubitusRiskAssessmentForm'
import { CoughScreeningForm } from '../../components/organisms/CoughScreeningForm'
import { PastDiseaseForm } from '../../components/organisms/Assessment/PastDisease/PastDiseaseForm'
import { PhysicalAssessmentForm } from '../../components/organisms/Assessment/PhysicalAssessment/PhysicalAssessmentForm'
import { ClinicalNoteForm } from '../../components/organisms/Assessment/ClinicalNote/ClinicalNoteForm'
import { ConditionDiagnosisForm } from '../../components/organisms/ConditionDiagnosisForm'
import { DiagnosticResultViewer } from '../../components/organisms/DiagnosticResultViewer'
import { EncounterTimeline } from '../../components/organisms/EncounterTimeline'
import { GCSAssessmentForm } from '../../components/organisms/Assessment/GCSAssessment/GCSAssessmentForm'
import { LabRadOrderForm } from '../../components/organisms/LabRadOrderForm'
import { EKGDiagnosticForm } from '../../components/organisms/EKGDiagnosticForm'
import { PrescriptionForm } from '../../components/organisms/Assessment/Prescription/PrescriptionForm'
import { OphthalmologyForm } from '../../components/organisms/Assessment/Ophthalmology/OphthalmologyForm'
import { DermatologyForm } from '../../components/organisms/Assessment/Dermatology/DermatologyForm'
import { CardiologyForm } from '../../components/organisms/Assessment/Cardiology/CardiologyForm'
import { ENTForm } from '../../components/organisms/Assessment/ENT/ENTForm'
import { ReferralForm } from '../../components/organisms/ReferralForm'
import { VitalSignsMonitoringForm } from '../../components/organisms/Assessment/VitalSignsMonitoring/VitalSignsMonitoringForm'
import { Empty, Input, Layout, Menu, theme } from 'antd'
import { useMemo, useState } from 'react'
import { TriageForm } from '@renderer/components/organisms/Assessment/Triage/TriageForm'
import { AnamnesisForm } from '@renderer/components/organisms/Assessment/Anamnesis/AnamnesisForm'

const { Sider, Content } = Layout

import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'

interface DoctorEmergencyWorkspaceProps {
  encounterId: string
  patientData: any
  patientInfoCardData: any
  onEditStatus: () => void
}

export const DoctorEmergencyWorkspace = ({
  encounterId,
  patientData,
  patientInfoCardData,
  onEditStatus
}: DoctorEmergencyWorkspaceProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('overview')
  const [searchText, setSearchText] = useState('')
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  const items = useMemo(
    () => [
      {
        key: 'info',
        icon: <UserOutlined />,
        label: 'Informasi Pasien'
      },
      {
        key: 'overview',
        icon: <MonitorOutlined />,
        label: 'Ringkasan & Timeline'
      },
      {
        key: 'emergency',
        icon: <AlertOutlined />,
        label: 'Triase & Gawat Darurat',
        children: [
          { key: 'triage', label: 'Data Triase' },
          { key: 'gcs', label: 'GCS (Glasgow Coma Scale)' }
        ]
      },
      {
        key: 'screening',
        icon: <SolutionOutlined />,
        label: 'Skrining & Asesmen Risiko',
        children: [
          { key: 'pain-assessment', label: 'Asesmen Nyeri' },
          { key: 'fall-risk', label: 'Asesmen Risiko Jatuh' },
          { key: 'decubitus-risk', label: 'Skrining Risiko Dekubitus' },
          { key: 'cough-screening', label: 'Skrining Batuk (TBC)' }
        ]
      },
      {
        key: 'assessment',
        icon: <FormOutlined />,
        label: 'Asesmen Pasien',
        children: [
          { key: 'anamnesis', label: 'Anamnesis' },
          { key: 'riwayat-perjalanan-penyakit', label: 'Riwayat Perjalanan Penyakit' },
          { key: 'past-disease', label: 'Riwayat Penyakit Terdahulu' },
          { key: 'medication', label: 'Riwayat Pengobatan' },
          { key: 'allergy', label: 'Alergi' },
          { key: 'family-history', label: 'Riwayat Keluarga' }
        ]
      },
      {
        key: 'physical',
        icon: <MonitorOutlined />,
        label: 'Pemeriksaan Fisik & Monitoring',
        children: [
          { key: 'physical-assessment', label: 'Pemeriksaan Fisik' },
          { key: 'monitoring-ttv', label: 'Monitoring TTV' }
        ]
      },
      {
        key: 'polyclinic-form',
        icon: <FormOutlined />,
        label: 'Form Poli',
        children: [
          { key: 'ophthalmology', label: 'Pemeriksaan Mata' },
          { key: 'dermatology', label: 'Pemeriksaan Kulit (Dermatologi)' },
          { key: 'cardiology', label: 'Pemeriksaan Jantung (Kardiologi)' },
          { key: 'ent', label: 'Pemeriksaan THT' }
        ]
      },
      {
        key: 'orders',
        icon: <MedicineBoxOutlined />,
        label: 'Tatalaksana & Prosedur',
        children: [
          { key: 'condition-diagnosis', label: 'Diagnosis (Awal/Kerja/Banding)' },
          { key: 'ekg-diagnostic', label: 'Prosedur Diagnostik EKG' },
          { key: 'prescription', label: 'E-Resep' }
        ]
      },
      {
        key: 'diagnostic',
        icon: <ExperimentOutlined />,
        label: 'Penunjang Medis',
        children: [
          { key: 'lab-rad-order', label: 'Order Lab & Rad' },
          { key: 'results', label: 'Hasil Penunjang' }
        ]
      },
      {
        key: 'admin',
        icon: <ExportOutlined />,
        label: 'Administrasi',
        children: [
          { key: 'referral', label: 'Rujukan' },
          { key: 'notes', label: 'Catatan Tambahan' }
        ]
      }
    ],
    []
  )

  const filteredItems = useMemo(() => {
    if (!searchText) return items

    const lowerSearch = searchText.toLowerCase()

    return items
      .map((item) => {
        const isParentMatch = item.label?.toLowerCase().includes(lowerSearch)

        if (item.children && Array.isArray(item.children)) {
          const matchingChildren = item.children.filter((child: any) =>
            child.label.toLowerCase().includes(lowerSearch)
          )

          if (matchingChildren.length > 0) {
            return { ...item, children: matchingChildren }
          } else if (isParentMatch) {
            return item
          }
          return null
        }

        return isParentMatch ? item : null
      })
      .filter(Boolean) as any[]
  }, [items, searchText])

  const renderContent = () => {
    switch (selectedKey) {
      case 'info':
        return <PatientInfoCard patientData={patientInfoCardData} onEditStatus={onEditStatus} />
      case 'overview':
        return <EncounterTimeline encounterId={encounterId} />
      case 'triage':
        return <TriageForm encounterId={encounterId} patientData={patientData} />
      case 'gcs':
        return <GCSAssessmentForm encounterId={encounterId} patientData={patientData} />
      case 'pain-assessment':
        return <PainAssessmentForm encounterId={encounterId} patientData={patientData} />
      case 'fall-risk':
        return (
          <FallRiskAssessmentForm encounterId={encounterId} patientId={patientData.patient.id} />
        )
      case 'decubitus-risk':
        return <DecubitusRiskAssessmentForm encounterId={encounterId} patientData={patientData} />
      case 'cough-screening':
        return <CoughScreeningForm encounterId={encounterId} patientData={patientData} />
      case 'anamnesis':
        return <AnamnesisForm encounterId={encounterId} patientData={patientData} />
      case 'riwayat-perjalanan-penyakit':
        return <RiwayatPerjalananPenyakitForm encounterId={encounterId} patientData={patientData} />
      case 'past-disease':
        return <PastDiseaseForm encounterId={encounterId} patientData={patientData} />
      case 'allergy':
        return <AllergyForm encounterId={encounterId} patientData={patientData} />
      case 'medication':
        return <MedicationForm encounterId={encounterId} patientData={patientData} />
      case 'family-history':
        return <FamilyHistoryForm encounterId={encounterId} patientData={patientData} />
      case 'physical-assessment':
        return <PhysicalAssessmentForm encounterId={encounterId} patientData={patientData} />
      case 'monitoring-ttv':
        return <VitalSignsMonitoringForm encounterId={encounterId} patientData={patientData} />
      case 'ophthalmology':
        return <OphthalmologyForm encounterId={encounterId} patientData={patientData} />
      case 'dermatology':
        return <DermatologyForm encounterId={encounterId} patientData={patientData} />
      case 'cardiology':
        return <CardiologyForm encounterId={encounterId} patientData={patientData} />
      case 'ent':
        return <ENTForm encounterId={encounterId} patientData={patientData} />
      case 'condition-diagnosis':
        return <ConditionDiagnosisForm encounterId={encounterId} patientData={patientData} />
      case 'prescription':
        return <PrescriptionForm encounterId={encounterId} patientData={patientData} />
      case 'ekg-diagnostic':
        return <EKGDiagnosticForm encounterId={encounterId} patientData={patientData} />
      case 'lab-rad-order':
        return <LabRadOrderForm encounterId={encounterId} patientData={patientData} />
      case 'results':
        return (
          <DiagnosticResultViewer encounterId={encounterId} patientId={patientData?.patient?.id} />
        )
      case 'referral':
        return (
          <ReferralForm
            encounterId={encounterId}
            patientId={patientData?.patient?.id}
            patientData={patientData}
          />
        )
      case 'notes':
        return <ClinicalNoteForm encounterId={encounterId} />
      default:
        return <div>Halaman tidak ditemukan</div>
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Layout className="rounded-lg overflow-hidden flex-1 border border-white/10">
        <Sider
          width={265}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="light"
          className="border-r border-gray-200 dark:border-white/10"
          trigger={
            <div className="flex items-center justify-center h-12 border-t border-gray-200 dark:border-white/10 text-gray-500 hover:text-red-600 transition-colors cursor-pointer">
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          }
        >
          <div className="h-full flex flex-col">
            <div className={`p-4 ${collapsed ? 'text-center' : ''} border-b border-gray-100`}>
              {collapsed ? (
                <AlertOutlined className="text-xl text-red-600" />
              ) : (
                <div className="font-bold flex items-center gap-2">
                  <AlertOutlined className="text-red-600" />
                  IGD
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex-none hidden overflow-hidden md:block">
                <PatientInfoCard patientData={patientInfoCardData} onEditStatus={onEditStatus} />
              </div>
            )}

            <div className="flex flex-col flex-1 overflow-hidden mt-2">
              <div className="px-4 pb-2">
                <Input.Search
                  placeholder="Cari menu/form..."
                  allowClear
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1 overflow-y-auto pb-4">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 mt-10">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-gray-400 text-sm">Form tidak ditemukan</span>
                      }
                    />
                  </div>
                ) : (
                  <Menu
                    mode="inline"
                    defaultSelectedKeys={['info']}
                    defaultOpenKeys={
                      searchText
                        ? filteredItems.map((item) => item.key)
                        : ['emergency', 'screening', 'assessment']
                    }
                    style={{ borderRight: 0 }}
                    items={filteredItems}
                    onSelect={({ key }) => setSelectedKey(key)}
                  />
                )}
              </div>
            </div>
          </div>
        </Sider>

        <Layout>
          <Content
            className="p-6 overflow-y-auto h-full"
            style={{ background: colorBgContainer, minHeight: 280 }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}
