import {
  ExperimentOutlined,
  FileTextOutlined,
  FormOutlined,
  MedicineBoxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MonitorOutlined,
  ReconciliationOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  UserOutlined
} from '@ant-design/icons'
import { CPPTForm } from '@renderer/components/organisms/Assessment/CPPT/CPPTForm'
import { GeneralSOAPForm } from '@renderer/components/organisms/Assessment/GeneralSOAP/GeneralSOAPForm'
import { ClinicalNoteForm } from '@renderer/components/organisms/Assessment/ClinicalNote/ClinicalNoteForm'
import { DiagnosisForm } from '@renderer/components/organisms/Assessment/Diagnosis/DiagnosisForm'
import { ProceduresForm } from '@renderer/components/organisms/Assessment/Procedure/ProceduresForm'
import { NutritionOrderForm } from '@renderer/components/organisms/Assessment/NutritionOrder/NutritionOrderForm'
import { DiagnosticResultViewer } from '@renderer/components/organisms/DiagnosticResultViewer'
import { DischargeSummaryForm } from '@renderer/components/organisms/DischargeSummaryForm'
import { InitialAssessmentForm } from '../../components/organisms/Assessment/InitialAssessment/InitialAssessmentForm'
import DentalPage from '../../components/organisms/Assessment/Dental'
import { AntenatalCareForm } from '@renderer/components/organisms/Assessment/AntenatalCare/AntenatalCareForm'
import { OphthalmologyForm } from '@renderer/components/organisms/Assessment/Ophthalmology/OphthalmologyForm'
import { DermatologyForm } from '@renderer/components/organisms/Assessment/Dermatology/DermatologyForm'
import { CardiologyForm } from '@renderer/components/organisms/Assessment/Cardiology/CardiologyForm'
import { ENTForm } from '@renderer/components/organisms/Assessment/ENT/ENTForm'
import { FallRiskAssessmentForm } from '@renderer/components/organisms/Assessment/FallRiskAssessment/FallRiskAssessmentForm'
import { GCSAssessmentForm } from '@renderer/components/organisms/Assessment/GCSAssessment/GCSAssessmentForm'
import { InformedConsentForm } from '@renderer/components/organisms/InformedConsentForm'
import { EncounterTimeline } from '@renderer/components/organisms/EncounterTimeline'
import { LabRadOrderForm } from '@renderer/components/organisms/LabRadOrderForm'
import { NutritionScreeningForm } from '@renderer/components/organisms/Assessment/NutritionScreening/NutritionScreeningForm'
import { PrescriptionForm } from '@renderer/components/organisms/Assessment/Prescription/PrescriptionForm'
import { ReferralForm } from '@renderer/components/organisms/ReferralForm'

import { VitalSignsMonitoringForm } from '../../components/organisms/Assessment/VitalSignsMonitoring/VitalSignsMonitoringForm'
import { PhysicalAssessmentForm } from '../../components/organisms/Assessment/PhysicalAssessment/PhysicalAssessmentForm'
import { AllergyForm } from '../../components/organisms/Assessment/Allergy/AllergyForm'
import { MedicationForm } from '../../components/organisms/Assessment/Medication/MedicationForm'
import { PastDiseaseForm } from '../../components/organisms/Assessment/PastDisease/PastDiseaseForm'
import { FamilyHistoryForm } from '../../components/organisms/Assessment/FamilyHistory/FamilyHistoryForm'
import { RiwayatPerjalananPenyakitForm } from '../../components/organisms/Assessment/RiwayatPerjalananPenyakitForm'
import { RasionalKlinisForm } from '../../components/organisms/Assessment/RasionalKlinisForm'
import { Layout, Menu, theme, Input, Empty } from 'antd'
import { useState, useMemo } from 'react'
import { AnamnesisForm } from '@renderer/components/organisms/Assessment/Anamnesis/AnamnesisForm'

const { Sider, Content } = Layout

import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'

interface InpatientWorkspaceProps {
  encounterId: string
  patientData: any
  patientInfoCardData: any
  onEditStatus: () => void
}

