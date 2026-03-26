import {
  ExperimentOutlined,
  FileTextOutlined,
  FormOutlined,
  MedicineBoxOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MonitorOutlined,
  ReconciliationOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  UserOutlined,
  HeartOutlined,
  AlertOutlined,
  ApiOutlined,
  AuditOutlined,
  CalendarOutlined,
  ClusterOutlined,
  CompassOutlined,
  ContainerOutlined,
  DeploymentUnitOutlined,
  DisconnectOutlined,
  FundOutlined,
  HistoryOutlined,
  HomeOutlined,
  OrderedListOutlined,
  ReadOutlined,
  ScheduleOutlined,
  SmileOutlined,
  TeamOutlined,
  ToolOutlined
} from '@ant-design/icons'
import { CPPTForm } from '@renderer/components/organisms/Assessment/CPPT/CPPTForm'
import { GeneralSOAPForm } from '@renderer/components/organisms/Assessment/GeneralSOAP/GeneralSOAPForm'
import { ClinicalNoteForm } from '@renderer/components/organisms/Assessment/ClinicalNote/ClinicalNoteForm'
import { DiagnosisForm } from '@renderer/components/organisms/Assessment/Diagnosis/DiagnosisForm'
import { ProceduresForm } from '@renderer/components/organisms/Assessment/Procedure/ProceduresForm'
import { NutritionOrderForm } from '@renderer/components/organisms/Assessment/NutritionOrder/NutritionOrderForm'
import { DiagnosticResultViewer } from '@renderer/components/organisms/DiagnosticResultViewer'
import { DischargeSummaryForm } from '@renderer/components/organisms/DischargeSummaryForm'
import DentalPage from '../../components/organisms/Assessment/Dental'
import { AntenatalCareForm } from '@renderer/components/organisms/Assessment/AntenatalCare/AntenatalCareForm'
import { OphthalmologyForm } from '@renderer/components/organisms/Assessment/Ophthalmology/OphthalmologyForm'
import { DermatologyForm } from '@renderer/components/organisms/Assessment/Dermatology/DermatologyForm'
import { CardiologyForm } from '@renderer/components/organisms/Assessment/Cardiology/CardiologyForm'
import { ENTForm } from '@renderer/components/organisms/Assessment/ENT/ENTForm'
import { FallRiskAssessmentForm } from '@renderer/components/organisms/Assessment/FallRiskAssessment/FallRiskAssessmentForm'
import { GCSAssessmentForm } from '@renderer/components/organisms/Assessment/GCSAssessment/GCSAssessmentForm'
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
import { GoalForm } from '@renderer/components/organisms/Assessment/Goal/GoalForm'
import { CarePlanForm } from '@renderer/components/organisms/Assessment/Careplan/CarePlanForm'
import { InstruksiMedikForm } from '@renderer/components/organisms/Assessment/Careplan/InstruksiMedikForm'
import { PrognosisForm } from '@renderer/components/organisms/Assessment/Prognosis/PrognosisForm'
import { FunctionalAssessmentForm } from '@renderer/components/organisms/Assessment/FunctionalAssessment/FunctionalAssessmentForm'
import { Layout, Menu, theme, Input, Empty, Modal } from 'antd'
import { useState, useMemo } from 'react'
import { AnamnesisForm } from '@renderer/components/organisms/Assessment/Anamnesis/AnamnesisForm'
import { PatientMedicalHistoryTab } from '@renderer/components/organisms/PatientMedicalHistory/PatientMedicalHistoryTab'

const { Sider, Content } = Layout

