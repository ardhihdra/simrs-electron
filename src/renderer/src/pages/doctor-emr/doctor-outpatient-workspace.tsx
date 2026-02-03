import { useState } from 'react'
import { Layout, Menu, theme, Collapse } from 'antd'
import {
  MonitorOutlined,
  SolutionOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  ExportOutlined,
  FormOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons'
import { NurseAssessmentSummary } from '@renderer/components/organisms/NurseAssessmentSummary'
import { EncounterTimeline } from '../../components/organisms/EncounterTimeline'
import { InitialAssessmentForm } from '../../components/organisms/Assessment/InitialAssessmentForm'
import { DentalAssessmentForm } from '../../components/organisms/Assessment/DentalAssessmentForm'
import { CPPTForm } from '@renderer/components/organisms/CPPTForm'
import { DiagnosisProceduresForm } from '@renderer/components/organisms/DiagnosisProceduresForm'
import { PrescriptionForm } from '@renderer/components/organisms/PrescriptionForm'
import { LabRadOrderForm } from '@renderer/components/organisms/LabRadOrderForm'
import { DiagnosticResultViewer } from '@renderer/components/organisms/DiagnosticResultViewer'
import { ReferralForm } from '@renderer/components/organisms/ReferralForm'
import { ClinicalNoteForm } from '@renderer/components/organisms/ClinicalNoteForm'
import { useObservationByEncounter } from '@renderer/hooks/query/use-observation'
import { useConditionByEncounter } from '@renderer/hooks/query/use-condition'

interface DoctorOutpatientWorkspaceProps {
  encounterId: string
  patientData: any
}

export const DoctorOutpatientWorkspace = ({
  encounterId,
  patientData
}: DoctorOutpatientWorkspaceProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('overview')
  const {
    token: { colorBgContainer }
  } = theme.useToken()

  const { data: obsData } = useObservationByEncounter(encounterId || '')
  const { data: condData } = useConditionByEncounter(encounterId || '')

  const hasNurseAssessment =
    (obsData?.result?.all?.length || 0) > 0 || (condData?.result?.length || 0) > 0

  return (
    <Layout className="rounded-lg overflow-hidden h-full border border-gray-200">
      <Layout.Sider
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
              <MedicineBoxOutlined className="text-xl text-blue-600" />
            ) : (
              <div className="font-bold text-gray-700 flex items-center gap-2">
                <MedicineBoxOutlined className="text-blue-600" />
                Rawat Jalan
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <Menu
              mode="inline"
              defaultSelectedKeys={['overview']}
              defaultOpenKeys={['assessment', 'orders']}
              style={{ borderRight: 0 }}
              items={[
                {
                  key: 'overview',
                  icon: <MonitorOutlined />,
                  label: 'Ringkasan & Timeline'
                },
                {
                  key: 'assessment',
                  icon: <SolutionOutlined />,
                  label: 'Asesmen Pasien',
                  children: [
                    { key: 'initial-assessment', label: '* Anamnesis & Fisik' },
                    { key: 'dental-assessment', label: '* Pemeriksaan Gigi' }
                  ]
                },
                {
                  key: 'cppt',
                  icon: <FileTextOutlined />,
                  label: 'CPPT (SOAP)'
                },
                {
                  key: 'orders',
                  icon: <MedicineBoxOutlined />,
                  label: 'Tindakan & Terapi',
                  children: [
                    { key: 'diagnosis-procedure', label: 'Diagnosis & Tindakan' },
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
                  children: [{ key: 'referral', label: 'Rujukan' }]
                },
                {
                  key: 'notes',
                  icon: <FormOutlined />,
                  label: 'Catatan Tambahan'
                }
              ]}
              onSelect={({ key }) => setSelectedKey(key)}
            />
          </div>
        </div>
      </Layout.Sider>
      <Layout>
        <Layout.Content
          className="p-6 overflow-y-auto h-full"
          style={{
            background: colorBgContainer,
            minHeight: 280
          }}
        >
          {(() => {
            switch (selectedKey) {
              case 'overview':
                return <EncounterTimeline encounterId={encounterId || ''} />
              case 'initial-assessment':
                return (
                  <div className="space-y-4">
                    {hasNurseAssessment && (
                      <div className="mb-4">
                        <Collapse
                          ghost
                          items={[
                            {
                              key: 'nurse-summary',
                              label: (
                                <div className="flex items-center gap-2 text-blue-600 font-medium">
                                  <SolutionOutlined />
                                  <span>Lihat Hasil Pemeriksaan Awal Perawat</span>
                                </div>
                              ),
                              children: (
                                <NurseAssessmentSummary
                                  encounterId={encounterId || ''}
                                  patientId={patientData?.patient.id}
                                  mode="outpatient"
                                />
                              )
                            }
                          ]}
                        />
                      </div>
                    )}
                    <InitialAssessmentForm
                      encounterId={encounterId!}
                      patientData={patientData}
                      mode="outpatient"
                      performer={{
                        id: (patientData as any).doctorId || 'doc-default',
                        name: (patientData as any).doctorName || 'Dokter',
                        role: 'Doctor'
                      }}
                    />
                  </div>
                )
              case 'dental-assessment':
                return <DentalAssessmentForm encounterId={encounterId!} patientData={patientData} />
              case 'cppt':
                return <CPPTForm encounterId={encounterId || ''} patientData={patientData} />
              case 'diagnosis-procedure':
                return (
                  <DiagnosisProceduresForm
                    encounterId={encounterId || ''}
                    patientData={patientData}
                  />
                )
              case 'prescription':
                return (
                  <PrescriptionForm encounterId={encounterId || ''} patientData={patientData} />
                )
              case 'lab-rad-order':
                return <LabRadOrderForm encounterId={encounterId || ''} patientData={patientData} />
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
              case 'notes':
                return <ClinicalNoteForm encounterId={encounterId || ''} />
              default:
                return <div>Halaman tidak ditemukan</div>
            }
          })()}
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
