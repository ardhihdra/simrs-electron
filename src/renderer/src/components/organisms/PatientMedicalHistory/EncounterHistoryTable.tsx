import React, { useState } from 'react'
import {
  Table,
  Card,
  Button,
  DatePicker,
  Select,
  Popover,
  Typography,
  theme,
  Modal,
  Tag,
  Descriptions
} from 'antd'
import {
  EyeOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  ProfileOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { usePatientEncountersPg } from '@renderer/hooks/query/use-patient-history'
import { ClinicalHistoryModal } from './ClinicalHistoryModal'

const { Text } = Typography
const { RangePicker } = DatePicker

interface EncounterHistoryTableProps {
  patientId: string
  onRowClick?: (record: any) => void
}

/**
 * Maps DB enum values (AMB, IMP, EMER) to display labels.
 */
const ENCOUNTER_TYPE_LABEL: Record<string, string> = {
  AMB: 'Rawat Jalan',
  IMP: 'Rawat Inap',
  EMER: 'IGD',
}

function getTypeLabel(type: string): string {
  return ENCOUNTER_TYPE_LABEL[type] ?? type
}

function getTypeColor(type: string): string {
  if (type === 'AMB') return 'blue'
  if (type === 'IMP') return 'green'
  if (type === 'EMER') return 'red'
  return 'default'
}

export const EncounterHistoryTable: React.FC<EncounterHistoryTableProps> = ({
  patientId,
  onRowClick
}) => {
  const { token } = theme.useToken()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [encounterType, setEncounterType] = useState<string | undefined>(undefined)

  const [soapModalOpen, setSoapModalOpen] = useState(false)
  const [labModalOpen, setLabModalOpen] = useState(false)
  const [clinicalModalOpen, setClinicalModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const { data, isLoading } = usePatientEncountersPg({
    patientId,
    page,
    pageSize,
    type: encounterType,
    doctorId: undefined,
    dateFrom: dateRange?.[0] ? dateRange[0].toISOString() : undefined,
    dateTo: dateRange?.[1] ? dateRange[1].toISOString() : undefined
  })

  const columns = [
    {
      title: 'Tanggal & Waktu',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {dayjs(text).format('DD MMM YYYY')}
          </div>
          <div style={{ fontSize: 11, color: token.colorTextTertiary }}>
            {dayjs(text).format('HH:mm')}
          </div>
        </div>
      ),
      width: 130
    },
    {
      title: 'Unit Layanan',
      dataIndex: 'serviceUnit',
      key: 'serviceUnit',
      width: 150,
      render: (text: string) => (
        <span style={{ fontSize: 13 }}>{text || '-'}</span>
      )
    },
    {
      title: 'Dokter Pemeriksa',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 180,
      render: (text: string) => (
        <span style={{ fontSize: 13 }}>{text || '-'}</span>
      )
    },
    {
      title: 'Jenis',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (text: string) => (
        <Tag color={getTypeColor(text)} bordered={false}>
          {getTypeLabel(text)}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (text: string) => {
        const statusConfig: Record<string, { label: string; color: string }> = {
          IN_PROGRESS: { label: 'Berlangsung', color: 'orange' },
          FINISHED: { label: 'Selesai', color: 'green' },
          CANCELLED: { label: 'Dibatalkan', color: 'red' },
          DISCHARGED: { label: 'Pulang', color: 'blue' },
          PLANNED: { label: 'Terjadwal', color: 'default' },
        }
        const cfg = statusConfig[text]
        return cfg ? (
          <Tag color={cfg.color} bordered={false}>{cfg.label}</Tag>
        ) : (
          <span>{text || '-'}</span>
        )
      }
    },
    {
      title: 'Diagnosis Utama',
      dataIndex: 'primaryDiagnosis',
      key: 'primaryDiagnosis',
      width: 200,
      render: (text: string, record: any) => (
        <Popover
          content={
            <div style={{ maxWidth: 350 }}>
              <div className="font-semibold mb-1">Diagnosis Utama</div>
              <div className="mb-2">{text || 'Tidak ada'}</div>
              {record.soapSummary && (
                <>
                  <div className="font-semibold mb-1">SOAP Ringkas</div>
                  <div className="whitespace-pre-wrap text-sm">{record.soapSummary}</div>
                </>
              )}
            </div>
          }
          title="Quick Preview"
          trigger="hover"
          placement="topLeft"
        >
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="truncate max-w-[180px]" style={{ color: token.colorPrimary, fontSize: 13 }}>
              {text || 'Tidak ada spesifikasi'}
            </span>
            <InfoCircleOutlined className="text-gray-400" />
          </div>
        </Popover>
      )
    },
    {
      title: 'Lab/Obs',
      key: 'observations',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const obsCount = record.clinicals?.observations?.length ?? 0
        return obsCount > 0 ? (
          <Tag color="cyan" bordered={false}>{obsCount}</Tag>
        ) : (
          <span style={{ color: token.colorTextTertiary, fontSize: 12 }}>-</span>
        )
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            title="Lihat Detail Kunjungan"
            onClick={(e) => {
              e.stopPropagation()
              if (onRowClick) onRowClick(record)
            }}
          />
          <Button
            type="text"
            icon={<FileTextOutlined />}
            size="small"
            title="Lihat SOAP"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRecord(record)
              setSoapModalOpen(true)
            }}
          />
          <Button
            type="text"
            icon={<ExperimentOutlined />}
            size="small"
            title="Hasil Observasi / Lab"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRecord(record)
              setLabModalOpen(true)
            }}
          />
          <Button
            type="text"
            icon={<ProfileOutlined />}
            size="small"
            title="Riwayat Klinis Komprehensif"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRecord(record)
              setClinicalModalOpen(true)
            }}
          />
        </div>
      )
    }
  ]

  // Map real observation data for Lab modal
  const observationColumns = [
    { title: 'Pemeriksaan', dataIndex: 'display', key: 'display',
      render: (_: any, row: any) => row.codeCoding?.display || row.observationCode || '-' },
    { title: 'Hasil', dataIndex: 'result', key: 'result',
      render: (_: any, row: any) => {
        const vq = row.valueQuantity
        if (vq && typeof vq === 'object') {
          return `${vq.value ?? ''} ${vq.unit ?? ''}`.trim()
        }
        return row.valueString || '-'
      }
    },
    { title: 'Tanggal', dataIndex: 'effectiveDateTime', key: 'effectiveDateTime',
      render: (val: string) => val ? dayjs(val).format('DD MMM YYYY, HH:mm') : '-' }
  ]

  return (
    <Card
      className="shadow-sm mb-4"
      title="Riwayat Kunjungan"
      extra={
        <Button icon={<FilterOutlined />} type="text">
          Advanced Filters
        </Button>
      }
    >
      <div className="flex flex-wrap gap-4 mb-4">
        <RangePicker
          className="w-64"
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
        <Select
          placeholder="Jenis Kunjungan"
          allowClear
          style={{ width: 160 }}
          onChange={(value) => setEncounterType(value)}
          options={[
            { value: 'AMB', label: 'Rawat Jalan' },
            { value: 'IMP', label: 'Rawat Inap' },
            { value: 'EMER', label: 'IGD' }
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data?.result?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.result?.total || 0,
          showSizeChanger: true,
          onChange: (pg, ps) => {
            setPage(pg)
            setPageSize(ps)
          }
        }}
        onRow={(record) => ({
          onClick: () => {
            if (onRowClick) onRowClick(record)
          },
          className: 'cursor-pointer hover:bg-gray-50'
        })}
        size="small"
        scroll={{ x: 1100 }}
      />

      {/* SOAP Modal */}
      <Modal
        open={soapModalOpen}
        title="Catatan SOAP"
        onCancel={() => setSoapModalOpen(false)}
        footer={null}
      >
        <div className="whitespace-pre-wrap font-mono text-sm p-4 rounded border border-gray-100 bg-gray-50">
          {selectedRecord?.soapSummary || 'Tidak ada catatan SOAP untuk kunjungan ini.'}
        </div>
      </Modal>

      {/* Observations / Lab Modal — real data from API */}
      <Modal
        open={labModalOpen}
        title={
          <div>
            <div>Hasil Observasi / Laboratorium</div>
            <div style={{ fontSize: 12, fontWeight: 400, color: token.colorTextSecondary }}>
              {selectedRecord?.date ? dayjs(selectedRecord.date).format('DD MMM YYYY, HH:mm') : ''}{' '}
              {selectedRecord?.serviceUnit ? `• ${selectedRecord.serviceUnit}` : ''}
            </div>
          </div>
        }
        onCancel={() => setLabModalOpen(false)}
        footer={null}
        width={640}
      >
        {(() => {
          const obs: any[] = selectedRecord?.clinicals?.observations ?? []
          if (obs.length === 0) {
            return (
              <div style={{ color: token.colorTextSecondary, textAlign: 'center', padding: '24px 0' }}>
                Tidak ada data observasi/laboratorium untuk kunjungan ini.
              </div>
            )
          }
          return (
            <Table
              dataSource={obs}
              rowKey="id"
              columns={observationColumns}
              pagination={false}
              size="small"
            />
          )
        })()}
      </Modal>

      <ClinicalHistoryModal
        open={clinicalModalOpen}
        onCancel={() => setClinicalModalOpen(false)}
        record={selectedRecord}
      />
    </Card>
  )
}
