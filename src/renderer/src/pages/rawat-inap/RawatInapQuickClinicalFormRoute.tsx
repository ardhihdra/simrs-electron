/**
 * purpose: Provide content-only quick routes for inpatient CPPT and vital-sign monitoring forms.
 * main callers: Rawat Inap nested routes in `route.tsx` under `/dashboard/rawat-inap/daftar-pasien/:encounterId/*`.
 * key dependencies: `getPatientMedicalRecord`, `CPPTInpatientEntryPanel`, and `VitalSignsMonitoringForm`.
 * main/public functions: `RawatInapQuickCpptRoute` and `RawatInapQuickVitalSignsRoute`.
 * important side effects: reads encounter medical-record payload and redirects to inpatient patient list when data is unavailable.
 */
import { App, Spin } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { CPPTInpatientEntryPanel } from '@renderer/components/organisms/Assessment/CPPT/CPPTInpatientEntryPanel'
import { VitalSignsMonitoringForm } from '@renderer/components/organisms/Assessment/VitalSignsMonitoring/VitalSignsMonitoringForm'
import type { PatientWithMedicalRecord } from '@renderer/types/doctor.types'
import { getPatientMedicalRecord } from '@renderer/services/doctor.service'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'

type QuickFormMode = 'cppt' | 'vital-signs'

function RawatInapQuickClinicalFormRoute({ mode }: { mode: QuickFormMode }) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { encounterId = '' } = useParams<{ encounterId: string }>()
  const [loading, setLoading] = useState(true)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)

  const loadPatientData = useCallback(async () => {
    if (!encounterId) {
      navigate(RAWAT_INAP_PAGE_PATHS.pasien, { replace: true })
      return
    }

    setLoading(true)
    try {
      const data = await getPatientMedicalRecord(encounterId)
      if (!data) {
        message.error('Data pasien tidak ditemukan')
        navigate(RAWAT_INAP_PAGE_PATHS.pasien, { replace: true })
        return
      }
      setPatientData(data)
    } catch (error) {
      console.error(error)
      message.error('Gagal memuat data pasien')
      navigate(RAWAT_INAP_PAGE_PATHS.pasien, { replace: true })
    } finally {
      setLoading(false)
    }
  }, [encounterId, message, navigate])

  useEffect(() => {
    void loadPatientData()
  }, [loadPatientData])

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Spin size="large" tip="Memuat data pasien..." />
      </div>
    )
  }

  if (!patientData || !encounterId) {
    return null
  }

  if (mode === 'cppt') {
    return <CPPTInpatientEntryPanel encounterId={encounterId} patientData={patientData} />
  }

  return <VitalSignsMonitoringForm encounterId={encounterId} patientData={patientData} />
}

export function RawatInapQuickCpptRoute() {
  return <RawatInapQuickClinicalFormRoute mode="cppt" />
}

export function RawatInapQuickVitalSignsRoute() {
  return <RawatInapQuickClinicalFormRoute mode="vital-signs" />
}

