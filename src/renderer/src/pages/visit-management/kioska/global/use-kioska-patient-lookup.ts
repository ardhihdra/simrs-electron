import { App } from 'antd'
import { useEffect, useState } from 'react'

import { fetchKioskaPatients } from '../public-client'
import { useKioskaGlobalFlow } from './kioska-global-context'

function normalizeMedicalRecordNumber(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

export function useKioskaPatientLookup() {
  const { message } = App.useApp()
  const { state, setMatchedPatient } = useKioskaGlobalFlow()
  const [isResolvingPatient, setIsResolvingPatient] = useState(false)

  useEffect(() => {
    const normalizedMrn = normalizeMedicalRecordNumber(state.rawatJalan.mrn)

    if (!normalizedMrn) {
      setMatchedPatient(null)
      setIsResolvingPatient(false)
      return
    }

    if (
      normalizeMedicalRecordNumber(state.rawatJalan.matchedPatient?.medicalRecordNumber || '') ===
      normalizedMrn
    ) {
      setIsResolvingPatient(false)
      return
    }

    let cancelled = false
    setIsResolvingPatient(true)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const patients = await fetchKioskaPatients({
            medicalRecordNumber: state.rawatJalan.mrn.trim()
          })

          if (cancelled) return

          const exactMatch =
            patients.find(
              (patient) =>
                normalizeMedicalRecordNumber(patient.medicalRecordNumber || '') === normalizedMrn
            ) || null

          setMatchedPatient(exactMatch)
        } catch (error) {
          if (cancelled) return

          setMatchedPatient(null)
          message.error(error instanceof Error ? error.message : 'Gagal mencari data pasien')
        } finally {
          if (!cancelled) {
            setIsResolvingPatient(false)
          }
        }
      })()
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [message, setMatchedPatient, state.rawatJalan.matchedPatient, state.rawatJalan.mrn])

  return {
    isResolvingPatient
  }
}
