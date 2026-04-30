/**
 * purpose: Render doctor queue list with filters, status tabs, table actions, and side summary panel.
 * main callers: Doctor EMR routing entry for `/dashboard/doctor-patient-list` style pages.
 * key dependencies: Ant Design table/form controls, React Query encounter list, queue status mutation, sync APIs.
 * main/public functions: `DoctorPatientList`.
 * side effects: Reads encounter queue data, updates queue status, opens EMR/discharge windows, and triggers sync/export actions.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudSyncOutlined,
  DownloadOutlined,
  ExceptionOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  TeamOutlined
} from '@ant-design/icons'
import {
  App,
  Badge,
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Popconfirm,
  Segmented,
  Space,
  Tag,
  theme
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { SelectPoli } from '@renderer/components/molecules/SelectPoli'
import { DesktopGenericTable } from '@renderer/components/design-system/organisms/DesktopGenericTable'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import dayjs from 'dayjs'
import logoUrl from '@renderer/assets/logo.png'
import { getSyncSummary } from '@renderer/utils/satu-sehat'
import { SatuSehatSyncStatus } from '@renderer/types/satu-sehat'
import { SyncPopoverContent } from './components/sync-popover-content'
import { useSearchParams } from 'react-router'
import { client } from '@renderer/utils/client'
import {
  DesktopDispositionWorkflow,
  type DesktopDispositionConfirmPayload,
  type DesktopDispositionOption
} from '../../components/design-system/organisms/DesktopDispositionWorkflow'
import { ReferralForm } from '../../components/organisms/ReferralForm'

const { RangePicker } = DatePicker

type DoctorListDischargeDisposition = 'home' | 'other-hcf' | 'exp' | 'aadvice'

const DOCTOR_LIST_DISPOSITION_OPTIONS: DesktopDispositionOption[] = [
  {
    key: 'pulang',
    label: 'Pulang',
    subtitle: 'Pulang ke rumah',
    dischargeDisposition: 'home',
    color: 'var(--ds-color-success)',
    softColor: 'color-mix(in srgb, var(--ds-color-success) 10%, white)',
    tone: 'success'
  },
  {
    key: 'rujuk-e',
    label: 'Rujuk',
    subtitle: 'Ke fasilitas kesehatan lain',
    dischargeDisposition: 'other-hcf',
    color: 'var(--ds-color-violet)',
    softColor: 'var(--ds-color-violet-soft)',
    tone: 'violet'
  },
  {
    key: 'meninggal',
    label: 'Meninggal',
    subtitle: 'Pasien dinyatakan meninggal',
    dischargeDisposition: 'exp',
    color: 'var(--ds-color-text-subtle)',
    softColor: 'var(--ds-color-surface-muted)',
    tone: 'neutral'
  },
  {
    key: 'paksa',
    label: 'Pulang Paksa',
    subtitle: 'Atas permintaan sendiri (APS)',
    dischargeDisposition: 'aadvice',
    color: 'var(--ds-color-warning)',
    softColor: 'color-mix(in srgb, var(--ds-color-warning) 12%, white)',
    tone: 'warning'
  }
]

const DOCTOR_LIST_DISPOSITION_BANNER_META = {
  label: 'DR',
  name: 'Dokter',
  colorName: 'EMR',
  badgeTone: 'accent' as const,
  background: 'var(--ds-color-accent-soft)',
  borderColor: 'var(--ds-color-accent)',
  color: 'var(--ds-color-accent)'
}

interface PatientListTableData {
  no: number
  key: string
  id: string
  encounterId: string
  fhirId: string
  queueNumber: number
  formattedQueueNumber?: string
  patient: {
    id: string
    name: string
    medicalRecordNumber: string
    gender: 'male' | 'female'
    age: number
    birthDate: string
    nik?: string
  }
  queueTicket?: {
    id: string
    queueNumber: number | string
    formattedQueueNumber?: string
    queueDate: string
    status: string
    poli?: { id: number; name: string; location: string }
    practitioner?: { id: number; namaLengkap: string; nik: string }
    paymentMethod?: string
  }
  poli: { name: string }
  status: string
  hasObservations: boolean
  encounterType?: string
  visitDate: string
  satuSehatSyncStatus?: SatuSehatSyncStatus | null
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; antColor: string; dotColor: string }
> = {
  all: { label: 'Semua', color: '', antColor: 'default', dotColor: '#6b7280' },
  IN_PROGRESS: {
    label: 'Diperiksa',
    color: 'orange',
    antColor: 'warning',
    dotColor: '#f97316'
  },
  FINISHED: { label: 'Selesai', color: 'green', antColor: 'success', dotColor: '#22c55e' },
  DISCHARGED: { label: 'Pulang', color: 'blue', antColor: 'processing', dotColor: '#3b82f6' }
}

const normalizePoliCode = (value: string | number) => String(value).trim().toLowerCase()
const parseQueueNumber = (value?: number | string) => {
  const parsed = Number.parseInt(String(value ?? '0'), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const toEncounterSummaryType = (value?: string) => {
  const source = String(value || '')
    .trim()
    .toUpperCase()
  if (!source) return '-'
  if (source === 'EMER') return 'IGD'
  if (source === 'AMB') return 'Rawat Jalan'
  if (source === 'IMP') return 'Rawat Inap'
  return source
}
const getEncounterTypeLabel = (type?: string) => {
  if (type === 'IMP') return 'Rawat Inap'
  if (type === 'EMER') return 'IGD'
  return 'Rawat Jalan'
}
const getGenderLabel = (gender?: 'male' | 'female') => {
  if (gender === 'male') return 'Laki-laki'
  if (gender === 'female') return 'Perempuan'
  return '-'
}
const formatVisitDate = (value?: string) =>
  value ? dayjs(value).format('DD MMM YYYY, HH:mm') : '-'

export const DoctorPatientList = () => {
  const { modal: appModal } = App.useApp()
  const { token } = theme.useToken()
  const { session } = useModuleScopeStore()
  const [searchParams] = useSearchParams()
  const [searchText, setSearchText] = useState('')
  const [selectedPoli, setSelectedPoli] = useState<string | number | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([dayjs(), dayjs()])
  const [activeStatus, setActiveStatus] = useState<string>('IN_PROGRESS')
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [isBulkSyncing, setIsBulkSyncing] = useState(false)
  const [syncingRows, setSyncingRows] = useState<Record<string, boolean>>({})
  const [dispositionRecord, setDispositionRecord] = useState<PatientListTableData | null>(null)
  const isDoctorRole = session?.hakAksesId === 'doctor'
  const isAdministrator = session?.hakAksesId === 'administrator'
  const doctorTargetId =
    isDoctorRole && session?.kepegawaianId != null ? String(session.kepegawaianId) : undefined
  const routePoliCode = searchParams.get('poliCode')?.trim() || undefined
  const isPoliLockedFromRoute = searchParams.get('from') === 'poli-select' && Boolean(routePoliCode)
  // const activePoliLabel = selectedPoli || 'Semua Poli'
  // const doctorTargetLabel = useMemo(() => {
  //   if (!isDoctorRole) return undefined
  //   return profile?.username || (doctorTargetId ? `ID ${doctorTargetId}` : 'Tidak Diketahui')
  // }, [doctorTargetId, isDoctorRole, profile?.username])
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()
  const dischargeEncounterMutation = client.registration.dischargeEncounter.useMutation()
  const { data: poliData, isLoading: isPoliLoading } = client.visitManagement.poli.useQuery({})
  const scopedPolis = useMemo(() => {
    const allPolis = poliData?.result ?? []
    return allPolis
      .map((poli) => ({
        id: poli.id,
        code: String(poli.code || poli.id),
        lokasiKerjaId:
          typeof poli.location?.id === 'number'
            ? poli.location.id
            : Number.parseInt(String(poli.location?.id), 10)
      }))
      .filter((poli) => {
        if (isAdministrator) return true
        if (!session) return false
        return poli.lokasiKerjaId === session.lokasiKerjaId
      })
  }, [isAdministrator, poliData?.result, session])
  const routePoli = useMemo(() => {
    if (!routePoliCode) return undefined
    return scopedPolis.find(
      (poli) => normalizePoliCode(poli.code) === normalizePoliCode(routePoliCode)
    )
  }, [routePoliCode, scopedPolis])

  useEffect(() => {
    if (!isPoliLockedFromRoute || !routePoliCode) return
    if (isPoliLoading) return
    if (!routePoli) return
    if (selectedPoli !== routePoli.id) {
      setSelectedPoli(routePoli.id)
    }
  }, [isPoliLoading, isPoliLockedFromRoute, routePoli, routePoliCode, selectedPoli])

  const handleOpenSyncDetail = (status: SatuSehatSyncStatus | null, fhirId: string) => {
    if (!status && !fhirId) return

    const s: SatuSehatSyncStatus = status || {
      encounterSynced: !!fhirId,
      allSynced: true,
      hasPendingResync: false,
      encounterLog: null,
      resources: {
        observation: { total: 0, synced: 0, needsResync: 0, logSummary: null },
        condition: { total: 0, synced: 0, needsResync: 0, logSummary: null },
        procedure: { total: 0, synced: 0, needsResync: 0, logSummary: null },
        allergyIntolerance: { total: 0, synced: 0, needsResync: 0, logSummary: null },
        composition: { total: 0, synced: 0, needsResync: 0, logSummary: null }
      }
    }

    appModal.info({
      icon: null,
      title: <span className="font-bold">Detail Sinkronisasi SatuSehat</span>,
      content: <SyncPopoverContent s={s} />,
      width: 500,
      centered: true,
      okText: 'Tutup',
      maskClosable: true
    })
  }

  const {
    data: encounterData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['encounter', 'list', selectedPoli, searchText, dateRange, doctorTargetId],
    queryFn: async () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')
      const params: any = {}
      if (searchText) params.q = searchText
      if (selectedPoli != null && String(selectedPoli).trim() !== '') {
        params.poliCodeId = String(selectedPoli)
      }
      if (selectedPoli != null && String(selectedPoli).trim() !== '') {
        params.poliCodeId = String(selectedPoli)
      }
      if (doctorTargetId) params.doctorId = doctorTargetId
      if (dateRange) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }
      params.sortBy = 'updatedAt'
      params.sortOrder = 'DESC'
      return fn(params)
    },
    enabled: !isPoliLockedFromRoute || !!selectedPoli
  })

  const allPatients: PatientListTableData[] = (encounterData?.result || []).map(
    (enc: any, index: number) => {
      const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
      const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0
      const queueNumber = parseQueueNumber(enc.queueTicket?.queueNumber)
      const formattedQueueNumber =
        enc.queueTicket?.formattedQueueNumber || (queueNumber > 0 ? String(queueNumber) : '-')

      let parsedSyncStatus = null
      if (enc.satuSehatSyncStatus) {
        let val = enc.satuSehatSyncStatus
        try {
          while (typeof val === 'string') {
            val = JSON.parse(val)
          }
          parsedSyncStatus = val
        } catch (e) {
          console.error('Failed to parse satuSehatSyncStatus on row', enc.id, e)
        }
      }

      return {
        no: index + 1,
        key: enc.id,
        id: enc.id,
        encounterId: enc.id,
        fhirId: enc.fhirId,
        queueNumber,
        formattedQueueNumber,
        patient: {
          id: enc.patient?.id || '',
          name: enc.patient?.name || 'Unknown',
          medicalRecordNumber: enc.patient?.medicalRecordNumber || '',
          gender: enc.patient?.gender || 'male',
          age,
          birthDate: enc.patient?.birthDate || '',
          nik: enc.patient?.nik || ''
        },
        queueTicket: enc.queueTicket
          ? {
              id: enc.queueTicket.id,
              queueNumber,
              formattedQueueNumber: enc.queueTicket.formattedQueueNumber,
              queueDate: enc.queueTicket.queueDate,
              status: enc.queueTicket.status,
              poli: enc.queueTicket.poli,
              practitioner: enc.queueTicket.practitioner
            }
          : undefined,
        poli: { name: enc.queueTicket?.poli?.name || enc.serviceUnitCodeId || '-' },
        status: enc.status || 'unknown',
        hasObservations: true,
        visitDate: enc.startTime || enc.createdAt || new Date().toISOString(),
        encounterType: enc.encounterType,
        satuSehatSyncStatus: parsedSyncStatus
      }
    }
  )

  const patients: PatientListTableData[] = useMemo(() => {
    const filtered =
      activeStatus === 'all'
        ? allPatients
        : allPatients.filter((patient) => String(patient.status || '') === activeStatus)

    return filtered.map((patient, index) => ({
      ...patient,
      no: index + 1
    }))
  }, [activeStatus, allPatients])

  useEffect(() => {
    if (patients.length === 0) {
      setSelectedEncounterId(null)
      return
    }

    if (
      !selectedEncounterId ||
      !patients.some((patient) => patient.encounterId === selectedEncounterId)
    ) {
      setSelectedEncounterId(patients[0].encounterId)
    }
  }, [patients, selectedEncounterId])

  const selectedPatient = useMemo(() => {
    if (!selectedEncounterId) return patients[0]
    return patients.find((patient) => patient.encounterId === selectedEncounterId) || patients[0]
  }, [patients, selectedEncounterId])
  const selectedPatientLosDays = useMemo(() => {
    if (!selectedPatient?.visitDate) return 0
    const diff = dayjs().startOf('day').diff(dayjs(selectedPatient.visitDate).startOf('day'), 'day')
    return Math.max(0, diff)
  }, [selectedPatient?.visitDate])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(patients.length / perPage)),
    [patients.length, perPage]
  )
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * perPage
  const paginatedPatients = useMemo(
    () => patients.slice(startIdx, startIdx + perPage),
    [patients, startIdx, perPage]
  )
  const pageWindow = useMemo(() => {
    let start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const markAsInProgress = async (record: PatientListTableData) => {
    try {
      const queueId = record?.queueTicket?.id
      if (!queueId) {
        message.warning('Tidak dapat memperbarui status. Queue ID tidak ditemukan.')
        return
      }
      await updateStatusMutation.mutateAsync({ queueId: queueId, action: 'START_ENCOUNTER' })
      message.success(`Status antrian diperbarui: IN PROGRESS`)
      refetch()
    } catch (error: any) {
      message.error(error.message || 'Gagal memperbarui status')
    }
  }

  const handleViewRecord = async (record: PatientListTableData) => {
    try {
      await markAsInProgress(record)
    } catch (error: any) {
      message.error(`Gagal memperbarui status menjadi IN_PROGRESS: ${error.message || error}`)
    }

    window.open(`#/dashboard/doctor/${record.encounterId}`, '_blank')
  }
  const handleFeatureNotReady = () => {
    message.info('Fitur ini belum tersedia sebagai halaman terpisah.')
  }

  const handleFinishEncounter = (record: PatientListTableData) => {
    if (!record.encounterId) {
      message.warning('Encounter tidak ditemukan.')
      return
    }

    setDispositionRecord(record)
  }

  const handleDispositionBack = () => {
    setDispositionRecord(null)
  }

  const handleDispositionConfirm = async (payload: DesktopDispositionConfirmPayload) => {
    if (!dispositionRecord) return

    try {
      await dischargeEncounterMutation.mutateAsync({
        id: dispositionRecord.encounterId,
        dischargeDisposition: payload.dischargeDisposition as DoctorListDischargeDisposition,
        dischargeNote: payload.note || undefined
      })
      message.success('Pemeriksaan berhasil diselesaikan')
      setDispositionRecord(null)
      refetch()
    } catch (error: any) {
      message.error(error.message || 'Gagal menyelesaikan pemeriksaan')
    }
  }

  const handleBulkSyncSatusehat = async () => {
    try {
      setIsBulkSyncing(true)
      const fn = window.api?.query?.encounter?.bulkSyncSatusehat
      if (!fn) throw new Error('API IPC tidak tersedia')
      const result = await fn()
      if (result.success) {
        message.success(result.message || 'Proses sinkronisasi massal telah masuk antrean.')
        refetch()
      } else {
        message.error(result.error || 'Gagal memulai proses sinkronisasi massal.')
      }
    } catch (error: any) {
      message.error(error.message || 'Terjadi kesalahan sistem')
    } finally {
      setIsBulkSyncing(false)
    }
  }

  const handleExportData = async () => {
    try {
      setIsBulkSyncing(true)
      const fn = window.api?.query?.encounter?.exportData
      if (!fn) throw new Error('API perantara tidak tersedia')

      const params: any = {}
      if (searchText) params.q = searchText
      if (activeStatus && activeStatus !== 'all') {
        params.status = activeStatus
      }
      if (selectedPoli != null && String(selectedPoli).trim() !== '') {
        params.poliCodeId = String(selectedPoli)
      }
      if (doctorTargetId) params.doctorId = doctorTargetId
      if (dateRange) {
        params.startDate = dateRange[0].startOf('day').toISOString()
        params.endDate = dateRange[1].endOf('day').toISOString()
      }

      message.loading({ content: 'Menyiapkan file export...', key: 'exportMsg' })
      const result = await fn(params)

      if (result.success && result.base64Data) {
        const byteString = atob(result.base64Data)
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }

        const blob = new Blob([ab], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')

        const dateStr = dateRange
          ? `${dateRange[0].format('DD_MM_YYYY')}_Sd_${dateRange[1].format('DD_MM_YYYY')}`
          : new Date().toISOString().split('T')[0]

        a.href = url
        a.download = `Data_Kunjungan_Pasien_${dateStr}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        message.success({ content: 'File berhasil diunduh.', key: 'exportMsg' })
      } else {
        message.error({ content: result.error || 'Gagal export data kunjungan.', key: 'exportMsg' })
      }
    } catch (error: any) {
      message.error({
        content: error.message || 'Terjadi kesalahan saat mengekspor',
        key: 'exportMsg'
      })
    } finally {
      setIsBulkSyncing(false)
    }
  }

  const doSync = async (record: PatientListTableData) => {
    try {
      setSyncingRows((prev) => ({ ...prev, [record.encounterId]: true }))
      const fn = window.api?.query?.encounter?.syncSatusehat
      if (!fn) throw new Error('API IPC tidak tersedia')
      const result = await fn({ id: record.encounterId })
      if (result.success) {
        message.success(`Kunjungan ${record.patient.name} telah masuk antrean sinkronisasi.`)
        refetch()
      } else {
        message.error(result.error || 'Gagal mengirim antrean sinkronisasi.')
      }
    } catch (error: any) {
      message.error(error.message || 'Terjadi kesalahan sistem')
    } finally {
      setSyncingRows((prev) => ({ ...prev, [record.encounterId]: false }))
    }
  }

  const getStatusTag = (status: string) => {
    const cfg = STATUS_CONFIG[status]
    if (!cfg) return <Tag>{status}</Tag>
    return (
      <Tag color={cfg.color} bordered={false} className="font-medium rounded-md">
        {cfg.label}
      </Tag>
    )
  }

  const totalSynced = allPatients.filter(
    (p) => p.satuSehatSyncStatus?.encounterSynced || !!p.fhirId
  ).length
  const totalNotSynced = allPatients.length - totalSynced
  const totalInProgress = allPatients.filter((p) => p.status === 'IN_PROGRESS').length
  const totalFinished = allPatients.filter((p) => p.status === 'FINISHED').length

  const columns: ColumnsType<PatientListTableData> = [
    {
      title: '#',
      dataIndex: 'no',
      key: 'no',
      width: 44,
      align: 'center',
      render: (num: number) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: token.colorTextTertiary }}>{num}</span>
      )
    },
    {
      title: 'Antrian',
      dataIndex: 'formattedQueueNumber',
      key: 'queueNumber',
      width: 108,
      align: 'center',
      render: (queueLabel?: string) => {
        return (
          <Tag color="blue" bordered={false} className="font-mono font-semibold m-0">
            {queueLabel || '-'}
          </Tag>
        )
      }
    },
    {
      title: 'Pasien',
      key: 'patientInfo',
      width: 230,
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: token.colorPrimaryBg,
              border: `1px solid ${token.colorPrimaryBorder}`
            }}
          >
            <span style={{ color: token.colorPrimary, fontSize: 12, fontWeight: 700 }}>
              {record.patient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div
              style={{ fontWeight: 600, fontSize: 14, color: token.colorText }}
              className="truncate leading-tight"
            >
              {record.patient.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="font-mono rounded"
                style={{
                  fontSize: 10,
                  color: token.colorTextTertiary,
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  padding: '1px 6px'
                }}
              >
                {record.patient.medicalRecordNumber || '-'}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Jenis Kelamin',
      key: 'gender',
      width: 120,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}>
          {record.patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
        </span>
      )
    },
    {
      title: 'Umur',
      key: 'age',
      width: 80,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}>
          {record.patient.age} th
        </span>
      )
    },
    {
      title: 'Unit / Jenis',
      key: 'unitJenis',
      width: 160,
      render: (_, record) => {
        const poliName = record.poli.name
        const displayPoli =
          poliName === 'RAWAT_INAP'
            ? 'Rawat Inap'
            : poliName === 'RAWAT_JALAN'
              ? 'Rawat Jalan'
              : poliName === 'IGD'
                ? 'IGD'
                : poliName
                    .toLowerCase()
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())

        let typeLabel = record.encounterType || '-'
        let typeColor = 'default'
        switch (record.encounterType) {
          case 'EMER':
            typeLabel = 'IGD'
            typeColor = 'red'
            break
          case 'AMB':
            typeLabel = 'Rawat Jalan'
            typeColor = 'blue'
            break
          case 'IMP':
            typeLabel = 'Rawat Inap'
            typeColor = 'green'
            break
        }

        return (
          <div>
            <div
              style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}
              className="truncate"
            >
              {displayPoli}
            </div>
            <Tag color={typeColor} bordered={false} className="mt-0.5 text-[10px] font-medium m-0">
              {typeLabel}
            </Tag>
          </div>
        )
      }
    },
    {
      title: 'Dokter Tujuan',
      key: 'dokter',
      width: 150,
      render: (_, record) => {
        const doctorName = record.queueTicket?.practitioner?.namaLengkap || '-'
        return (
          <div
            style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}
            className="truncate"
            title={doctorName}
          >
            {doctorName}
          </div>
        )
      }
    },
    {
      title: 'Tgl Kunjungan',
      dataIndex: 'visitDate',
      key: 'visitDate',
      width: 135,
      render: (date: string) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>
            {dayjs(date).format('DD MMM YYYY')}
          </div>
          <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'SatuSehat',
      dataIndex: 'fhirId',
      key: 'satuSehatStatus',
      width: 110,
      align: 'center',
      render: (_: string, record) => {
        const s = record.satuSehatSyncStatus
        const isSynced = s?.encounterSynced || !!record.fhirId

        if (!isSynced) {
          return (
            <Tag
              color="default"
              bordered={false}
              className="text-[10px] font-medium cursor-default"
            >
              Belum Sync
            </Tag>
          )
        }

        const hasPendingResync = s?.hasPendingResync ?? false
        const hasPartial =
          s &&
          !s.allSynced &&
          Object.values(s.resources).some(
            (r) =>
              r.total > 0 &&
              (r.synced < r.total ||
                (r.logSummary?.failed ?? 0) > 0 ||
                (r.logSummary?.retry ?? 0) > 0)
          )

        let tagColor = 'success'
        let tagText = 'Terkirim'
        if (hasPendingResync) {
          tagColor = 'orange'
          tagText = 'Perlu Resync'
        } else if (hasPartial) {
          tagColor = 'warning'
          tagText = 'Terkirim*'
        }

        return (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleOpenSyncDetail(s ?? null, record.fhirId)
            }}
            className="inline-block cursor-pointer"
          >
            <Tag
              color={tagColor}
              bordered={false}
              className="text-[10px] font-medium hover:opacity-80 transition-opacity m-0"
            >
              {tagText}
            </Tag>
          </div>
        )
      }
    }
  ]

  const statusDisplayTabs = [
    { key: 'all', config: STATUS_CONFIG['all'] },
    { key: 'IN_PROGRESS', config: STATUS_CONFIG['IN_PROGRESS'] },
    { key: 'FINISHED', config: STATUS_CONFIG['FINISHED'] }
  ]

  const statusTabItems = statusDisplayTabs.map(({ key, config }) => {
    let count = 0
    if (key === 'all') {
      count = allPatients.length
    } else if (key === 'FINISHED') {
      count = allPatients.filter((p) => p.status === 'FINISHED').length
    } else {
      count = allPatients.filter((p) => p.status === key).length
    }

    return {
      value: key,
      label: (
        <span className="flex items-center gap-2 px-1">
          {config.label}
          {count > 0 && (
            <Badge count={count} color={config.dotColor} size="small" style={{ fontSize: 10 }} />
          )}
        </span>
      )
    }
  })
  const isDefaultDateRange = Boolean(
    dateRange?.[0]?.isSame(dayjs(), 'day') && dateRange?.[1]?.isSame(dayjs(), 'day')
  )
  const hasActiveFilters =
    searchText.trim().length > 0 ||
    (!isPoliLockedFromRoute && selectedPoli !== undefined && selectedPoli !== null) ||
    !isDefaultDateRange ||
    activeStatus !== 'IN_PROGRESS'
  const clearFilters = () => {
    setSearchText('')
    if (!isPoliLockedFromRoute) setSelectedPoli(undefined)
    setDateRange([dayjs(), dayjs()])
    setActiveStatus('IN_PROGRESS')
    setCurrentPage(1)
  }

  if (dispositionRecord) {
    const paymentMethod = dispositionRecord.queueTicket?.paymentMethod || '-'
    const encounterTypeLabel = getEncounterTypeLabel(dispositionRecord.encounterType)
    const visitDate = formatVisitDate(dispositionRecord.visitDate)

    return (
      <div className="h-full overflow-auto px-4 py-4">
        <DesktopDispositionWorkflow
          patient={{
            name: dispositionRecord.patient?.name || '-',
            registrationNumber: dispositionRecord.encounterId,
            ageLabel:
              typeof dispositionRecord.patient?.age === 'number'
                ? `${dispositionRecord.patient.age} th`
                : '-',
            paymentLabel: paymentMethod,
            statusLabel: `Encounter ${encounterTypeLabel}`
          }}
          bannerMeta={DOCTOR_LIST_DISPOSITION_BANNER_META}
          summaryItems={[
            { label: 'Encounter', value: dispositionRecord.encounterId, mono: true },
            {
              label: 'No. RM',
              value: dispositionRecord.patient?.medicalRecordNumber || '-',
              mono: true
            },
            {
              label: 'Umur',
              value:
                typeof dispositionRecord.patient?.age === 'number'
                  ? `${dispositionRecord.patient.age} tahun`
                  : '-'
            },
            { label: 'Jenis Kelamin', value: getGenderLabel(dispositionRecord.patient?.gender) },
            { label: 'Tipe Kunjungan', value: encounterTypeLabel },
            { label: 'Poli', value: dispositionRecord.poli?.name || '-' },
            {
              label: 'Dokter',
              value: dispositionRecord.queueTicket?.practitioner?.namaLengkap || '-'
            },
            { label: 'Tanggal Kunjungan', value: visitDate, mono: true },
            { label: 'Penjamin', value: paymentMethod }
          ]}
          options={DOCTOR_LIST_DISPOSITION_OPTIONS}
          breadcrumbItems={['Dokter', 'Daftar Antrian & Kunjungan']}
          title="Disposisi Pemeriksaan"
          resumeDocumentLabel="Resume Medis"
          backendNote="Detail field mockup seperti instruksi DPJP, obat pulang, penyebab kematian, dan data klinis tambahan sebagian besar masih UI; yang dikirim dari disposisi umum baru dischargeDisposition dan dischargeNote."
          dischargeStatusDispositionMap={{
            sembuh: 'home',
            rujuk: 'other-hcf',
            meninggal: 'exp'
          }}
          renderReferralForm={() => (
            <ReferralForm
              encounterId={dispositionRecord.encounterId}
              patientId={dispositionRecord.patient?.id}
              variant="embedded"
              showHistory={false}
              title="Buat Rujukan"
              submitLabel="Buat Rujukan & Selesaikan Pemeriksaan"
              patientData={{
                patient: {
                  id: dispositionRecord.patient?.id,
                  name: dispositionRecord.patient?.name,
                  medicalRecordNumber: dispositionRecord.patient?.medicalRecordNumber
                },
                doctor: {
                  name: dispositionRecord.queueTicket?.practitioner?.namaLengkap
                }
              }}
              onSuccess={async () => {
                await handleDispositionConfirm({
                  type: 'rujuk-e',
                  dischargeStatus: 'rujuk',
                  dischargeDisposition: 'other-hcf',
                  note: ''
                })
              }}
            />
          )}
          isSubmitting={dischargeEncounterMutation.isPending}
          onBack={handleDispositionBack}
          onConfirm={handleDispositionConfirm}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <TeamOutlined
                    className="text-base"
                    style={{ color: token.colorSuccessBg, fontSize: 16 }}
                  />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Daftar Antrian &amp; Kunjungan
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen pelayanan pasien Rawat Jalan, Inap, dan IGD
              </p>
              <div className="ml-12 mt-2 flex flex-wrap items-center gap-2">
                {/* <Tag color="blue" bordered={false} className="m-0 font-medium">
                  Poli Aktif: {activePoliLabel}
                </Tag> */}
                {/* {isPoliLockedFromRoute && routePoliCode && (
                  <Tag color="cyan" bordered={false} className="m-0 font-medium">
                    Dari PoliSelect
                  </Tag>
                )} */}
                {/* {doctorTargetLabel && (
                  <Tag color="geekblue" bordered={false} className="m-0 font-medium">
                    Dokter Tujuan: {doctorTargetLabel}
                  </Tag>
                )} */}
              </div>
            </div>
            <Space size="small" align="center">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                className="border-white/30 text-white hover:border-white hover:text-white"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportData}
                loading={isBulkSyncing}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                Export Excel
              </Button>
              <Popconfirm
                title="Sinkronisasi Semua Encounter"
                description="Apakah Anda yakin ingin menyinkronkan semua data kunjungan ke antrean SatuSehat?"
                onConfirm={handleBulkSyncSatusehat}
                okText="Ya, Sinkronisasi"
                cancelText="Batal"
              >
                <Button
                  icon={<CloudSyncOutlined />}
                  loading={isBulkSyncing}
                  style={{
                    background: token.colorSuccess,
                    borderColor: token.colorSuccessActive,
                    color: '#fff'
                  }}
                >
                  Sync Semua{totalNotSynced > 0 ? ` (${totalNotSynced})` : ''}
                </Button>
              </Popconfirm>
            </Space>
          </div>
          {/* Extra children for header e.g add stats view */}
          <div className="grid grid-cols-4 gap-3">
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <TeamOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {patients.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Kunjungan
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorWarning}33` }}
              >
                <ClockCircleOutlined style={{ color: token.colorWarningBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {totalInProgress}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Sedang Diperiksa
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorSuccess}33` }}
              >
                <CheckCircleOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {totalFinished}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Selesai
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorSuccess}33` }}
              >
                <ExceptionOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {totalSynced}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Sync SatuSehat
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <Card
          className="flex-1 overflow-hidden flex flex-col"
          variant="borderless"
          styles={{ body: { padding: 0 } }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
          >
            <div className="flex gap-2 items-center flex-wrap">
              <div className="min-w-[260px] flex-1">
                <Input
                  placeholder="Cari nama pasien atau No. RM..."
                  prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value)
                    setCurrentPage(1)
                  }}
                  allowClear
                />
              </div>
              <Segmented
                value={activeStatus}
                onChange={(value) => {
                  setActiveStatus(String(value))
                  setCurrentPage(1)
                }}
                options={statusTabItems}
              />
            </div>

            <div className="flex gap-2 mt-3 items-center flex-wrap">
              <div className="min-w-[220px] flex-1 max-w-[300px]">
                <SelectPoli
                  valueType="id"
                  placeholder="Semua Unit"
                  className="w-full"
                  allowClear={!isPoliLockedFromRoute}
                  disabled={isPoliLockedFromRoute}
                  value={selectedPoli}
                  onChange={(value) => {
                    setSelectedPoli(value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDateRange((dates as [dayjs.Dayjs, dayjs.Dayjs]) || [dayjs(), dayjs()])
                  setCurrentPage(1)
                }}
                format="DD MMM YYYY"
                allowClear={false}
              />
              {hasActiveFilters && (
                <Button type="text" size="small" onClick={clearFilters}>
                  Reset filter
                </Button>
              )}
              <span className="ml-auto text-xs" style={{ color: token.colorTextTertiary }}>
                <b style={{ color: token.colorText }}>{patients.length}</b> hasil
              </span>
            </div>
          </div>

          <div className="px-0 pb-0">
            <style>
              {`
                .doctor-patient-list-table .ant-table-tbody > tr.doctor-row-selected > td,
                .doctor-patient-list-table .ant-table-tbody > tr.doctor-row-selected:hover > td {
                  background: ${token.colorPrimaryBg} !important;
                }
              `}
            </style>
            <DesktopGenericTable<PatientListTableData>
              columns={columns}
              dataSource={paginatedPatients}
              rowKey="key"
              loading={isLoading}
              tableProps={{
                className: 'doctor-patient-list-table',
                scroll: { x: 1250, y: 'calc(100vh - 460px)' },
                size: 'middle',
                rowClassName: (record) =>
                  record.encounterId === selectedPatient?.encounterId ? 'doctor-row-selected' : '',
                onRow: (record) => ({
                  onClick: () => setSelectedEncounterId(record.encounterId),
                  style: {
                    cursor: 'pointer'
                  }
                })
              }}
            />
          </div>
          <div
            className="px-4 py-2 flex items-center gap-2 text-xs"
            style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}
          >
            <span style={{ color: token.colorTextSecondary }}>
              {patients.length === 0
                ? 'Tidak ada data'
                : `Menampilkan ${startIdx + 1}-${Math.min(startIdx + perPage, patients.length)} dari ${patients.length} pasien`}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                ‹
              </button>
              {pageWindow.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className="px-2.5 py-0.5 rounded border text-xs"
                  style={{
                    borderColor:
                      pageNumber === safePage ? token.colorPrimary : token.colorBorderSecondary,
                    background:
                      pageNumber === safePage ? token.colorPrimary : token.colorBgContainer,
                    color: pageNumber === safePage ? '#fff' : token.colorText
                  }}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                »
              </button>
              <select
                value={perPage}
                onChange={(event) => {
                  setPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-0.5 rounded border text-xs"
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: token.colorBgContainer
                }}
              >
                <option value={5}>5 / hal</option>
                <option value={10}>10 / hal</option>
                <option value={25}>25 / hal</option>
                <option value={50}>50 / hal</option>
              </select>
            </div>
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <span>Ringkasan</span>
              <Tag className="m-0" color="blue">
                {selectedPatient?.poli.name || '-'}
              </Tag>
            </div>
          }
          variant="borderless"
        >
          {selectedPatient ? (
            <div className="flex flex-col gap-4">
              <div
                className="flex items-center gap-3 pb-3 border-b"
                style={{ borderColor: token.colorBorderSecondary }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: token.colorPrimaryBg,
                    border: `1px solid ${token.colorPrimaryBorder}`
                  }}
                >
                  <span style={{ color: token.colorPrimary, fontSize: 13, fontWeight: 700 }}>
                    {selectedPatient.patient.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {selectedPatient.patient.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {selectedPatient.patient.age} th ·{' '}
                    {selectedPatient.patient.medicalRecordNumber || '-'}
                  </div>
                </div>
              </div>

              <div
                className="grid grid-cols-2 gap-3 text-xs pb-2 border-b"
                style={{ borderColor: token.colorBorderSecondary }}
              >
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">Dx</div>
                  <div className="font-medium">
                    {toEncounterSummaryType(selectedPatient.encounterType)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">LOS</div>
                  <div className="font-medium">{selectedPatientLosDays} hari</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">
                    Est. Pulang
                  </div>
                  <div className="font-medium">
                    {selectedPatient.status === 'FINISHED'
                      ? dayjs(selectedPatient.visitDate).format('DD MMM YYYY')
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">SEP</div>
                  <div className="font-medium">{selectedPatient.fhirId || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">Status</div>
                  <div>{getStatusTag(selectedPatient.status)}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">Antrian</div>
                  <div className="font-medium">{selectedPatient.formattedQueueNumber || '-'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500 uppercase font-semibold tracking-wide mb-1">
                    DPJP
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="font-medium text-xs truncate"
                      title={selectedPatient.queueTicket?.practitioner?.namaLengkap || '-'}
                    >
                      {selectedPatient.queueTicket?.practitioner?.namaLengkap || '-'}
                    </div>
                    <Button
                      size="small"
                      type="text"
                      className="!text-[10px] !px-2 !h-6 !text-blue-600"
                    >
                      Ganti
                    </Button>
                  </div>
                </div>
              </div>

              {selectedPatientLosDays >= 7 && (
                <div
                  className="text-xs px-3 py-2 rounded"
                  style={{
                    background: token.colorWarningBg,
                    border: `1px solid ${token.colorWarningBorder}`,
                    color: token.colorWarningText
                  }}
                >
                  {selectedPatientLosDays >= 14
                    ? 'LOS sangat panjang - perlu evaluasi.'
                    : 'LOS panjang - monitor DPJP.'}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <Button type="primary" onClick={() => handleViewRecord(selectedPatient)}>
                  Pemeriksaan Lengkap
                </Button>
                <Button onClick={handleFeatureNotReady}>Buka CPPT</Button>
                <Button onClick={handleFeatureNotReady}>Vital Signs</Button>
                <Button onClick={handleFeatureNotReady}>Resep / MAR</Button>
                <Button>Tetapkan / Ganti DPJP</Button>
                <Button disabled>Transfer Kamar</Button>
                {selectedPatient.status === 'IN_PROGRESS' && (
                  <Button type="primary" onClick={() => handleFinishEncounter(selectedPatient)}>
                    Proses Pulang
                  </Button>
                )}
                {selectedPatient.status !== 'IN_PROGRESS' && (
                  <Button type="primary" disabled>
                    Proses Pulang
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Tidak ada data pasien.</div>
          )}
        </Card>
      </div>
    </div>
  )
}
