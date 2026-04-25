import type { PatientAttributes } from 'simrs-types'
import React, { useState } from 'react'
import { useNavigate } from 'react-router'

import PatientLookupSelector from '../../components/organisms/patient/PatientLookupSelector'
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
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<PatientAttributes | undefined>()
  const dashboardQuery = client.igd.dashboard.useQuery({})
  const bpjsMitraQuery = client.visitManagement.getMitra.useQuery({ type: 'bpjs', status: 'active' })
  const insuranceMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'insurance',
    status: 'active'
  })
  const companyMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'company',
    status: 'active'
  })
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
      selectedExistingPatient={selectedExistingPatient}
      onSelectExistingPatient={setSelectedExistingPatient}
      mitraOptionsByPaymentMethod={{
        BPJS: toMitraOptions(bpjsMitraQuery.data),
        Asuransi: toMitraOptions(insuranceMitraQuery.data),
        Perusahaan: toMitraOptions(companyMitraQuery.data)
      }}
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
