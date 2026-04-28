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

export default function IgdRegistrasiRoute() {
  const navigate = useNavigate()
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<PatientAttributes | undefined>()
  const dashboardQuery = client.igd.dashboard.useQuery({})
  const triageLevelQuery = useMasterIgdTriageLevelActive()
  const activeTriageLevels = useMemo(
    () =>
      Array.from(
        new Set(
          (triageLevelQuery.data ?? [])
            .map((level) => level.levelNo)
            .filter((levelNo) => Number.isInteger(levelNo) && levelNo >= 0)
        )
      ).sort((left, right) => left - right),
    [triageLevelQuery.data]
  )
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
      lookupSelectorSlot={
        <PatientLookupSelector value={selectedExistingPatient} onChange={setSelectedExistingPatient} />
      }
      submitting={registerMutation.isPending}
      onDone={() => navigate(IGD_PAGE_PATHS.daftar)}
      onSubmitRegistration={async (input) => {
        await registerMutation.mutateAsync(input.command)

        if (input.intent === 'triase') {
          navigate(IGD_PAGE_PATHS.triase)
          return
        }

        navigate(IGD_PAGE_PATHS.daftar)
      }}
    />
  )
}
