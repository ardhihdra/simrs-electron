import { Layout, Menu, theme, Input, Empty, Modal } from 'antd'
import { useState, useMemo } from 'react'
import {
  MonitorOutlined,
  SolutionOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  ExportOutlined,
  FormOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons'
import { EncounterTimeline } from '../../components/organisms/EncounterTimeline'
import { AllergyForm } from '../../components/organisms/Assessment/Allergy/AllergyForm'
import { MedicationForm } from '../../components/organisms/Assessment/Medication/MedicationForm'
import { PastDiseaseForm } from '../../components/organisms/Assessment/PastDisease/PastDiseaseForm'
import { FamilyHistoryForm } from '../../components/organisms/Assessment/FamilyHistory/FamilyHistoryForm'
import { PhysicalAssessmentForm } from '../../components/organisms/Assessment/PhysicalAssessment/PhysicalAssessmentForm'
import { RiwayatPerjalananPenyakitForm } from '../../components/organisms/Assessment/RiwayatPerjalananPenyakitForm'
import { RasionalKlinisForm } from '../../components/organisms/Assessment/RasionalKlinisForm'
import { FunctionalAssessmentForm } from '../../components/organisms/Assessment/FunctionalAssessment/FunctionalAssessmentForm'
import { GoalForm } from '@renderer/components/organisms/Assessment/Goal/GoalForm'
import { CarePlanForm } from '@renderer/components/organisms/Assessment/Careplan/CarePlanForm'
import { PrognosisForm } from '@renderer/components/organisms/Assessment/Prognosis/PrognosisForm'
import DentalPage from '../../components/organisms/Assessment/Dental'
import { GeneralSOAPForm } from '@renderer/components/organisms/Assessment/GeneralSOAP/GeneralSOAPForm'
import { DiagnosisForm } from '@renderer/components/organisms/Assessment/Diagnosis/DiagnosisForm'
import { ProceduresForm } from '@renderer/components/organisms/Assessment/Procedure/ProceduresForm'
import { EducationForm } from '@renderer/components/organisms/Assessment/Education/EducationForm'
import { NutritionOrderForm } from '@renderer/components/organisms/Assessment/NutritionOrder/NutritionOrderForm'
import { PrescriptionForm } from '@renderer/components/organisms/Assessment/Prescription/PrescriptionForm'
import { LabRadOrderForm } from '@renderer/components/organisms/LabRadOrderForm'
import { DiagnosticResultViewer } from '@renderer/components/organisms/DiagnosticResultViewer'
import { ReferralForm } from '@renderer/components/organisms/ReferralForm'
import { ClinicalNoteForm } from '@renderer/components/organisms/Assessment/ClinicalNote/ClinicalNoteForm'
import { AntenatalCareForm } from '@renderer/components/organisms/Assessment/AntenatalCare/AntenatalCareForm'
import { OphthalmologyForm } from '@renderer/components/organisms/Assessment/Ophthalmology/OphthalmologyForm'
import { DermatologyForm } from '@renderer/components/organisms/Assessment/Dermatology/DermatologyForm'
import { CardiologyForm } from '@renderer/components/organisms/Assessment/Cardiology/CardiologyForm'
import { ENTForm } from '@renderer/components/organisms/Assessment/ENT/ENTForm'
import { FallRiskAssessmentForm } from '@renderer/components/organisms/Assessment/FallRiskAssessment/FallRiskAssessmentForm'
import { DischargeSummaryForm } from '@renderer/components/organisms/DischargeSummaryForm'
import { AnamnesisForm } from '@renderer/components/organisms/Assessment/Anamnesis/AnamnesisForm'
import { PatientMedicalHistoryTab } from './patient-medical-history-tab'

import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'
import { InstruksiMedikForm } from '@renderer/components/organisms/Assessment/Careplan/InstruksiMedikForm'

interface DoctorOutpatientWorkspaceProps {
  encounterId: string
  patientData: any
  patientInfoCardData: any
  onEditStatus: () => void
}

export const DoctorOutpatientWorkspace = ({
  encounterId,
  patientData,
  patientInfoCardData,
  onEditStatus
}: DoctorOutpatientWorkspaceProps) => {
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
        key: 'assessment',
        icon: <SolutionOutlined />,
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
        key: 'general-soap',
        icon: <FileTextOutlined />,
        label: 'SOAP Umum'
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
          { key: 'prescription', label: 'E-Resep' },
          { key: 'risk-assessment', label: 'Penilaian Risiko' }
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
          { key: 'discharge-summary', label: 'Resume Medis' }
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
            <MedicineBoxOutlined style={{ color: token.colorPrimary }} />
            <span>Rawat Jalan — Pilih Form</span>
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
        <Layout.Sider
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
                />
              ) : (
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MedicineBoxOutlined style={{ color: token.colorPrimary }} />
                  <span style={{ color: token.colorText }}>Rawat Jalan</span>
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
        </Layout.Sider>
        <Layout>
          <Layout.Content className="p-6 overflow-y-auto h-full">
            {(() => {
              switch (selectedKey) {
                case 'info':
                  return (
                    <PatientInfoCard
                      patientData={patientInfoCardData}
                      onEditStatus={onEditStatus}
                    />
                  )
                case 'medical-history':
                  return <PatientMedicalHistoryTab patientId={patientData?.patient?.id} />
                case 'overview':
                  return <EncounterTimeline encounterId={encounterId || ''} />
                case 'anamnesis':
                  return <AnamnesisForm encounterId={encounterId!} patientData={patientData} />
                case 'past-disease':
                  return <PastDiseaseForm encounterId={encounterId!} patientData={patientData} />
                case 'clinical-course':
                  return (
                    <RiwayatPerjalananPenyakitForm
                      encounterId={encounterId!}
                      patientData={patientData}
                    />
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
                  return (
                    <PhysicalAssessmentForm encounterId={encounterId!} patientData={patientData} />
                  )
                case 'functional-assessment':
                  return (
                    <FunctionalAssessmentForm
                      encounterId={encounterId!}
                      patientData={patientData}
                    />
                  )
                case 'care-goal':
                  return <GoalForm encounterId={encounterId || ''} patientData={patientData} />
                case 'care-plan':
                  return <CarePlanForm encounterId={encounterId || ''} patientData={patientData} />
                case 'instruksi-medik':
                  return <InstruksiMedikForm encounterId={encounterId} patientData={patientData} />
                case 'prognosis':
                  return <PrognosisForm encounterId={encounterId || ''} patientData={patientData} />
                case 'dental-assessment':
                  return (
                    <DentalPage encounterId={encounterId!} patientId={patientData.patient.id} />
                  )
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
                case 'general-soap':
                  return (
                    <GeneralSOAPForm encounterId={encounterId || ''} patientData={patientData} />
                  )
                case 'diagnosis':
                  return <DiagnosisForm encounterId={encounterId || ''} patientData={patientData} />
                case 'procedures':
                  return (
                    <ProceduresForm encounterId={encounterId || ''} patientData={patientData} />
                  )
                case 'education':
                  return <EducationForm encounterId={encounterId || ''} patientData={patientData} />
                case 'nutrition-order':
                  return (
                    <NutritionOrderForm encounterId={encounterId || ''} patientData={patientData} />
                  )
                case 'prescription':
                  return (
                    <PrescriptionForm encounterId={encounterId || ''} patientData={patientData} />
                  )
                case 'risk-assessment':
                  return (
                    <FallRiskAssessmentForm
                      encounterId={encounterId || ''}
                      patientId={patientData?.patient?.id}
                    />
                  )
                case 'lab-rad-order':
                  return (
                    <LabRadOrderForm encounterId={encounterId || ''} patientData={patientData} />
                  )
                case 'results':
                  return (
                    <DiagnosticResultViewer
                      encounterId={encounterId || ''}
                      patientId={patientData?.patient.id}
                    />
                  )
                case 'referral':
                  return (
                    <ReferralForm
                      encounterId={encounterId || ''}
                      patientId={patientData?.patient.id}
                      patientData={patientData}
                    />
                  )
                case 'discharge-summary':
                  return (
                    <DischargeSummaryForm
                      encounterId={encounterId || ''}
                      patientData={patientData}
                    />
                  )
                case 'notes':
                  return <ClinicalNoteForm encounterId={encounterId || ''} />
                default:
                  return <div>Halaman tidak ditemukan</div>
              }
            })()}
          </Layout.Content>
        </Layout>
      </Layout>
    </div>
  )
}