import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'
import EducationForm from '@renderer/components/organisms/Assessment/Education/EducationForm'
import { MedicalCertificateForm } from '@renderer/components/organisms/Assessment/MedicalCertificate/MedicalCertificateForm'
import { FollowUpForm } from '@renderer/components/organisms/Assessment/FollowUp/FollowUpForm'
import { DetailTindakanForm } from '@renderer/components/organisms/Assessment/DetailTindakan/DetailTindakanForm'
import { UnifiedAssessmentTab } from '@renderer/components/organisms/Assessment/UnifiedAssessment/UnifiedAssessmentTab'

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
  const [selectedKey, setSelectedKey] = useState('info')
  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const { token } = theme.useToken()

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
        key: 'medical-history',
        icon: <FileTextOutlined />,
        label: 'Riwayat Rekam Medis'
      },
      {
        key: 'unified-assessment',
        icon: <SolutionOutlined />,
        label: 'Custom Asesmen'
      },
      {
        key: 'assessment',
        icon: <SolutionOutlined />,
        label: 'Asesmen Pasien',
        children: [
          { key: 'anamnesis', icon: <ReadOutlined />, label: 'Anamnesis' },
          { key: 'past-disease', icon: <HistoryOutlined />, label: 'Riwayat Penyakit Terdahulu' },
          { key: 'allergy', icon: <AlertOutlined />, label: 'Alergi' },
          { key: 'medication', icon: <MedicineBoxOutlined />, label: 'Riwayat Pengobatan' },
          { key: 'family-history', icon: <TeamOutlined />, label: 'Riwayat Keluarga' },
          { key: 'physical-assessment', icon: <AuditOutlined />, label: 'Pemeriksaan Fisik' },
          {
            key: 'functional-assessment',
            icon: <SmileOutlined />,
            label: 'Pemeriksaan Fungsional'
          },
          {
            key: 'clinical-course',
            icon: <CompassOutlined />,
            label: 'Riwayat Perjalanan Penyakit'
          },
          { key: 'care-goal', icon: <FundOutlined />, label: 'Tujuan Perawatan' },
          { key: 'care-plan', icon: <ScheduleOutlined />, label: 'Rencana Rawat Pasien' },
          { key: 'instruksi-medik', icon: <OrderedListOutlined />, label: 'Instruksi Medik' },
          { key: 'clinical-rationale', icon: <DeploymentUnitOutlined />, label: 'Rasional Klinis' },
          { key: 'prognosis', icon: <ClusterOutlined />, label: 'Prognosis' }
        ]
      },
      {
        key: 'polyclinic-form',
        icon: <FormOutlined />,
        label: 'Form Poli',
        children: [
          { key: 'dental-assessment', icon: <SmileOutlined />, label: 'Pemeriksaan Gigi' },
          { key: 'anc-assessment', icon: <HeartOutlined />, label: 'Pemeriksaan Kehamilan (ANC)' },
          { key: 'ophthalmology', icon: <CompassOutlined />, label: 'Pemeriksaan Mata' },
          {
            key: 'dermatology',
            icon: <SolutionOutlined />,
            label: 'Pemeriksaan Kulit (Dermatologi)'
          },
          { key: 'cardiology', icon: <HeartOutlined />, label: 'Pemeriksaan Jantung (Kardiologi)' },
          { key: 'ent', icon: <ApiOutlined />, label: 'Pemeriksaan THT' }
        ]
      },
      {
        key: 'monitoring-ttv',
        icon: <MonitorOutlined />,
        label: 'Monitoring Harian'
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
          { key: 'diagnosis', icon: <ContainerOutlined />, label: 'Diagnosis (ICD-10)' },
          { key: 'procedures', icon: <ToolOutlined />, label: 'Tindakan Medis (ICD-9-CM)' },
          { key: 'procedure-detail', icon: <AuditOutlined />, label: 'Detail Tindakan' },
          { key: 'education', icon: <ReadOutlined />, label: 'Edukasi' },
          { key: 'nutrition-order', icon: <HomeOutlined />, label: 'Order Diet (Gizi)' },
          { key: 'prescription', icon: <FormOutlined />, label: 'E-Resep' }
        ]
      },
      {
        key: 'diagnostic',
        icon: <ExperimentOutlined />,
        label: 'Penunjang Medis',
        children: [
          { key: 'lab-rad-order', icon: <ExperimentOutlined />, label: 'Order Lab & Rad' },
          { key: 'results', icon: <ScheduleOutlined />, label: 'Hasil Penunjang' }
        ]
      },
      {
        key: 'admin',
        icon: <ReconciliationOutlined />,
        label: 'Administrasi',
        children: [
          { key: 'referral', icon: <DisconnectOutlined />, label: 'Rujukan' },
          { key: 'discharge-summary', icon: <ContainerOutlined />, label: 'Resume Medis' },
          { key: 'medical-certificate', icon: <FileTextOutlined />, label: 'Surat Keterangan' },
          { key: 'follow-up', icon: <CalendarOutlined />, label: 'Surat Kontrol' },
          {
            key: 'notes',
            icon: <FormOutlined />,
            label: 'Catatan Tambahan'
          }
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

  const filteredModalItems = useMemo(() => {
    if (!modalSearch) return items

    const lowerSearch = modalSearch.toLowerCase()

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
  }, [items, modalSearch])

  const renderContent = () => {
    switch (selectedKey) {
      case 'unified-assessment':
        return <UnifiedAssessmentTab encounterId={encounterId} patientData={patientData} />
      case 'info':
        return <PatientInfoCard patientData={patientInfoCardData} onEditStatus={onEditStatus} />
      case 'medical-history':
        return <PatientMedicalHistoryTab patientId={patientData?.patient?.id} />
      case 'overview':
        return (
          <div className="space-y-4">
            <EncounterTimeline encounterId={encounterId} />
          </div>
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
      case 'functional-assessment':
        return <FunctionalAssessmentForm encounterId={encounterId!} patientData={patientData} />
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
      case 'care-goal':
        return <GoalForm encounterId={encounterId || ''} patientData={patientData} />
      case 'care-plan':
        return <CarePlanForm encounterId={encounterId || ''} patientData={patientData} />
      case 'instruksi-medik':
        return <InstruksiMedikForm encounterId={encounterId} patientData={patientData} />
      case 'prognosis':
        return <PrognosisForm encounterId={encounterId || ''} patientData={patientData} />
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
      case 'procedure-detail':
        return <DetailTindakanForm encounterId={encounterId} patientData={patientData} />
      case 'education':
        return <EducationForm encounterId={encounterId} patientData={patientData} />
      case 'lab-rad-order':
        return <LabRadOrderForm encounterId={encounterId} patientData={patientData} />
      case 'results':
        return (
          <DiagnosticResultViewer encounterId={encounterId} patientId={patientData.patient.id} />
        )
      case 'referral':
        return (
          <ReferralForm
            encounterId={encounterId}
            patientId={patientData.patient.id}
            patientData={patientData}
          />
        )
      case 'discharge-summary':
        return <DischargeSummaryForm encounterId={encounterId} patientData={patientData} />
      case 'medical-certificate':
        return <MedicalCertificateForm encounterId={encounterId || ''} patientData={patientData} />
      case 'follow-up':
        return <FollowUpForm encounterId={encounterId} patientData={patientData} />
      case 'notes':
        return <ClinicalNoteForm encounterId={encounterId} doctorId={patientData?.doctorId || 1} />
      default:
        return <div>Select a menu item</div>
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Modal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setModalSearch('')
        }}
        footer={null}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
            <span>Rawat Inap — Pilih Form</span>
          </div>
        }
        width={500}
        styles={{ body: { padding: 0, maxHeight: '70vh', overflowY: 'auto' } }}
        centered
      >
        <div
          className="px-4 py-3"
          style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
        >
          <Input.Search
            placeholder="Cari menu/form..."
            allowClear
            autoFocus
            value={modalSearch}
            onChange={(e) => setModalSearch(e.target.value)}
          />
        </div>
        {filteredModalItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ fontSize: 14, color: token.colorTextTertiary }}>
                  Form tidak ditemukan
                </span>
              }
            />
          </div>
        ) : (
          <Menu
            className="custom-menu"
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={
              modalSearch ? filteredModalItems.map((item) => item.key) : ['assessment', 'orders']
            }
            style={{ borderRight: 0 }}
            items={filteredModalItems}
            onSelect={({ key }) => {
              setSelectedKey(key)
              setModalOpen(false)
              setModalSearch('')
            }}
          />
        )}
      </Modal>

      <Layout
        className="rounded-lg overflow-hidden flex-1"
        style={{ border: `1px solid ${token.colorBorderSecondary}` }}
      >
        <Sider
          width={260}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="light"
          className=""
          trigger={
            <div className="flex items-center justify-center h-12 cursor-pointer transition-colors">
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          }
        >
          <div className="h-full flex flex-col">
            <div
              className={`p-4 ${collapsed ? 'text-center' : ''}`}
              style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
            >
              {collapsed ? (
                <SearchOutlined
                  style={{ fontSize: 18, color: token.colorPrimary, cursor: 'pointer' }}
                  onClick={() => setModalOpen(true)}
                  title="Cari Form"
                />
              ) : (
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyCertificateOutlined style={{ color: token.colorPrimary }} />
                  <span style={{ color: token.colorText }}>Rawat Inap</span>
                </div>
              )}
            </div>

            <div className="flex flex-col flex-1 overflow-hidden mt-2">
              {!collapsed && (
                <div
                  className="px-4 pb-2"
                  style={{
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    paddingBottom: 10
                  }}
                >
                  <Input.Search
                    placeholder="Cari menu/form..."
                    allowClear
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              <div className="flex-1 overflow-y-auto pb-4">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 mt-10">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{ fontSize: 14, color: token.colorTextTertiary }}>
                          Form tidak ditemukan
                        </span>
                      }
                    />
                  </div>
                ) : (
                  <Menu
                    className="custom-menu"
                    mode="inline"
                    selectedKeys={[selectedKey]}
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
          <Content className="p-6 overflow-y-auto h-full">{renderContent()}</Content>
        </Layout>
      </Layout>
    </div>
  )
}
