import React from 'react'

import { EncounterHistoryTable } from './components/EncounterHistoryTable'

import { EncounterDetailDrawer } from './components/EncounterDetailDrawer'

interface PatientMedicalHistoryTabProps {
  patientId: string
}

export const PatientMedicalHistoryTab: React.FC<PatientMedicalHistoryTabProps> = ({
  patientId
}) => {
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [selectedEncounter, setSelectedEncounter] = React.useState<any>(null)

  return (
    <div className="flex flex-col gap-6 p-1">
      <EncounterHistoryTable
        patientId={patientId}
        onRowClick={(record) => {
          setSelectedEncounter(record)
          setDrawerOpen(true)
        }}
      />

      <EncounterDetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedEncounter(null)
        }}
        encounterData={selectedEncounter}
      />
    </div>
  )
}
