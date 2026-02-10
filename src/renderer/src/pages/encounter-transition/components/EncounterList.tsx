/**
 * EncounterList Component
 */

import { Collapse, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import { Encounter } from '../types'
import { EncounterTable } from './EncounterTable'

const { Text } = Typography

interface EncounterListProps {
  encounters: Encounter[]
  isLoading: boolean
  actionLoading: string | null
  onStart: (encounterId: string) => void
  onTransfer: (encounterId: string) => void
  onDischarge: (encounterId: string) => void
  onRujukan: (encounterId: string) => void
}

interface GroupedEncounters {
  IN_PROGRESS: Encounter[]
  PLANNED: Encounter[]
}

export function EncounterList({
  encounters,
  isLoading,
  actionLoading,
  onStart,
  onTransfer,
  onDischarge,
  onRujukan
}: EncounterListProps) {
  // Filter only active encounters
  const activeEncounters = encounters.filter(
    (e) => e.status === 'PLANNED' || e.status === 'IN_PROGRESS'
  )

  // Group by status
  const groupedEncounters = useMemo<GroupedEncounters>(() => {
    const groups: GroupedEncounters = {
      IN_PROGRESS: [],
      PLANNED: []
    }

    activeEncounters.forEach((encounter) => {
      if (encounter.status === 'IN_PROGRESS') {
        groups.IN_PROGRESS.push(encounter)
      } else if (encounter.status === 'PLANNED') {
        groups.PLANNED.push(encounter)
      }
    })

    return groups
  }, [activeEncounters])

  const collapseItems = [
    {
      key: 'IN_PROGRESS',
      label: (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
            Sedang Berjalan (In Progress)
          </span>
          <Tag color="green">{groupedEncounters.IN_PROGRESS.length} pasien</Tag>
        </div>
      ),
      children: (
        <EncounterTable
          encounters={groupedEncounters.IN_PROGRESS}
          loading={actionLoading}
          onStart={onStart}
          onTransfer={onTransfer}
          onDischarge={onDischarge}
          onRujukan={onRujukan}
        />
      )
    },
    {
      key: 'PLANNED',
      label: (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Menunggu (Planned)</span>
          <Tag color="blue">{groupedEncounters.PLANNED.length} pasien</Tag>
        </div>
      ),
      children: (
        <EncounterTable
          encounters={groupedEncounters.PLANNED}
          loading={actionLoading}
          onStart={onStart}
          onTransfer={onTransfer}
          onDischarge={onDischarge}
          onRujukan={onRujukan}
        />
      )
    }
  ]

  return (
    <div>
      {activeEncounters.length === 0 && !isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <Text type="secondary">Tidak ada encounter aktif saat ini</Text>
        </div>
      ) : (
        <Collapse
          items={collapseItems}
          defaultActiveKey={['IN_PROGRESS', 'PLANNED']}
          style={{ background: 'white' }}
        />
      )}
    </div>
  )
}
