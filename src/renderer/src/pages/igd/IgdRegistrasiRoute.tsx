/**
 * purpose: Route container registrasi IGD yang mengikat query dashboard, mutation registrasi, lookup pasien existing, dan navigasi pasca submit.
 * main callers: Router modul IGD (`IGD_PAGE_PATHS.registrasi`).
 * key dependencies: `client.igd.dashboard`, `client.igd.register`, `useMasterIgdTriageLevelActive`, `IgdRegistrasiPage`.
 * main/public functions: `IgdRegistrasiRoute`.
 * side effects: Menjalankan query/mutation backend IGD, invalidasi cache dashboard, dan navigasi halaman.
 */
import type { PatientAttributes } from 'simrs-types'
import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import PatientLookupSelector from '../../components/organisms/patient/PatientLookupSelector'
import { useMasterIgdTriageLevelActive } from '../../hooks/query/use-master-igd-triage-level'
import { queryClient } from '../../query-client'
import { client } from '../../utils/client'

import { IgdRegistrasiPage } from './IgdRegistrasiPage'
import { IGD_PAGE_PATHS } from './igd.config'
import { EMPTY_IGD_DASHBOARD } from './igd.data'

function toMitraOptions(payload: unknown) {
  const rows = (payload as any)?.result || (payload as any)?.data || []

  if (!Array.isArray(rows)) {
    return []
  }

  return rows.map((item: any) => ({
    value: String(item.id),
    label: item.name || item.nama || `Mitra ${item.id}`
  }))
}

export default function IgdRegistrasiRoute() {
  const navigate = useNavigate()
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<
    PatientAttributes | undefined
  >()
  const dashboardQuery = client.igd.dashboard.useQuery({})
  const bpjsMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'bpjs',
    status: 'active'
  })
  const insuranceMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'insurance',
    status: 'active'
  })
  const companyMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'company',
    status: 'active'
  })
  const triageLevelsQuery = useMasterIgdTriageLevelActive()
  const activeTriageLevels = useMemo(() => {
    const levels = (triageLevelsQuery.data ?? [])
      .map((level) => level.levelNo)
      .filter((levelNo) => Number.isInteger(levelNo) && levelNo >= 0)
      .sort((left, right) => left - right)
    return levels.length > 0 ? levels : [0, 1, 2, 3, 4]
  }, [triageLevelsQuery.data])
  const registerMutation = client.igd.register.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = JSON.stringify(query.queryKey)
          return key.includes('igd') && key.includes('dashboard')
        }
      })
    }
  })

  return (
    <IgdRegistrasiPage
      dashboard={dashboardQuery.data ?? EMPTY_IGD_DASHBOARD}
      activeTriageLevels={activeTriageLevels}
      selectedExistingPatient={selectedExistingPatient}
      onSelectExistingPatient={setSelectedExistingPatient}
      mitraOptionsByPaymentMethod={{
        BPJS: toMitraOptions(bpjsMitraQuery.data),
        Asuransi: toMitraOptions(insuranceMitraQuery.data),
        Perusahaan: toMitraOptions(companyMitraQuery.data)
      }}
      lookupSelectorSlot={
        <PatientLookupSelector
          value={selectedExistingPatient}
          onChange={setSelectedExistingPatient}
        />
      }
      submitting={registerMutation.isPending}
      onDone={() => navigate(IGD_PAGE_PATHS.daftar)}
      onSubmitRegistration={async (input) => {
        const commandPayload: any = { ...input.command }
        if (commandPayload.quickTriage) {
          const parsedLevel = Number.parseInt(String(commandPayload.quickTriage.level ?? 0), 10)
          const clampedLevel = Number.isInteger(parsedLevel)
            ? Math.min(4, Math.max(0, parsedLevel))
            : 4
          commandPayload.quickTriage = {
            ...commandPayload.quickTriage,
            level: clampedLevel
          }
        }

        await registerMutation.mutateAsync(commandPayload)

        if (input.intent === 'triase') {
          navigate(IGD_PAGE_PATHS.triase)
          return
        }

        navigate(IGD_PAGE_PATHS.daftar)
      }}
    />
  )
}
