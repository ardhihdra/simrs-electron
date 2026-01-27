/**
 * EncounterTable Component
 */

import GenericTable from '@renderer/components/GenericTable'
import { Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ENCOUNTER_TYPE_LABELS, Encounter, STATUS_COLORS } from '../types'

interface EncounterTableProps {
  encounters: Encounter[]
  loading: string | null
  onStart: (encounterId: string) => void
  onTransfer: (encounterId: string) => void
  onDischarge: (encounterId: string) => void
  onRujukan: (encounterId: string) => void
}

export function EncounterTable({
  encounters,
  loading,
  onStart,
  onTransfer,
  onDischarge,
  onRujukan
}: EncounterTableProps) {
  const columns: ColumnsType<Encounter> = [
    {
      title: 'MRN',
      key: 'mrn',
      width: 100,
      render: (_, record) =>
        record.patient?.medicalRecordNumber ? (
          <Tag color="blue">{record.patient.medicalRecordNumber}</Tag>
        ) : (
          <Typography.Text>-</Typography.Text>
        )
    },
    {
      title: 'Nama Pasien',
      key: 'patientName',
      render: (_, record) => record.patient?.name || record.patientId
    },
    {
      title: 'Tipe',
      dataIndex: 'encounterType',
      key: 'encounterType',
      width: 100,
      render: (type: string) => ENCOUNTER_TYPE_LABELS[type] || type
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={STATUS_COLORS[status]}>{status}</Tag>
    },
    {
      title: 'Waktu Mulai',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (time: string) => (time ? new Date(time).toLocaleString('id-ID') : '-')
    }
  ]

  return (
    <GenericTable
      columns={columns}
      dataSource={encounters}
      rowKey="id"
      action={{
        width: 250,
        items(record) {
          return [
            {
              key: 'start',
              label: 'Mulai',
              onClick: () => onStart(record.id),
              disabled: record.status !== 'PLANNED'
            },
            {
              key: 'rujukan',
              label: 'Rujukan',
              onClick: () => onRujukan(record.id),
              disabled: record.status !== 'IN_PROGRESS'
            },
            {
              key: 'transfer',
              label: 'Pindah Kamar',
              onClick: () => onTransfer(record.id),
              disabled: record.status !== 'IN_PROGRESS'
            },
            {
              key: 'discharge',
              label: 'Pulangkan',
              onClick: () => onDischarge(record.id),
              disabled: record.status !== 'IN_PROGRESS'
            }
          ]
        }
      }}
    />
  )
}
