import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { client } from '../../utils/client'

import { IgdDaftarPage } from './IgdDaftarPage'
import { IGD_PAGE_PATHS } from './igd.config'
import { EMPTY_IGD_DASHBOARD } from './igd.data'

export default function IgdDaftarRoute() {
  const navigate = useNavigate()
  const dashboardQuery = client.igd.dashboard.useQuery({})
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const patients = dashboardQuery.data?.patients ?? []
    if (patients.length === 0) {
      setSelectedPatientId(undefined)
      return
    }

    if (!selectedPatientId || !patients.some((patient) => patient.id === selectedPatientId)) {
      setSelectedPatientId(patients[0]?.id)
    }
  }, [dashboardQuery.data?.patients, selectedPatientId])

  return (
    <IgdDaftarPage
      dashboard={dashboardQuery.data ?? EMPTY_IGD_DASHBOARD}
      selectedPatientId={selectedPatientId}
      onSelectPatient={setSelectedPatientId}
      isLoading={dashboardQuery.isLoading}
      errorMessage={dashboardQuery.error?.message}
      onRetry={() => {
        void dashboardQuery.refetch()
      }}
      onOpenRegistrasi={() => navigate(IGD_PAGE_PATHS.registrasi)}
      onOpenTriase={() => navigate(IGD_PAGE_PATHS.triase)}
      onOpenBedMap={() => navigate(IGD_PAGE_PATHS.bedMap)}
    />
  )
}
