import { App } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import { RawatInapAdmisiPage } from './RawatInapAdmisiPage'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'
import type { RawatInapAdmissionDiagnosisOption } from './rawat-inap.admisi'
import { useDiagnosisCodeList } from '../../hooks/query/use-diagnosis-code'
import { client } from '../../utils/client'

function toMitraOptions(payload: unknown) {
  const rows =
    payload && typeof payload === 'object'
      ? ((payload as any).result ?? (payload as any).data ?? [])
      : []

  return Array.isArray(rows)
    ? rows.map((item: any) => ({
        value: Number(item.id),
        label: item.name || item.nama || `Mitra ${item.id}`
      }))
    : []
}

function toPractitionerOptions(payload: unknown) {
  const rows =
    payload && typeof payload === 'object'
      ? ((payload as any).result ?? (payload as any).data ?? [])
      : []

  return Array.isArray(rows)
    ? rows.map((item: any) => ({
        value: String(item.id),
        label: item.namaLengkap || item.name || `Dokter ${item.id}`
      }))
    : []
}

function isDiagnosisOption(value: RawatInapAdmissionDiagnosisOption | null): value is RawatInapAdmissionDiagnosisOption {
  return value !== null
}

function toDiagnosisOptions(rows: unknown): RawatInapAdmissionDiagnosisOption[] {
  return Array.isArray(rows)
    ? rows
        .map((item: any) => {
          const code = String(item.code || '').trim()
          const display = String(item.id_display || item.idDisplay || item.display || '').trim()
          if (!code || !display) return null

          return {
            value: code,
            code,
            display,
            label: `${code} - ${display}`
          }
        })
        .filter(isDiagnosisOption)
    : []
}

export default function RawatInapAdmisiRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const bedMapQuery = client.room.bedMap.useQuery({})
  const diagnosisQuery = useDiagnosisCodeList({
    q: diagnosisSearch,
    items: 20
  })
  const practitionerQuery = client.practitioner.list.useQuery({
    hakAksesId: 'doctor'
  })
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
  const diagnosisOptions = useMemo(
    () => toDiagnosisOptions(diagnosisQuery.data),
    [diagnosisQuery.data]
  )
  const practitionerOptions = useMemo(
    () => toPractitionerOptions(practitionerQuery.data),
    [practitionerQuery.data]
  )

  return (
    <RawatInapAdmisiPage
      onBack={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      onCancel={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      bedMapSnapshot={bedMapQuery.data}
      mitraOptionsByPaymentMethod={{
        bpjs: toMitraOptions(bpjsMitraQuery.data),
        asuransi: toMitraOptions(insuranceMitraQuery.data),
        company: toMitraOptions(companyMitraQuery.data)
      }}
      diagnosisOptions={diagnosisOptions}
      practitionerOptions={practitionerOptions}
      isDiagnosisLoading={diagnosisQuery.isLoading || diagnosisQuery.isRefetching}
      isPractitionerLoading={practitionerQuery.isLoading || practitionerQuery.isRefetching}
      onDiagnosisSearch={setDiagnosisSearch}
      isSubmitting={admissionMutation.isPending}
      onSubmit={(command) => admissionMutation.mutate(command)}
    />
  )
}
