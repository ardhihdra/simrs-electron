import { App } from 'antd'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { RawatInapAdmisiPage } from './RawatInapAdmisiPage'
import {
  RAWAT_INAP_PAGE_PATHS,
  REGISTRATION_RAWAT_INAP_PAGE_PATHS,
  REGISTRATION_RAWAT_INAP_ROOT_PATH
} from './rawat-inap.config'
import {
  toRawatInapAdmissionClassCodeOptions,
  type RawatInapAdmissionDiagnosisOption
} from './rawat-inap.admisi'
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
  const location = useLocation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const isRegistrationRoute = location.pathname.startsWith(REGISTRATION_RAWAT_INAP_ROOT_PATH)
  const backPath = isRegistrationRoute
    ? REGISTRATION_RAWAT_INAP_PAGE_PATHS.pasien
    : RAWAT_INAP_PAGE_PATHS.bedMap
  const bedMapQuery = client.room.bedMap.useQuery({})
  const classCodeQuery = useQuery({
    queryKey: ['referencecode', 'rawat-inap-admission-class-codes'],
    queryFn: async () => {
      const fn = window.api?.query?.referencecode?.tarifClasses
      if (!fn) return []

      return toRawatInapAdmissionClassCodeOptions(await fn())
    },
    staleTime: 10 * 60 * 1000
  })
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
      navigate(backPath)
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
      backLabel={isRegistrationRoute ? 'Daftar Pasien Rawat Inap' : undefined}
      onBack={() => navigate(backPath)}
      onCancel={() => navigate(backPath)}
      bedMapSnapshot={bedMapQuery.data}
      classCodeOptions={classCodeQuery.data ?? []}
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
