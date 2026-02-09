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
import { FallRiskAssessmentForm } from '@renderer/components/organisms/FallRiskAssessmentForm'
import { GCSAssessmentForm } from '@renderer/components/organisms/GCSAssessmentForm'
import { InformedConsentForm } from '@renderer/components/organisms/InformedConsentForm'
import { EncounterTimeline } from '@renderer/components/organisms/EncounterTimeline'
import { LabRadOrderForm } from '@renderer/components/organisms/LabRadOrderForm'
import { NutritionScreeningForm } from '@renderer/components/organisms/NutritionScreeningForm'
import { PrescriptionForm } from '@renderer/components/organisms/PrescriptionForm'
import { ReferralForm } from '@renderer/components/organisms/ReferralForm'
import { VitalSignsMonitoringForm } from '../../components/organisms/VitalSignsMonitoringForm'
import { PhysicalAssessmentForm } from '../../components/organisms/Assessment/PhysicalAssessmentForm'
import { AnamnesisForm } from '../../components/organisms/Assessment/AnamnesisForm'
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
        { key: 'physical-assessment', label: 'Pemeriksaan Fisik' },
        { key: 'dental-assessment', label: 'Pemeriksaan Gigi' },
        { key: 'risiko-jatuh', label: 'Risiko Jatuh' },
        { key: 'skrining-gizi', label: 'Skrining Gizi' },
        { key: 'gcs', label: 'GCS (Glasgow Coma Scale)' }
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
        return <InitialAssessmentForm encounterId={encounterId!} patientData={patientData} mode="inpatient" role="nurse" />
      case 'anamnesis':
        return <AnamnesisForm encounterId={encounterId!} patientData={patientData} />
      case 'physical-assessment':
        return (
          <PhysicalAssessmentForm
            encounterId={encounterId!}
            patientId={patientData.patient.id}
            patientData={patientData}
          />
        )
      case 'dental-assessment':
        return (
          <DentalPage
            encounterId={encounterId!}
            patientId={patientData.patient.id}
            performerId={(patientData as any).doctorId}
            performerName={(patientData as any).doctorName}
          />
        )
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
    <Layout className=" rounded-lg overflow-hidden h-full border border-gray-200">
      <Sider
        width={260}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        className="border-r border-gray-200"
        trigger={
          <div className="flex items-center justify-center h-12 border-t border-gray-200 text-gray-500 hover:text-blue-600 transition-colors">
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        }
      >
        <div className="h-full flex flex-col">
          <div className={`p-4 ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? (
              <SafetyCertificateOutlined className="text-xl text-blue-600" />
            ) : (
              <div className="font-bold text-gray-700 flex items-center gap-2">
                <SafetyCertificateOutlined className="text-blue-600" />
                Rawat Inap
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <Menu
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
