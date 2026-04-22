import React from 'react'
import { Modal, Tabs, Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { resolveObservationDisplay } from './diagnosticDisplay'

interface ClinicalHistoryModalProps {
  open: boolean
  onCancel: () => void
  record: any
}

export const ClinicalHistoryModal: React.FC<ClinicalHistoryModalProps> = ({
  open,
  onCancel,
  record
}) => {
  const clinicals = record?.clinicals || {}
  const conditions = clinicals.conditions || []
  const allergies = clinicals.allergies || []
  const medications = clinicals.medications || []
  const procedures = clinicals.procedures || []
  const observations = clinicals.observations || []

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

  const normalizeMedicationStatus = (status: unknown): { label: string; color: string } => {
    const normalized = String(status || '').trim().toLowerCase()
    if (normalized === 'active') return { label: 'Aktif', color: 'green' }
    if (normalized === 'completed') return { label: 'Selesai', color: 'blue' }
    if (normalized === 'stopped') return { label: 'Dihentikan', color: 'red' }
    if (normalized === 'on-hold') return { label: 'Ditunda', color: 'orange' }
    if (normalized === 'cancelled') return { label: 'Dibatalkan', color: 'default' }
    return { label: String(status || '-'), color: 'default' }
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

    return 'Tanpa Keterangan'
  }

  const resolveObservationResult = (observation: any): string => {
    const vq = observation?.valueQuantity
    if (vq && typeof vq === 'object') {
      return `${vq.value ?? ''} ${vq.unit ?? observation?.valueUnitCode ?? ''}`.trim() || '-'
    }
    if (observation?.valueString) return observation.valueString
    if (observation?.valueInteger !== undefined && observation?.valueInteger !== null) {
      return String(observation.valueInteger)
    }
    if (observation?.valueBoolean !== undefined && observation?.valueBoolean !== null) {
      return observation.valueBoolean ? 'Ya' : 'Tidak'
    }
    const concept = observation?.valueCodeableConcept
    if (concept && typeof concept === 'object') {
      const coding = Array.isArray(concept.coding) ? concept.coding[0] : undefined
      return concept.text || coding?.display || coding?.code || '-'
    }
    return '-'
  }

  // Problem List
  const problemColumns = [
    { title: 'Diagnosis/Masalah', dataIndex: 'problem', key: 'problem' },
    { title: 'Tanggal Dicatat', dataIndex: 'date', key: 'date' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: unknown) => {
        const statusCfg = resolveClinicalStatus(value)
        return <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
      }
    }
  ]
  const problemData = conditions.map((c: any) => ({
    id: c.id,
    problem: resolveConditionDisplay(c),
    date: c.createdAt ? dayjs(c.createdAt).format('DD/MM/YYYY') : '-',
    status: c.clinicalStatus || '-'
  }))

  // Allergy History
  const allergyColumns = [
    { title: 'Alergen', dataIndex: 'allergen', key: 'allergen' },
    { title: 'Status', dataIndex: 'status', key: 'status' }
  ]
  const allergyData = allergies.map((a: any) => ({
    id: a.id,
    allergen: a.note || a.identifier || 'Tanpa Keterangan',
    status: a.clinicalStatus || '-'
  }))

  // Medication History
  const medicationColumns = [
    { title: 'Obat / Racikan', dataIndex: 'medication', key: 'medication' },
    { title: 'Kekuatan', dataIndex: 'strength', key: 'strength' },
    { title: 'Instruksi', dataIndex: 'instruction', key: 'instruction' },
    { title: 'Komposisi Racikan', dataIndex: 'compound', key: 'compound' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const cfg = normalizeMedicationStatus(val)
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      }
    },
    {
      title: 'Waktu',
      dataIndex: 'time',
      key: 'time'
    }
  ]
  const medicationData = medications.map((m: any) => ({
    id: m.id,
    medication: resolveMedicationName(m),
    strength: resolveMedicationStrength(m),
    instruction: resolveDosageInstructionText(m.dosageInstruction),
    compound: resolveCompoundSummary(m),
    status: m.status || '-',
    time: m.createdAt ? dayjs(m.createdAt).format('DD/MM/YYYY HH:mm') : '-',
  }))

  // Procedure History
  const procedureColumns = [
    { title: 'Tanggal', dataIndex: 'date', key: 'date' },
    { title: 'Tindakan / Operasi', dataIndex: 'procedure', key: 'procedure' },
    { title: 'Status', dataIndex: 'status', key: 'status' }
  ]
  const procedureData = procedures.map((p: any) => ({
    id: p.id,
    date: p.performedDateTime ? dayjs(p.performedDateTime).format('DD/MM/YYYY') : '-',
    procedure: p.identifier || 'Tanpa Keterangan',
    status: p.status || '-'
  }))

  // Vital Signs / Observations
  const vitalColumns = [
    { title: 'Tanggal', dataIndex: 'date', key: 'date' },
    { title: 'Pemeriksaan', dataIndex: 'test', key: 'test' },
    { title: 'Hasil', dataIndex: 'result', key: 'result' }
  ]
  const vitalData = observations.map((o: any) => {
    const display = resolveObservationDisplay({
      observationCode: o.observationCode,
      preferredDisplay: o.observationDisplay,
      codingDisplay: o.codeCoding?.[0]?.display,
      orderDisplay: o.matchedOrderDisplay,
      fallbackDisplay: undefined
    })

    return {
      id: o.id,
      date: o.effectiveDateTime ? dayjs(o.effectiveDateTime).format('DD/MM/YYYY HH:mm') : '-',
      test: display || 'Observasi Klinis',
      result: resolveObservationResult(o)
    }
  })

  const items = [
    {
      key: '1',
      label: 'Problem List',
      children: (
        <Table
          columns={problemColumns}
          dataSource={problemData}
          pagination={false}
          size="small"
          rowKey="id"
        />
      )
    },
    {
      key: '2',
      label: 'Allergy',
      children: (
        <Table
          columns={allergyColumns}
          dataSource={allergyData}
          pagination={false}
          size="small"
          rowKey="id"
        />
      )
    },
    {
      key: '3',
      label: 'Medication',
      children: (
        <Table
          columns={medicationColumns}
          dataSource={medicationData}
          pagination={false}
          size="small"
          rowKey="id"
        />
      )
    },
    {
      key: '4',
      label: 'Procedure',
      children: (
        <Table
          columns={procedureColumns}
          dataSource={procedureData}
          pagination={false}
          size="small"
          rowKey="id"
        />
      )
    },
    {
      key: '5',
      label: 'Vital Signs & Observasi',
      children: (
        <Table
          columns={vitalColumns}
          dataSource={vitalData}
          pagination={false}
          size="small"
          rowKey="id"
        />
      )
    }
  ]

  return (
    <Modal
      title={`Riwayat Klinis Komprehensif`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={900}
      styles={{ body: { padding: '12px 24px' } }}
    >
      <div className="mb-4 text-gray-500 text-sm">
        Review riwayat klinis pasien pada kunjungan ini.
      </div>
      <Tabs defaultActiveKey="1" items={items} />
    </Modal>
  )
}
