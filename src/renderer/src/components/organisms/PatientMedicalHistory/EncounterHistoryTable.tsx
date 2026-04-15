import React, { useState } from 'react'
import {
  Table,
  Card,
  Button,
  DatePicker,
  Select,
  Popover,
  theme,
  Modal,
  Tag
} from 'antd'
import {
  EyeOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  FilterOutlined,
  ProfileOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { usePatientEncountersPg } from '@renderer/hooks/query/use-patient-history'
import { ClinicalHistoryModal } from './ClinicalHistoryModal'
import { resolveObservationDisplay } from './diagnosticDisplay'

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

function getDiagnosticCategoryLabel(category: string | null | undefined): string {
  const normalized = String(category || '').trim().toLowerCase()
  if (normalized === 'laboratory' || normalized === 'lab') return 'Laboratory'
  if (normalized === 'radiology' || normalized === 'imaging' || normalized === 'rad') return 'Radiology'
  return ''
}

function getDiagnosticCategoryColor(label: string): string {
  if (label === 'Laboratory') return 'blue'
  if (label === 'Radiology') return 'geekblue'
  return 'default'
}

function resolveDiagnosticCategoryLabel(row: any): string {
  return getDiagnosticCategoryLabel(
    row?.diagnosticCategory ||
      row?.diagnosticCategoryDisplay ||
      row?.category ||
      row?.categoryDisplay ||
      row?.categories?.[0]?.code ||
      row?.categories?.[0]?.display
  )
}

function resolveDiagnosticResultLabel(row: any): string {
  const coding = Array.isArray(row?.codeCoding) ? row.codeCoding[0] : row?.codeCoding
  return resolveObservationDisplay({
    observationCode: row?.observationCode || row?.code,
    preferredDisplay: row?.observationDisplay,
    codingDisplay: coding?.display,
    orderDisplay: row?.matchedOrderDisplay,
    fallbackDisplay: row?.display
  })
}

function resolveDiagnosticResultValue(row: any): string {
  const vq = row?.valueQuantity
  if (vq && typeof vq === 'object') {
    return `${vq.value ?? ''} ${vq.unit ?? row?.valueUnitCode ?? ''}`.trim() || '-'
  }
  if (row?.valueString) return row.valueString
  if (row?.valueInteger !== undefined && row?.valueInteger !== null) return String(row.valueInteger)
  if (row?.valueBoolean !== undefined && row?.valueBoolean !== null) return row.valueBoolean ? 'Ya' : 'Tidak'
  const concept = row?.valueCodeableConcept
  if (concept && typeof concept === 'object') {
    const coding = Array.isArray(concept.coding) ? concept.coding[0] : undefined
    return concept.text || coding?.display || coding?.code || '-'
  }
  return '-'
}

function resolveDiagnosticReferenceRange(row: any): string {
  const referenceRange = row?.referenceRange
  if (Array.isArray(referenceRange)) {
    const text = typeof referenceRange[0]?.text === 'string' ? referenceRange[0].text.trim() : ''
    if (text) return text
  } else if (referenceRange && typeof referenceRange === 'object') {
    const text = typeof referenceRange.text === 'string' ? referenceRange.text.trim() : ''
    if (text) return text
  } else if (typeof referenceRange === 'string' && referenceRange.trim()) {
    return referenceRange.trim()
  }

  if (typeof row?.referenceRangeText === 'string' && row.referenceRangeText.trim()) {
    return row.referenceRangeText.trim()
  }
  return '-'
}

function formatValueWithUnit(raw: unknown, fallbackUnit = 'mg'): string | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return `${raw} ${fallbackUnit}`
  if (typeof raw === 'string') {
    const text = raw.trim()
    if (!text) return null
    if (/[a-zA-Z]/.test(text)) return text
    if (/^\d+([.,]\d+)?$/.test(text)) return `${text} ${fallbackUnit}`
    return text
  }
  return null
}

