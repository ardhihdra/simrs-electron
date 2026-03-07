import React from 'react'
import { Drawer, Typography, Descriptions, Divider } from 'antd'
import { EncounterTimeline } from '@renderer/components/organisms/EncounterTimeline'

const { Title, Text } = Typography

interface EncounterDetailDrawerProps {
  open: boolean
  onClose: () => void
  encounterData: any // In a real app, you would pass the whole object or fetch by ID
}

export const EncounterDetailDrawer: React.FC<EncounterDetailDrawerProps> = ({
  open,
  onClose,
  encounterData
}) => {
  if (!encounterData) return null

  // Currently, the timeline provides a good summary of the events
  return (
    <Drawer
      title="Detail Kunjungan Medis"
      width={700}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <div className="flex flex-col gap-4">
        <Title level={5}>Basic Info</Title>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Tanggal">{encounterData.date}</Descriptions.Item>
          <Descriptions.Item label="Unit Layanan">{encounterData.serviceUnit}</Descriptions.Item>
          <Descriptions.Item label="Dokter">{encounterData.doctorName}</Descriptions.Item>
          <Descriptions.Item label="Jenis">
            <Text style={{ textTransform: 'capitalize' }}>{encounterData.type}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Diagnosis Utama">
            {encounterData.primaryDiagnosis}
          </Descriptions.Item>
        </Descriptions>

        <Divider className="my-2" />

        <Title level={5}>SOAP Ringkas</Title>
        <div className="whitespace-pre-wrap p-3 bg-gray-50 rounded text-sm text-gray-700 font-mono">
          {encounterData.soapSummary || 'Tidak ada catatan SOAP ringkas untuk kunjungan ini.'}
        </div>

        <Divider className="my-2" />

        <Title level={5}>Timeline Rinci</Title>
        {/* Reusing existing Timeline component to show all items */}
        <EncounterTimeline encounterId={encounterData.id} />
      </div>
    </Drawer>
  )
}