export const DoctorInpatientWorkspace = ({
  encounterId,
  patientData,
  patientInfoCardData,
  onEditStatus
}: InpatientWorkspaceProps) => {
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
        label: 'Ringkasan Pasien'
      },
      {
        key: 'assessment',
        icon: <SolutionOutlined />,
        label: 'Asesmen',
        children: [
          { key: 'initial-assessment', label: 'Skrining Perawat' },
          { key: 'anamnesis', label: 'Anamnesis' },
          { key: 'past-disease', label: 'Riwayat Penyakit Terdahulu' },
          { key: 'clinical-course', label: 'Riwayat Perjalanan Penyakit' },
          { key: 'clinical-rationale', label: 'Rasional Klinis' },
          { key: 'allergy', label: 'Alergi' },
          { key: 'medication', label: 'Riwayat Pengobatan' },
          { key: 'family-history', label: 'Riwayat Keluarga' },
          { key: 'physical-assessment', label: 'Pemeriksaan Fisik' },
          { key: 'risiko-jatuh', label: 'Risiko Jatuh' },
          { key: 'skrining-gizi', label: 'Skrining Gizi' },
          { key: 'gcs', label: 'GCS (Glasgow Coma Scale)' }
        ]
      },
      {
        key: 'polyclinic-form',
        icon: <FormOutlined />,
        label: 'Form Poli',
        children: [
          { key: 'dental-assessment', label: 'Pemeriksaan Gigi' },
          { key: 'anc-assessment', label: 'Pemeriksaan Kehamilan (ANC)' },
          { key: 'ophthalmology', label: 'Pemeriksaan Mata' },
          { key: 'dermatology', label: 'Pemeriksaan Kulit (Dermatologi)' },
          { key: 'cardiology', label: 'Pemeriksaan Jantung (Kardiologi)' },
          { key: 'ent', label: 'Pemeriksaan THT' }
        ]
      },
      {
        key: 'monitoring',
        icon: <MonitorOutlined />,
        label: 'Monitoring Harian',
        children: [{ key: 'monitoring-ttv', label: 'Monitoring TTV' }]
      },
      {
        key: 'general-soap',
        icon: <FormOutlined />,
        label: 'SOAP Umum'
      },
      {
        key: 'cppt',
        icon: <FileTextOutlined />,
        label: 'Catatan Perkembangan (CPPT)'
      },
      {
        key: 'orders',
        icon: <MedicineBoxOutlined />,
        label: 'Tindakan & Terapi',
        children: [
          { key: 'diagnosis', label: 'Diagnosis (ICD-10)' },
          { key: 'procedures', label: 'Tindakan Medis (ICD-9-CM)' },
          { key: 'education', label: 'Edukasi' },
          { key: 'nutrition-order', label: 'Order Diet (Gizi)' },
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
        icon: <ReconciliationOutlined />,
        label: 'Administrasi',
        children: [
          { key: 'informed-consent', label: 'Informed Consent' },
          { key: 'rujukan', label: 'Rujukan' },
          { key: 'resume', label: 'Resume Medis Tubuh' }
        ]
      },
      {
        key: 'notes',
        icon: <FormOutlined />,
        label: 'Catatan Tambahan'
      }
    ],
    []
  )

  const filteredItems = useMemo(() => {
    if (!searchText) return items

    const lowerSearch = searchText.toLowerCase()

    return items
      .map((item) => {
        // Check if parent matches
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
        return (
          <div className="space-y-4">
            <EncounterTimeline encounterId={encounterId} />
          </div>
        )
      case 'initial-assessment':
        return (
          <InitialAssessmentForm
            encounterId={encounterId!}
            patientData={patientData}
            mode="inpatient"
            role="nurse"
          />
        )
      case 'anamnesis':
        return <AnamnesisForm encounterId={encounterId!} patientData={patientData} />
      case 'past-disease':
        return <PastDiseaseForm encounterId={encounterId!} patientData={patientData} />
      case 'clinical-course':
        return (
          <RiwayatPerjalananPenyakitForm encounterId={encounterId!} patientData={patientData} />
        )
      case 'clinical-rationale':
        return <RasionalKlinisForm encounterId={encounterId!} patientData={patientData} />
      case 'allergy':
        return <AllergyForm encounterId={encounterId!} patientData={patientData} />
      case 'medication':
        return <MedicationForm encounterId={encounterId!} patientData={patientData} />
      case 'family-history':
        return <FamilyHistoryForm encounterId={encounterId!} patientData={patientData} />
      case 'physical-assessment':
        return <PhysicalAssessmentForm encounterId={encounterId!} patientData={patientData} />
      case 'dental-assessment':
        return <DentalPage encounterId={encounterId!} patientId={patientData.patient.id} />
      case 'anc-assessment':
        return <AntenatalCareForm encounterId={encounterId!} patientData={patientData} />
      case 'ophthalmology':
        return <OphthalmologyForm encounterId={encounterId!} patientData={patientData} />
      case 'dermatology':
        return <DermatologyForm encounterId={encounterId!} patientData={patientData} />
      case 'cardiology':
        return <CardiologyForm encounterId={encounterId!} patientData={patientData} />
      case 'ent':
        return <ENTForm encounterId={encounterId!} patientData={patientData} />
      case 'skrining-gizi':
        return (
          <NutritionScreeningForm encounterId={encounterId} patientId={patientData.patient.id} />
        )
      case 'risiko-jatuh':
        return (
          <FallRiskAssessmentForm encounterId={encounterId} patientId={patientData.patient.id} />
        )
      case 'gcs':
        return <GCSAssessmentForm encounterId={encounterId} patientData={patientData} />
      case 'monitoring-ttv':
        return <VitalSignsMonitoringForm encounterId={encounterId} patientData={patientData} />
      case 'general-soap':
        return <GeneralSOAPForm encounterId={encounterId} patientData={patientData} />
      case 'cppt':
        return <CPPTForm encounterId={encounterId} patientData={patientData} />
      case 'prescription':
        return <PrescriptionForm encounterId={encounterId} patientData={patientData} />
      case 'nutrition-order':
        return <NutritionOrderForm encounterId={encounterId} patientData={patientData} />
      case 'diagnosis':
        return <DiagnosisForm encounterId={encounterId} patientData={patientData} />
      case 'procedures':
        return <ProceduresForm encounterId={encounterId} patientData={patientData} />

      case 'lab-rad-order':
        return <LabRadOrderForm encounterId={encounterId} patientData={patientData} />
      case 'results':
        return (
          <DiagnosticResultViewer encounterId={encounterId} patientId={patientData.patient.id} />
        )
      case 'informed-consent':
        return <InformedConsentForm encounterId={encounterId} patientData={patientData} />
      case 'rujukan':
        return (
          <ReferralForm
            encounterId={encounterId}
            patientId={patientData.patient.id}
            patientData={patientData}
          />
        )
      case 'resume':
        return <DischargeSummaryForm encounterId={encounterId} patientData={patientData} />
      case 'notes':
        return <ClinicalNoteForm encounterId={encounterId} doctorId={patientData?.doctorId || 1} />
      default:
        return <div>Select a menu item</div>
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Layout className="rounded-lg overflow-hidden flex-1 border border-white/10">
        <Sider
          width={260}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="light"
          className="border-r border-white/10"
          trigger={
            <div className="flex items-center justify-center h-12 border-t border-white/10 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer">
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          }
        >
          <div className="h-full flex flex-col">
            <div className={`p-4 ${collapsed ? 'text-center' : ''}`}>
              {collapsed ? (
                <SafetyCertificateOutlined className="text-xl text-blue-600" />
              ) : (
                <div className="font-bold flex items-center gap-2">
                  <SafetyCertificateOutlined className="text-blue-600" />
                  Rawat Inap
                </div>
              )}
            </div>
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
                    className="custom-menu"
                    mode="inline"
                    defaultSelectedKeys={['info']}
                    defaultOpenKeys={
                      searchText ? filteredItems.map((item) => item.key) : ['assessment', 'orders']
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
        <Layout className="">
          <Content
            className="p-6 overflow-y-auto h-full"
            style={{
              background: colorBgContainer,
              minHeight: 280
            }}
          >
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}