function resolveMedicationName(medication: any): string {
  const itemName = typeof medication?.item?.nama === 'string' ? medication.item.nama.trim() : ''
  if (itemName) return itemName

  const compoundName = typeof medication?.compoundName === 'string' ? medication.compoundName.trim() : ''
  if (compoundName) return `Racikan: ${compoundName}`

  if (typeof medication?.intent === 'string' && medication.intent.trim()) return medication.intent.trim()
  return `Resep #${medication?.id ?? '-'}`
}

function resolveDosageInstructionText(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const text = raw.trim()
    return text || null
  }
  if (Array.isArray(raw)) {
    const parts = raw
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim()
        if (entry && typeof entry === 'object') {
          const text = typeof (entry as any).text === 'string' ? (entry as any).text.trim() : ''
          if (text) return text
          const patientInstruction =
            typeof (entry as any).patientInstruction === 'string'
              ? (entry as any).patientInstruction.trim()
              : ''
          if (patientInstruction) return patientInstruction
        }
        return ''
      })
      .filter((value) => value.length > 0)
    return parts.length > 0 ? parts.join(' • ') : null
  }
  if (raw && typeof raw === 'object') {
    const text = typeof (raw as any).text === 'string' ? (raw as any).text.trim() : ''
    if (text) return text
    const patientInstruction =
      typeof (raw as any).patientInstruction === 'string'
        ? (raw as any).patientInstruction.trim()
        : ''
    if (patientInstruction) return patientInstruction
  }
  return null
}

function resolveMedicationStrength(medication: any): string | null {
  const directStrength = formatValueWithUnit(medication?.item?.kekuatan)
  if (directStrength) return directStrength

  const ingredients = Array.isArray(medication?.compoundIngredients) ? medication.compoundIngredients : []
  const ingredientStrengths = ingredients
    .map((ingredient: any) => formatValueWithUnit(ingredient?.kekuatan))
    .filter((val: string | null): val is string => Boolean(val))

  if (ingredientStrengths.length === 0) return null
  if (ingredientStrengths.length === 1) return ingredientStrengths[0]
  return ingredientStrengths.slice(0, 2).join(', ')
}

