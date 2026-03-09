import {
  AlertOutlined,
  ExperimentOutlined,
  ExportOutlined,
  FormOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
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
import { DiagnosticResultViewer } from '../../components/organisms/DiagnosticResultViewer'
import { EncounterTimeline } from '../../components/organisms/EncounterTimeline'
import { GCSAssessmentForm } from '../../components/organisms/Assessment/GCSAssessment/GCSAssessmentForm'
import { LabRadOrderForm } from '../../components/organisms/LabRadOrderForm'
import { PrescriptionForm } from '../../components/organisms/Assessment/Prescription/PrescriptionForm'
import { OphthalmologyForm } from '../../components/organisms/Assessment/Ophthalmology/OphthalmologyForm'
import { DermatologyForm } from '../../components/organisms/Assessment/Dermatology/DermatologyForm'
import { CardiologyForm } from '../../components/organisms/Assessment/Cardiology/CardiologyForm'
import { ENTForm } from '../../components/organisms/Assessment/ENT/ENTForm'
import { ReferralForm } from '../../components/organisms/ReferralForm'
import { VitalSignsMonitoringForm } from '../../components/organisms/Assessment/VitalSignsMonitoring/VitalSignsMonitoringForm'
import { Empty, Input, Layout, Menu, Modal, theme } from 'antd'
import { useMemo, useState } from 'react'
import { TriageForm } from '@renderer/components/organisms/Assessment/Triage/TriageForm'
import { AnamnesisForm } from '@renderer/components/organisms/Assessment/Anamnesis/AnamnesisForm'
import { FunctionalAssessmentForm } from '@renderer/components/organisms/Assessment/FunctionalAssessment/FunctionalAssessmentForm'
import { GoalForm } from '@renderer/components/organisms/Assessment/Goal/GoalForm'
import { CarePlanForm } from '@renderer/components/organisms/Assessment/Careplan/CarePlanForm'
import { InstruksiMedikForm } from '@renderer/components/organisms/Assessment/Careplan/InstruksiMedikForm'
import { RasionalKlinisForm } from '../../components/organisms/Assessment/RasionalKlinisForm'
import { PrognosisForm } from '@renderer/components/organisms/Assessment/Prognosis/PrognosisForm'
import { DiagnosisForm } from '@renderer/components/organisms/Assessment/Diagnosis/DiagnosisForm'
import { ProceduresForm } from '@renderer/components/organisms/Assessment/Procedure/ProceduresForm'
import { NutritionOrderForm } from '@renderer/components/organisms/Assessment/NutritionOrder/NutritionOrderForm'
import EducationForm from '@renderer/components/organisms/Assessment/Education/EducationForm'

import { PatientMedicalHistoryTab } from '@renderer/components/organisms/PatientMedicalHistory/PatientMedicalHistoryTab'

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
          { key: 'past-disease', label: 'Riwayat Penyakit Terdahulu' },
          { key: 'allergy', label: 'Alergi' },
          { key: 'medication', label: 'Riwayat Pengobatan' },
          { key: 'family-history', label: 'Riwayat Keluarga' },
          { key: 'physical-assessment', label: 'Pemeriksaan Fisik' },
          { key: 'functional-assessment', label: 'Pemeriksaan Fungsional' },
          { key: 'clinical-course', label: 'Riwayat Perjalanan Penyakit' },
          { key: 'care-goal', label: 'Tujuan Perawatan' },
          { key: 'care-plan', label: 'Rencana Rawat Pasien' },
          { key: 'instruksi-medik', label: 'Instruksi Medik' },
          { key: 'clinical-rationale', label: 'Rasional Klinis' },
          { key: 'prognosis', label: 'Prognosis' }
        ]
      },
      {
        key: 'monitoring-ttv',
        icon: <MonitorOutlined />,
        label: 'Monitoring Harian'
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
      case 'info':
        return <PatientInfoCard patientData={patientInfoCardData} onEditStatus={onEditStatus} />
      case 'medical-history':
        return <PatientMedicalHistoryTab patientId={patientData?.patient?.id} />
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
      case 'functional-assessment':
        return <FunctionalAssessmentForm encounterId={encounterId} patientData={patientData} />
      case 'clinical-course':
        return (
          <RiwayatPerjalananPenyakitForm encounterId={encounterId} patientData={patientData} />
        )
      case 'care-goal':
        return <GoalForm encounterId={encounterId || ''} patientData={patientData} />
      case 'care-plan':
        return <CarePlanForm encounterId={encounterId || ''} patientData={patientData} />
      case 'instruksi-medik':
        return <InstruksiMedikForm encounterId={encounterId} patientData={patientData} />
      case 'clinical-rationale':
        return <RasionalKlinisForm encounterId={encounterId} patientData={patientData} />
      case 'prognosis':
        return <PrognosisForm encounterId={encounterId || ''} patientData={patientData} />
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
      case 'diagnosis':
        return <DiagnosisForm encounterId={encounterId} patientData={patientData} />
      case 'procedures':
        return <ProceduresForm encounterId={encounterId} patientData={patientData} />
      case 'education':
        return <EducationForm encounterId={encounterId} patientData={patientData} />
      case 'nutrition-order':
        return <NutritionOrderForm encounterId={encounterId} patientData={patientData} />
      case 'prescription':
        return <PrescriptionForm encounterId={encounterId} patientData={patientData} />
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
      <Modal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setModalSearch('')
        }}
        footer={null}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertOutlined style={{ color: token.colorError }} />
            <span>IGD — Pilih Form</span>
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
              modalSearch
                ? filteredModalItems.map((item) => item.key)
                : ['emergency', 'screening', 'assessment']
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
          width={265}
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
                  style={{ fontSize: 18, color: token.colorError, cursor: 'pointer' }}
                  onClick={() => setModalOpen(true)}
                />
              ) : (
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertOutlined style={{ color: token.colorError }} />
                  <span style={{ color: token.colorText }}>IGD</span>
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
          <Content className="p-6 overflow-y-auto h-full">{renderContent()}</Content>
        </Layout>
      </Layout>
    </div>
  )
}
