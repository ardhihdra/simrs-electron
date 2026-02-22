import { useState } from 'react'
import { Layout, Menu, theme } from 'antd'
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
import { EncounterTimeline } from '../../components/organisms/EncounterTimeline'
import { AnamnesisForm } from '../../components/organisms/Assessment/AnamnesisForm'
import { PhysicalAssessmentForm } from '../../components/organisms/Assessment/PhysicalAssessmentForm'
import DentalPage from '../../components/organisms/Dental'
import { GeneralSOAPForm } from '@renderer/components/organisms/GeneralSOAPForm'
import { DiagnosisProceduresForm } from '@renderer/components/organisms/DiagnosisProceduresForm'
import { PrescriptionForm } from '@renderer/components/organisms/PrescriptionForm'
import { LabRadOrderForm } from '@renderer/components/organisms/LabRadOrderForm'
import { DiagnosticResultViewer } from '@renderer/components/organisms/DiagnosticResultViewer'
import { ReferralForm } from '@renderer/components/organisms/ReferralForm'
import { ClinicalNoteForm } from '@renderer/components/organisms/ClinicalNoteForm'

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

  return (
    <Layout className="rounded-lg overflow-hidden h-full border border-white/10">
      <Layout.Sider
        width={260}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        className="border-r border-gray-200 dark:border-white/10"
        trigger={
          <div className="flex items-center justify-center h-12 border-t border-gray-200 dark:border-white/10 text-gray-500 hover:text-blue-600 transition-colors">
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        }
      >
        <div className="h-full flex flex-col">
          <div className={`p-4 ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? (
              <MedicineBoxOutlined className="text-xl text-blue-600" />
            ) : (
              <div className="font-bold flex items-center gap-2">
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
                    { key: 'anamnesis', label: 'Anamnesis' },
                    { key: 'physical-assessment', label: 'Pemeriksaan Fisik' },
                    { key: 'dental-assessment', label: 'Pemeriksaan Gigi' }
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
                return <DentalPage encounterId={encounterId!} patientId={patientData.patient.id} />
              case 'general-soap':
                return <GeneralSOAPForm encounterId={encounterId || ''} patientData={patientData} />
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