function resolveGeneralSoapSummary(generalSoap: any): string {
  if (!generalSoap) return 'Tidak ada catatan SOAP Umum untuk kunjungan ini.'
  const lines = [
    `S: ${generalSoap?.soapSubjective || '-'}`,
    `O: ${generalSoap?.soapObjective || '-'}`,
    `A: ${generalSoap?.soapAssessment || '-'}`,
    `P: ${generalSoap?.soapPlan || '-'}`
  ]
  return lines.join('\n')
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
      title: 'Jenis Lab/Rad',
      key: 'diagnosticType',
      width: 140,
      render: (_: any, record: any) => {
        const labels: string[] = Array.from(
          new Set<string>(
            [
              ...((record.diagnosticOrders || []).map((order: any) => resolveDiagnosticCategoryLabel(order))),
              ...((record.diagnosticResults || []).map((result: any) => resolveDiagnosticCategoryLabel(result)))
            ].filter((label: string): label is string => Boolean(label))
          )
        )

        if (labels.length === 0) {
          return <span style={{ color: token.colorTextTertiary, fontSize: 12 }}>-</span>
        }

        return (
          <div className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <Tag key={label} color={getDiagnosticCategoryColor(label)} bordered={false}>
                {label}
              </Tag>
            ))}
          </div>
        )
      }
    },
    {
      title: 'Resep',
      key: 'medicationSummary',
      width: 220,
      render: (_: any, record: any) => {
        const meds: any[] = Array.isArray(record?.clinicals?.medications)
          ? record.clinicals.medications
          : []

        if (meds.length === 0) {
          return <span style={{ color: token.colorTextTertiary, fontSize: 12 }}>-</span>
        }

        const preview = meds.slice(0, 2)
        const hiddenCount = meds.length - preview.length

        return (
          <Popover
            trigger="hover"
            placement="topLeft"
            title={`Resep (${meds.length})`}
            content={
              <div style={{ maxWidth: 420, display: 'grid', gap: 8 }}>
                {meds.map((medication: any) => {
                  const medName = resolveMedicationName(medication)
                  const dosage = resolveDosageInstructionText(medication?.dosageInstruction)
                  const strength = resolveMedicationStrength(medication)
                  return (
                    <div key={`med-${medication?.id}`} style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, paddingBottom: 6 }}>
                      <div style={{ fontWeight: 600 }}>{medName}</div>
                      <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                        {strength ? `Kekuatan: ${strength}` : 'Kekuatan: -'}
                      </div>
                      <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                        {dosage ? `Dosis: ${dosage}` : 'Dosis: -'}
                      </div>
                    </div>
                  )
                })}
              </div>
            }
          >
            <div className="cursor-pointer">
              {preview.map((medication: any) => {
                const medName = resolveMedicationName(medication)
                const strength = resolveMedicationStrength(medication)
                return (
                  <div key={`preview-${medication?.id}`} style={{ fontSize: 12, lineHeight: '16px' }}>
                    <span style={{ fontWeight: 600 }}>{medName}</span>
                    {strength ? <span style={{ color: token.colorTextSecondary }}> ({strength})</span> : null}
                  </div>
                )
              })}
              {hiddenCount > 0 ? (
                <div style={{ fontSize: 12, color: token.colorPrimary }}>
                  +{hiddenCount} resep lainnya
                </div>
              ) : null}
            </div>
          </Popover>
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
            title="Hasil Lab dan Radiologi"
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

  const diagnosticRows: any[] = [
    ...((selectedRecord?.diagnosticOrders ?? []).map((order: any) => ({
      rowKey: `order-${order?.id}`,
      rowType: 'order',
      categoryLabel: resolveDiagnosticCategoryLabel(order),
      display: resolveDiagnosticResultLabel(order),
      result: '-',
      referenceRange: '-',
      dateTime: order?.createdAt
    }))),
    ...((selectedRecord?.diagnosticResults ?? []).map((result: any) => ({
      rowKey: `result-${result?.id}`,
      rowType: 'result',
      categoryLabel: resolveDiagnosticCategoryLabel(result),
      display: resolveDiagnosticResultLabel(result),
      result: resolveDiagnosticResultValue(result),
      referenceRange: resolveDiagnosticReferenceRange(result),
      dateTime: result?.effectiveDateTime || result?.createdAt
    })))
  ].sort((a, b) => dayjs(b?.dateTime).valueOf() - dayjs(a?.dateTime).valueOf())

  const diagnosticColumns = [
    {
      title: 'Tipe',
      dataIndex: 'rowType',
      key: 'rowType',
      width: 90,
      render: (value: string) => (
        <Tag color={value === 'result' ? 'green' : 'default'} bordered={false}>
          {value === 'result' ? 'Hasil' : 'Order'}
        </Tag>
      )
    },
    {
      title: 'Kategori',
      dataIndex: 'categoryLabel',
      key: 'categoryLabel',
      width: 120,
      render: (value: string) =>
        value ? (
          <Tag color={getDiagnosticCategoryColor(value)} bordered={false}>
            {value}
          </Tag>
        ) : (
          '-'
        )
    },
    { title: 'Pemeriksaan', dataIndex: 'display', key: 'display' },
    { title: 'Hasil', dataIndex: 'result', key: 'result', width: 150 },
    { title: 'Rujukan', dataIndex: 'referenceRange', key: 'referenceRange', width: 140 },
    {
      title: 'Tanggal',
      dataIndex: 'dateTime',
      key: 'dateTime',
      width: 150,
      render: (val: string) => (val ? dayjs(val).format('DD MMM YYYY, HH:mm') : '-')
    }
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
          {resolveGeneralSoapSummary(selectedRecord?.generalSoap)}
        </div>
      </Modal>

      {/* Observations / Lab Modal — real data from API */}
      <Modal
        open={labModalOpen}
        title={
          <div>
            <div>Hasil Lab dan Radiologi</div>
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
          if (diagnosticRows.length === 0) {
            return (
              <div style={{ color: token.colorTextSecondary, textAlign: 'center', padding: '24px 0' }}>
                Tidak ada hasil Lab/Radiologi untuk kunjungan ini.
              </div>
            )
          }
          return (
            <Table
              dataSource={diagnosticRows}
              rowKey="rowKey"
              columns={diagnosticColumns}
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
