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
  SolutionOutlined
} from '@ant-design/icons'
import { CPPTForm } from '@renderer/components/organisms/CPPTForm'
import { GeneralSOAPForm } from '@renderer/components/organisms/GeneralSOAPForm'
import { ClinicalNoteForm } from '@renderer/components/organisms/ClinicalNoteForm'
import { DiagnosisProceduresForm } from '@renderer/components/organisms/DiagnosisProceduresForm'
import { DiagnosticResultViewer } from '@renderer/components/organisms/DiagnosticResultViewer'
import { DischargeSummaryForm } from '@renderer/components/organisms/DischargeSummaryForm'
import { InitialAssessmentForm } from '../../components/organisms/Assessment/InitialAssessmentForm'
import DentalPage from '../../components/organisms/Dental'
import { AntenatalCareForm } from '@renderer/components/organisms/AntenatalCare/AntenatalCareForm'
import { FallRiskAssessmentForm } from '@renderer/components/organisms/FallRiskAssessmentForm'
import { GCSAssessmentForm } from '@renderer/components/organisms/GCSAssessmentForm'
import { InformedConsentForm } from '@renderer/components/organisms/InformedConsentForm'
import { EncounterTimeline } from '@renderer/components/organisms/EncounterTimeline'
import { LabRadOrderForm } from '@renderer/components/organisms/LabRadOrderForm'
import { NutritionScreeningForm } from '@renderer/components/organisms/NutritionScreeningForm'
import { PrescriptionForm } from '@renderer/components/organisms/PrescriptionForm'
import { ReferralForm } from '@renderer/components/organisms/ReferralForm'
import { NutritionOrderForm } from '@renderer/components/organisms/NutritionOrderForm'
import { VitalSignsMonitoringForm } from '../../components/organisms/VitalSignsMonitoringForm'
import { PhysicalAssessmentForm } from '../../components/organisms/Assessment/PhysicalAssessmentForm'
import { AnamnesisForm } from '../../components/organisms/Assessment/AnamnesisForm'
import { AllergyForm } from '../../components/organisms/Assessment/Allergy/AllergyForm'
import { MedicationForm } from '../../components/organisms/Assessment/Medication/MedicationForm'
import { PastDiseaseForm } from '../../components/organisms/Assessment/PastDisease/PastDiseaseForm'
import { FamilyHistoryForm } from '../../components/organisms/Assessment/FamilyHistory/FamilyHistoryForm'
import { Layout, Menu, theme } from 'antd'
import { useState } from 'react'

const { Sider, Content } = Layout

interface InpatientWorkspaceProps {
  encounterId: string
  patientData: any
}

export const DoctorInpatientWorkspace = ({ encounterId, patientData }: InpatientWorkspaceProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('overview')
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  const items = [
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
        { key: 'past-disease', label: 'Riwayat Penyakit' },
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
        { key: 'anc-assessment', label: 'Pemeriksaan Kehamilan (ANC)' }
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
        { key: 'procedures', label: 'Diagnosis & Tindakan' },
        { key: 'prescription', label: 'E-Resep' },
        { key: 'nutrition-order', label: 'Order Diet (Gizi)' }
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
  ]

  const renderContent = () => {
    switch (selectedKey) {
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
      case 'procedures':
        return <DiagnosisProceduresForm encounterId={encounterId} patientData={patientData} />
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
    <Layout className="rounded-lg overflow-hidden h-full border border-white/10">
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
          <div className="flex-1 overflow-y-auto">
            <Menu
              className="custom-menu"
              mode="inline"
              defaultSelectedKeys={['overview']}
              defaultOpenKeys={['assessment', 'orders']}
              style={{ borderRight: 0 }}
              items={items}
              onSelect={({ key }) => setSelectedKey(key)}
            />
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
  )
}
