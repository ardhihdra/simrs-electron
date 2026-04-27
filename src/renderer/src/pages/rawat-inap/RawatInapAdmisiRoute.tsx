import { App } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import { RawatInapAdmisiPage } from './RawatInapAdmisiPage'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'
import { client, rpc } from '../../utils/client'
import type { RawatInapAdmissionPatientSnapshot } from './rawat-inap.admisi'

export default function RawatInapAdmisiRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const bedMapQuery = client.room.bedMap.useQuery({})
  const admissionMutation = client.rawatInapAdmission.create.useMutation({
    onSuccess: (result) => {
      message.success(`Admisi rawat inap berhasil dibuat (${result?.encounterId ?? 'encounter baru'})`)
      void queryClient.invalidateQueries()
      navigate(RAWAT_INAP_PAGE_PATHS.bedMap)
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Gagal membuat admisi rawat inap')
    }
  })
  const [patient, setPatient] = useState<RawatInapAdmissionPatientSnapshot | null>(null)
  const [isLookingUpPatient, setIsLookingUpPatient] = useState(false)

  const lookupPatient = async (input: { medicalRecordNumber: string }) => {
    const medicalRecordNumber = input.medicalRecordNumber.trim()
    if (!medicalRecordNumber) {
      message.warning('Isi nomor rekam medis terlebih dahulu')
      return
    }

    setIsLookingUpPatient(true)
    try {
      const response = await rpc.visitManagement.getPatientList({ medicalRecordNumber })
      const rows = ((response as any)?.result ?? (response as any)?.data ?? []) as Array<any>
      const matchedPatient =
        rows.find((item) => item.medicalRecordNumber === medicalRecordNumber) ?? rows[0]

      if (!matchedPatient?.id) {
        message.warning('Pasien tidak ditemukan')
        setPatient(null)
        return
      }

      setPatient({
        id: matchedPatient.id,
        medicalRecordNumber: matchedPatient.medicalRecordNumber,
        name: matchedPatient.name,
        gender: matchedPatient.gender,
        birthDate: matchedPatient.birthDate,
        insuranceNumber: matchedPatient.insuranceNumber
      })
      message.success(`Pasien ${matchedPatient.name || medicalRecordNumber} dipilih`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Gagal mencari pasien')
    } finally {
      setIsLookingUpPatient(false)
    }
  }

  return (
    <RawatInapAdmisiPage
      onBack={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      onCancel={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      onLookupPatient={lookupPatient}
      patient={patient}
      bedMapSnapshot={bedMapQuery.data}
      isLookingUpPatient={isLookingUpPatient}
      isSubmitting={admissionMutation.isPending}
      onSubmit={(command) => admissionMutation.mutate(command)}
    />
  )
}
