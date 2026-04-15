import React from 'react'
import { Drawer, Typography, Descriptions, Divider, Tag, Table } from 'antd'
import { EncounterTimeline } from '@renderer/components/organisms/EncounterTimeline'
import dayjs from 'dayjs'
import { resolveObservationDisplay } from './diagnosticDisplay'

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

const resolveGeneralSoapSummary = (generalSoap: any): string => {
  if (!generalSoap) return 'Tidak ada catatan SOAP Umum untuk kunjungan ini.'
  const lines = [
    `S: ${generalSoap?.soapSubjective || '-'}`,
    `O: ${generalSoap?.soapObjective || '-'}`,
    `A: ${generalSoap?.soapAssessment || '-'}`,
    `P: ${generalSoap?.soapPlan || '-'}`
  ]
  return lines.join('\n')
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

  const formatValueWithUnit = (raw: unknown, fallbackUnit = 'mg'): string | null => {
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

  const resolveMedicationName = (medication: any): string => {
    const itemName = typeof medication?.item?.nama === 'string' ? medication.item.nama.trim() : ''
    if (itemName) return itemName

    const compoundName = typeof medication?.compoundName === 'string' ? medication.compoundName.trim() : ''
    if (compoundName) return `Racikan: ${compoundName}`

    if (typeof medication?.intent === 'string' && medication.intent.trim()) {
      return medication.intent.trim()
    }

    return `Resep #${medication?.id ?? '-'}`
  }

  const resolveCompoundSummary = (medication: any): string => {
    const ingredients = Array.isArray(medication?.compoundIngredients) ? medication.compoundIngredients : []
    if (ingredients.length === 0) return '-'

    return ingredients
      .map((ingredient: any) => {
        const name = typeof ingredient?.nama === 'string' && ingredient.nama.trim()
          ? ingredient.nama.trim()
          : 'Komposisi'
        const quantity = ingredient?.quantity
        const unit = typeof ingredient?.unit === 'string' ? ingredient.unit.trim() : ''
        const strength = formatValueWithUnit(ingredient?.kekuatan)
        if (typeof quantity === 'number' && Number.isFinite(quantity)) {
          const qtyText = `${quantity}${unit ? ` ${unit}` : ''}`
          return strength ? `${name} (${qtyText}, ${strength})` : `${name} (${qtyText})`
        }
        if (strength) return `${name} (${strength})`
        if (unit) return `${name} (${unit})`
        return name
      })
      .join(', ')
  }

  const resolveMedicationStrength = (medication: any): string => {
    const directStrength = formatValueWithUnit(medication?.item?.kekuatan)
    if (directStrength) return directStrength

    const ingredients = Array.isArray(medication?.compoundIngredients) ? medication.compoundIngredients : []
    const ingredientStrengths = ingredients
      .map((ingredient: any) => formatValueWithUnit(ingredient?.kekuatan))
      .filter((val: string | null): val is string => Boolean(val))

    if (ingredientStrengths.length === 0) return '-'
    if (ingredientStrengths.length === 1) return ingredientStrengths[0]
    return ingredientStrengths.slice(0, 2).join(', ')
  }

  const resolveDosageInstructionText = (raw: unknown): string => {
    if (typeof raw === 'string') {
      const text = raw.trim()
      return text || '-'
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

      return parts.length > 0 ? parts.join(' • ') : '-'
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

    return '-'
  }

  const resolveConditionDisplay = (condition: any): string => {
    const codings = Array.isArray(condition?.codeCoding) ? condition.codeCoding : []
    const firstCoding = codings[0]
    const diagnosisDisplay =
      typeof firstCoding?.diagnosisCode?.display === 'string'
        ? firstCoding.diagnosisCode.display.trim()
        : ''
    if (diagnosisDisplay) return diagnosisDisplay

    const note = typeof condition?.note === 'string' ? condition.note.trim() : ''
    if (note) return note

    const identifier = typeof condition?.identifier === 'string' ? condition.identifier.trim() : ''
    if (identifier) return identifier

    const diagnosisCode =
      typeof firstCoding?.diagnosisCode?.code === 'string'
        ? firstCoding.diagnosisCode.code.trim()
        : ''
    if (diagnosisCode) return diagnosisCode

    return '-'
  }

  const resolveClinicalStatus = (rawStatus: unknown): { label: string; color: string } => {
    const normalized = String(rawStatus || '').trim().toLowerCase()
    if (!normalized) return { label: '-', color: 'default' }
    if (normalized === 'active') return { label: 'Aktif', color: 'orange' }
    if (normalized === 'inactive') return { label: 'Inaktif', color: 'default' }
    if (normalized === 'resolved') return { label: 'Sembuh', color: 'green' }
    if (normalized === 'remission') return { label: 'Remisi', color: 'blue' }
    if (normalized === 'recurrence') return { label: 'Kambuh', color: 'red' }
    return { label: String(rawStatus), color: 'default' }
  }

  const resolveObservationValue = (row: any): string => {
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
        </Descriptions>

        <Divider className="my-1" />

        {/* === SOAP Summary === */}
        <Title level={5} style={{ marginBottom: 8 }}>Catatan SOAP</Title>
        <div className="whitespace-pre-wrap p-3 bg-gray-50 rounded text-sm text-gray-700 font-mono border border-gray-100">
          {resolveGeneralSoapSummary(encounterData.generalSoap)}
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
                {
                  title: 'Diagnosis',
                  key: 'diagnosis',
                  render: (_: any, row: any) => resolveConditionDisplay(row)
                },
                {
                  title: 'Status Klinis',
                  dataIndex: 'clinicalStatus',
                  key: 'clinicalStatus',
                  width: 120,
                  render: (value: unknown) => {
                    const statusCfg = resolveClinicalStatus(value)
                    return <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
                  }
                }
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
                  render: (_: any, row: any) => {
                    const coding = Array.isArray(row?.codeCoding) ? row.codeCoding[0] : row?.codeCoding
                    return resolveObservationDisplay({
                      observationCode: row?.observationCode,
                      preferredDisplay: row?.observationDisplay,
                      codingDisplay: coding?.display,
                      orderDisplay: row?.matchedOrderDisplay,
                      fallbackDisplay: undefined
                    })
                  }
                },
                {
                  title: 'Hasil',
                  key: 'result',
                  render: (_: any, row: any) => resolveObservationValue(row)
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
                {
                  title: 'Obat / Racikan',
                  key: 'medication',
                  render: (_: any, row: any) => resolveMedicationName(row)
                },
                {
                  title: 'Komposisi',
                  key: 'compound',
                  render: (_: any, row: any) => resolveCompoundSummary(row)
                },
                {
                  title: 'Kekuatan',
                  key: 'strength',
                  render: (_: any, row: any) => resolveMedicationStrength(row)
                },
                {
                  title: 'Dosis',
                  key: 'dosage',
                  render: (_: any, row: any) => resolveDosageInstructionText(row?.dosageInstruction)
                },
                { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
                { title: 'Intent', dataIndex: 'intent', key: 'intent', width: 120 },
                { title: 'Prioritas', dataIndex: 'priority', key: 'priority', width: 100 },
                {
                  title: 'Waktu',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  width: 160,
                  render: (val: string) => val ? dayjs(val).format('DD MMM YYYY, HH:mm') : '-'
                }
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
