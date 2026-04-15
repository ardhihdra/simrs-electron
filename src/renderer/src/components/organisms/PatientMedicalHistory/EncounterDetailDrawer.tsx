import React from 'react'
import { Drawer, Typography, Descriptions, Divider, Tag, Table } from 'antd'
import { EncounterTimeline } from '@renderer/components/organisms/EncounterTimeline'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface EncounterDetailDrawerProps {
  open: boolean
  onClose: () => void
  encounterData: any
}

const statusConfig: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'Berlangsung', color: 'orange' },
  FINISHED: { label: 'Selesai', color: 'green' },
  CANCELLED: { label: 'Dibatalkan', color: 'red' },
  DISCHARGED: { label: 'Pulang', color: 'blue' },
  PLANNED: { label: 'Terjadwal', color: 'default' },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  AMB: { label: 'Rawat Jalan', color: 'blue' },
  IMP: { label: 'Rawat Inap', color: 'green' },
  EMER: { label: 'IGD', color: 'red' },
}

export const EncounterDetailDrawer: React.FC<EncounterDetailDrawerProps> = ({
  open,
  onClose,
  encounterData
}) => {
  if (!encounterData) return null

  const typeCfg = typeConfig[encounterData.type]
  const stsCfg = statusConfig[encounterData.status]

  const observations: any[] = encounterData.clinicals?.observations ?? []
  const conditions: any[] = encounterData.clinicals?.conditions ?? []
  const procedures: any[] = encounterData.clinicals?.procedures ?? []
  const medications: any[] = encounterData.clinicals?.medications ?? []

  return (
    <Drawer
      title="Detail Kunjungan Medis"
      width={720}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      <div className="flex flex-col gap-5">
        {/* === Informasi Utama Encounter === */}
        <Title level={5} style={{ marginBottom: 8 }}>Informasi Kunjungan</Title>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Tanggal Kunjungan" span={2}>
            {encounterData.date ? dayjs(encounterData.date).format('DD MMM YYYY, HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Unit Layanan">
            {encounterData.serviceUnit || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Dokter Pemeriksa">
            {encounterData.doctorName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Jenis Kunjungan">
            {typeCfg ? (
              <Tag color={typeCfg.color} bordered={false}>{typeCfg.label}</Tag>
            ) : (
              <Text>{encounterData.type || '-'}</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {stsCfg ? (
              <Tag color={stsCfg.color} bordered={false}>{stsCfg.label}</Tag>
            ) : (
              <Text>{encounterData.status || '-'}</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Diagnosis Utama" span={2}>
            {encounterData.primaryDiagnosis || 'Tidak ada diagnosis tercatat'}
          </Descriptions.Item>
        </Descriptions>

        <Divider className="my-1" />

        {/* === SOAP Summary === */}
        <Title level={5} style={{ marginBottom: 8 }}>Catatan SOAP</Title>
        <div className="whitespace-pre-wrap p-3 bg-gray-50 rounded text-sm text-gray-700 font-mono border border-gray-100">
          {encounterData.soapSummary || 'Tidak ada catatan SOAP ringkas untuk kunjungan ini.'}
        </div>

        {/* === Kondisi / Diagnosis === */}
        {conditions.length > 0 && (
          <>
            <Divider className="my-1" />
            <Title level={5} style={{ marginBottom: 8 }}>Daftar Diagnosis ({conditions.length})</Title>
            <Table
              dataSource={conditions}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Diagnosis', dataIndex: 'note', key: 'note', render: (v: string, row: any) => v || row.identifier || '-' },
                { title: 'Status Klinis', dataIndex: 'clinicalStatus', key: 'clinicalStatus', width: 120 }
              ]}
            />
          </>
        )}

        {/* === Observasi / Lab === */}
        {observations.length > 0 && (
          <>
            <Divider className="my-1" />
            <Title level={5} style={{ marginBottom: 8 }}>Observasi / Lab ({observations.length})</Title>
            <Table
              dataSource={observations}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Pemeriksaan',
                  key: 'display',
                  render: (_: any, row: any) => row.codeCoding?.display || row.observationCode || '-'
                },
                {
                  title: 'Hasil',
                  key: 'result',
                  render: (_: any, row: any) => {
                    const vq = row.valueQuantity
                    if (vq && typeof vq === 'object') {
                      return `${vq.value ?? ''} ${vq.unit ?? ''}`.trim()
                    }
                    return row.valueString || '-'
                  }
                },
                {
                  title: 'Tanggal',
                  dataIndex: 'effectiveDateTime',
                  key: 'effectiveDateTime',
                  width: 160,
                  render: (val: string) => val ? dayjs(val).format('DD MMM YYYY, HH:mm') : '-'
                }
              ]}
            />
          </>
        )}

        {/* === Prosedur === */}
        {procedures.length > 0 && (
          <>
            <Divider className="my-1" />
            <Title level={5} style={{ marginBottom: 8 }}>Prosedur ({procedures.length})</Title>
            <Table
              dataSource={procedures}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Kode / Nama', dataIndex: 'identifier', key: 'identifier', render: (v: string) => v || '-' },
                { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
                { title: 'Tanggal', dataIndex: 'performedDateTime', key: 'performedDateTime', width: 160,
                  render: (val: string) => val ? dayjs(val).format('DD MMM YYYY') : '-' }
              ]}
            />
          </>
        )}

        {/* === Obat === */}
        {medications.length > 0 && (
          <>
            <Divider className="my-1" />
            <Title level={5} style={{ marginBottom: 8 }}>Permintaan Obat ({medications.length})</Title>
            <Table
              dataSource={medications}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
                { title: 'Intent', dataIndex: 'intent', key: 'intent', width: 120 },
                { title: 'Prioritas', dataIndex: 'priority', key: 'priority', width: 100 }
              ]}
            />
          </>
        )}

        <Divider className="my-1" />

        {/* === Timeline === */}
        <Title level={5} style={{ marginBottom: 8 }}>Timeline Rinci</Title>
        <EncounterTimeline encounterId={encounterData.id} />
      </div>
    </Drawer>
  )
}
