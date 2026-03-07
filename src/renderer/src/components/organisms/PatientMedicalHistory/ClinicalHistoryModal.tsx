import React from 'react'
import { Modal, Tabs, Table, Tag } from 'antd'
import dayjs from 'dayjs'

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

  // Problem List
  const problemColumns = [
    { title: 'Diagnosis/Masalah', dataIndex: 'problem', key: 'problem' },
    { title: 'Tanggal Dicatat', dataIndex: 'date', key: 'date' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={val === 'active' ? 'red' : 'default'}>{val}</Tag>
    }
  ]
  const problemData = conditions.map((c: any) => ({
    id: c.id,
    problem: c.note || c.identifier || 'Tanpa Keterangan',
    date: c.createdAt ? dayjs(c.createdAt).format('DD/MM/YYYY') : '-',
    status: c.clinicalStatus || 'unknown'
  }))

  // Allergy History
  const allergyColumns = [
    { title: 'Alergen', dataIndex: 'allergen', key: 'allergen' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Tingkat Keparahan', dataIndex: 'severity', key: 'severity' }
  ]
  const allergyData = allergies.map((a: any) => ({
    id: a.id,
    allergen: a.note || a.identifier || 'Tanpa Keterangan',
    status: a.clinicalStatus || '-',
    severity: a.criticality || '-'
  }))

  // Medication History
  const medicationColumns = [
    { title: 'ID Permintaan', dataIndex: 'medication', key: 'medication' },
    { title: 'Instruksi', dataIndex: 'instruction', key: 'instruction' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={val === 'active' ? 'green' : 'default'}>{val}</Tag>
    }
  ]
  const medicationData = medications.map((m: any) => ({
    id: m.id,
    medication: m.id, // we might not have drug names directly without joining Medication
    instruction: m.dosageInstruction?.[0]?.text || '-',
    status: m.status || '-'
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
    let result = o.valueString || '-'
    if (o.valueQuantity) {
      result = `${o.valueQuantity.value} ${o.valueQuantity.unit || ''}`
    }

    const display = o.codeCoding?.[0]?.display

    return {
      id: o.id,
      date: o.effectiveDateTime ? dayjs(o.effectiveDateTime).format('DD/MM/YYYY HH:mm') : '-',
      test: display || o.observationCode || 'Observasi Klinis',
      result
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
