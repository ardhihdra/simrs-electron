/**
 * purpose: Orchestrate unified inpatient patient list, disposition flow, and planned-patient checkin workflow.
 * main callers: Rawat Inap route `/dashboard/rawat-inap/pasien`.
 * key dependencies: encounter/checkin/discharge RPC hooks, diagnosis lookup hook, and inpatient admission page.
 * main/public functions: `RawatInapPasienRoute` default export.
 * important side effects: fetches inpatient list, submits discharge/checkin mutations, and refetches/invalidate queries after mutation success.
 */
import { App } from 'antd'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type {
  InpatientPatientListItem,
  InpatientPatientListQuery
} from '../../../../main/rpc/procedure/encounter.schemas'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import type { DesktopDispositionConfirmPayload } from '../../components/design-system/organisms/DesktopDispositionWorkflow'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { useDiagnosisCodeList } from '../../hooks/query/use-diagnosis-code'
import { client } from '../../utils/client'
import { RawatInapAdmisiPage } from './RawatInapAdmisiPage'
import { RawatInapPasienPage } from './RawatInapPasienPage'
import {
  RAWAT_INAP_DEFAULT_SERVICE_UNIT_ID,
  normalizeRawatInapClassCode,
  type RawatInapAdmissionDiagnosisOption,
  type RawatInapAdmissionFormState
} from './rawat-inap.admisi'

const DEFAULT_QUERY: InpatientPatientListQuery = {
  page: 1,
  pageSize: 10
}

function toMitraOptions(payload: unknown) {
  const rows =
    payload && typeof payload === 'object'
      ? (((payload as Record<string, unknown>).result ??
          (payload as Record<string, unknown>).data) as unknown[]) ?? []
      : []

  return Array.isArray(rows)
    ? rows.map((item) => {
        const row = item as Record<string, unknown>
        return {
          value: Number(row.id),
          label: String(row.name ?? row.nama ?? `Mitra ${row.id}`)
        }
      })
    : []
}

function toPractitionerOptions(payload: unknown) {
  const rows =
    payload && typeof payload === 'object'
      ? (((payload as Record<string, unknown>).result ??
          (payload as Record<string, unknown>).data) as unknown[]) ?? []
      : []

  return Array.isArray(rows)
    ? rows.map((item) => {
        const row = item as Record<string, unknown>
        return {
          value: String(row.id),
          label: String(row.namaLengkap ?? row.name ?? `Dokter ${row.id}`)
        }
      })
    : []
}

function isDiagnosisOption(
  value: RawatInapAdmissionDiagnosisOption | null
): value is RawatInapAdmissionDiagnosisOption {
  return value !== null
}

