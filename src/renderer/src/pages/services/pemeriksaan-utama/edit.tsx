import { Button, Descriptions, Tabs, TabsProps } from 'antd'
import PemeriksaanUtamaTable from './table'
import { SubjectiveTab } from './subjective-tab'
import { ObjectiveTab } from './objective-tab'
import AssessmentTab from './assessment-tab'
import { PasienKontrolTab } from './pasien-kontrol-tab'
import { PlanTab } from './plan-tab'
import { PerawatanTab } from './perawatan-tab'
import { LabolatoriumTab } from './labolatorium-tab'
import { ResepElektronikTab } from './resep-elektronik-tab'

const items: TabsProps['items'] = [
  {
    label: 'Subjective',
    key: 'subjective',
    children: <SubjectiveTab />
  },
  {
    label: 'Objective',
    key: 'objective',
    children: <ObjectiveTab />
  },
  {
    label: 'Assessment',
    key: 'assessment',
    children: <AssessmentTab />
  },
  {
    label: 'Plan',
    key: 'plan',
    children: <PlanTab />
  },
  {
    label: 'Pasien Kontrol',
    key: 'pasien-kontrol',
    children: <PasienKontrolTab />
  },
  {
    label: 'Perawatan Tindakan',
    key: 'perawatan-tindakan',
    children: <PerawatanTab />
  },
  {
    label: 'Laboratorium',
    key: 'laboratorium',
    children: <LabolatoriumTab />
  },
  {
    label: 'Resep Elektronik',
    key: 'resep-elektronik',
    children: <ResepElektronikTab />
  },
  {
    label: 'Surat Rujukan',
    key: 'surat-rujukan',
    children: (
      <div>
        <Button>Buka Surat Rujukan</Button>
      </div>
    )
  }
]

export default function PemeriksaanUtamaEditPage() {
  return (
    <div>
      <div className="mb-4">
        <Descriptions title="Data Pasien" bordered>
          <Descriptions.Item label="Nama">John Doe</Descriptions.Item>
          <Descriptions.Item label="No RM">123456789</Descriptions.Item>
          <Descriptions.Item label="Tanggal Lahir">1990-01-01</Descriptions.Item>
          <Descriptions.Item label="Jenis Kelamin">Laki-laki</Descriptions.Item>
          <Descriptions.Item label="Alamat">Jl. Test No. 123</Descriptions.Item>
        </Descriptions>
      </div>
      <Tabs items={items} />
    </div>
  )
}