function toDiagnosisOptions(rows: unknown): RawatInapAdmissionDiagnosisOption[] {
  return Array.isArray(rows)
    ? rows
        .map((item) => {
          const row = item as Record<string, unknown>
          const code = String(row.code ?? '').trim()
          const display = String(row.id_display ?? row.idDisplay ?? row.display ?? '').trim()
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

function normalizePaymentMethod(
  patient: InpatientPatientListItem
): RawatInapAdmissionFormState['paymentMethod'] {
  const value = String(patient.paymentMethod ?? patient.paymentLabel ?? '').toLowerCase()
  if (value.includes('bpjs')) return 'bpjs'
  if (value.includes('asuransi') || value.includes('insurance')) return 'asuransi'
  if (value.includes('perusahaan') || value.includes('company')) return 'company'
  return 'cash'
}

function normalizeSource(patient: InpatientPatientListItem): RawatInapAdmissionFormState['source'] {
  if (!patient.partOfId) return 'rujukan'
  const sourceEncounterType = String(patient.partOfEncounterType ?? '').toUpperCase()
  if (sourceEncounterType === 'EMER') return 'igd'
  if (sourceEncounterType === 'AMB') return 'rajal'
  return patient.arrivalType === 'TRANSFER' ? 'igd' : 'rajal'
}

function toDateOnly(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function createInitialFormFromPatient(
  patient: InpatientPatientListItem
): Partial<RawatInapAdmissionFormState> {
  const dpjpUtama =
    patient.dpjpParticipants?.find((item) => item.role === 'dpjp_utama') ??
    patient.dpjpParticipants?.[0]

  return {
    patientId: patient.patientId,
    medicalRecordNumber: patient.medicalRecordNumber ?? '',
    patientName: patient.patientName,
    patientSummary: [patient.gender?.toUpperCase(), patient.ageLabel, patient.paymentLabel]
      .filter(Boolean)
      .join(' · '),
    source: normalizeSource(patient),
    sourceEncounterId: patient.partOfId ?? '',
    serviceUnitId: patient.serviceUnitId ?? RAWAT_INAP_DEFAULT_SERVICE_UNIT_ID,
    practitionerId: patient.practitionerId
      ? String(patient.practitionerId)
      : dpjpUtama?.staffId
        ? String(dpjpUtama.staffId)
        : '',
    paymentMethod: normalizePaymentMethod(patient),
    patientInsuranceId: patient.patientInsuranceId ? String(patient.patientInsuranceId) : '',
    admissionDate: toDateOnly(patient.admissionDateTime),
    noKartu: patient.sepNoKartu ?? '',
    noRujukan: patient.sepNoRujukan ?? '',
    diagnosisCode: patient.diagnosisCode ?? '',
    diagnosisText: patient.diagnosisSummary ?? '',
    indication: patient.indication ?? '',
    selectedClassOfCareCodeId: normalizeRawatInapClassCode(patient.classOfCareCodeId),
    selectedBedId: patient.bedId ?? ''
  }
}

export default function RawatInapPasienRoute() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [queryParams, setQueryParams] = useState<InpatientPatientListQuery>(DEFAULT_QUERY)
  const [selectedPatient, setSelectedPatient] = useState<InpatientPatientListItem | null>(null)
  const [diagnosisSearch, setDiagnosisSearch] = useState('')

  const query = client.encounter.inpatientPatients.useQuery(queryParams)
  const bedMapQuery = client.room.bedMap.useQuery({})
  const diagnosisQuery = useDiagnosisCodeList({ q: diagnosisSearch, items: 20 })
  const practitionerQuery = client.practitioner.list.useQuery({ hakAksesId: 'doctor' })
  const bpjsMitraQuery = client.visitManagement.getMitra.useQuery({ type: 'bpjs', status: 'active' })
  const insuranceMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'insurance',
    status: 'active'
  })
  const companyMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'company',
    status: 'active'
  })

  const checkInMutation = client.rawatInapAdmission.checkIn.useMutation({
    onSuccess: async (result) => {
      message.success(`Checkin rawat inap berhasil (${result?.encounterId ?? 'encounter'})`)
      setSelectedPatient(null)
      await queryClient.invalidateQueries()
      await query.refetch()
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Gagal memproses checkin rawat inap')
    }
  })

  const dischargeEncounterMutation = client.visitManagement.dischargeEncounter.useMutation({
    onSuccess: async () => {
      await query.refetch()
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

  const handleQueryChange = (patch: Partial<InpatientPatientListQuery>) =>
    setQueryParams((prev) => ({ ...prev, ...patch }))

  if (selectedPatient) {
    const currentBedOption =
      selectedPatient.bedId && selectedPatient.wardId
        ? [
            {
              bedId: selectedPatient.bedId,
              bedName: selectedPatient.bedName ?? selectedPatient.bedId,
              roomId: selectedPatient.wardId,
              roomName: selectedPatient.wardName ?? selectedPatient.wardId,
              classOfCareCodeId: normalizeRawatInapClassCode(selectedPatient.classOfCareCodeId)
            }
          ]
        : []

    return (
      <RawatInapAdmisiPage
        key={selectedPatient.encounterId}
        backLabel="Daftar Pasien"
        title="Konfirmasi Admisi — Checkin Rawat Inap"
        description="Validasi data admisi planning, penjamin, DPJP, diagnosis, dan kamar sebelum pasien masuk rawat inap."
        submitLabel="Checkin Pasien"
        submittingLabel="Memproses Checkin..."
        onBack={() => setSelectedPatient(null)}
        onCancel={() => setSelectedPatient(null)}
        initialForm={createInitialFormFromPatient(selectedPatient)}
        bedMapSnapshot={bedMapQuery.data}
        additionalBedOptions={currentBedOption}
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
        isSubmitting={checkInMutation.isPending}
        onSubmit={(command) =>
          checkInMutation.mutate({
            encounterId: selectedPatient.encounterId,
            ...command
          })
        }
      />
    )
  }

  if (query.isLoading && !query.data) {
    return (
      <DesktopNoticePanel
        title="Memuat Daftar Pasien"
        description="Data pasien rawat inap sedang diambil dari backend."
      />
    )
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-[12px]">
        <DesktopNoticePanel
          tone="warning"
          title="Daftar Pasien belum bisa dimuat"
          description={query.error?.message ?? 'Terjadi kesalahan saat memuat data pasien.'}
        />
        <div>
          <DesktopButton emphasis="primary" onClick={() => void query.refetch()}>
            Coba Lagi
          </DesktopButton>
        </div>
      </div>
    )
  }

  return (
    <RawatInapPasienPage
      items={query.data?.items ?? []}
      total={query.data?.total ?? 0}
      loading={query.isFetching}
      queryParams={queryParams}
      statusCounts={query.data?.statusCounts}
      onQueryChange={handleQueryChange}
      onCheckin={setSelectedPatient}
      isDispositionSubmitting={dischargeEncounterMutation.isPending}
      onDispositionConfirm={async (patient, payload: DesktopDispositionConfirmPayload) => {
        await dischargeEncounterMutation.mutateAsync({
          encounterId: patient.encounterId,
          dischargeDisposition: payload.dischargeDisposition,
          dischargeNote: payload.note || undefined
        })
        message.success('Disposisi rawat inap berhasil diproses')
      }}
      onDpjpSaved={() => void query.refetch()}
    />
  )
}
