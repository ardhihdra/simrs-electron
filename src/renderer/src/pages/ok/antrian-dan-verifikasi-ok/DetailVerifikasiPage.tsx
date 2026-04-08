import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import dayjs from 'dayjs'
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  theme
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { ChecklistPreOpForm } from '../../../components/organisms/OK/ChecklistPreOpForm'
import { SignInForm, TimeOutForm } from '../../../components/organisms/OK/WHOChecklist'
import { SignOutForm, ChecklistPostOpForm } from '../../../components/organisms/OK/PostOpForms'
import {
  TagihanOKView,
  type BillingChargeRow,
  type BillingComputedData,
  type BillingKomponenRow,
  type BillingLetterMeta
} from '../../../components/organisms/OK/BillingTagihanView'
import AutoRolePetugasListCard from '../../../components/organisms/Assessment/DetailTindakan/AutoRolePetugasListCard'
import PaketOperationBreakdown from '../../../components/organisms/Assessment/DetailTindakan/PaketOperationBreakdown'
import {
  useOkRequestList,
  useSaveOkRequestChecklists,
  useVerifyOkRequest
} from '@renderer/hooks/query/use-ok-request'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useOperatingRoomList } from '@renderer/hooks/query/use-operating-room'
import { useEncounterDetail } from '@renderer/hooks/query/use-encounter'
import { useMasterJenisKomponenList } from '@renderer/hooks/query/use-master-jenis-komponen'
import { useMasterPaketTindakanList } from '@renderer/hooks/query/use-master-paket-tindakan'
import {
  useCreateDetailTindakan,
  useDetailTindakanByEncounter,
  useUpdateDetailTindakan
} from '@renderer/hooks/query/use-detail-tindakan-pasien'
import { OkRequestStatus } from 'simrs-types'

const { Text } = Typography

interface BackendOkRequestPaket {
  id?: number
  paketId?: number
  paketKodeSnapshot?: string | null
  paketNamaSnapshot?: string | null
  kategoriPaketSnapshot?: string | null
  kelasTarifSnapshot?: string | null
  tarifPaketSnapshot?: number | string | null
  sortOrder?: number | null
}

interface BackendPreOpChecklist {
  preopIdentitas?: string | null
  preopSuratIjinBedah?: string | null
  preopPersiapanDarah?: string | null
  preopKeadaanUmumPasien?: string | null
  preopSuratIjinAnestesi?: string | null
  preopPenandaAreaOperasi?: string | null
  preopSuratIjinTransfusi?: string | null
  preopPerlengkapanKhususImplan?: string | null
  preopPenunjangRadiologi?: string | null
  preopPenunjangLsig?: string | null
  preopPenunjangMri?: string | null
  preopPenunjangEkg?: string | null
  preopPenunjangCtScan?: string | null
  petugasRuanganId?: number | null
  petugasOkId?: number | null
  catatanDPJP?: string | null
  catatanAnestesi?: string | null
}

interface BackendWhoChecklist {
  signIn?: {
    identitas?: string | null
    alergi?: string | null
    risikoAspirasiDanFaktorPenyulit?: string | null
    risikoKehilanganDarahAnak?: string | null
    rencanaAntisipasiKehilanganDarah?: string | null
    kesiapanAlatObatAnestesi?: string | null
    rencanaAntisipasiAnestesi?: string | null
    penandaanAreaOperasi?: string | null
    jalurIvLine?: string | null
    perawatKamarOperasiId?: number | null
  } | null
  timeOut?: {
    timKonfirmasi?: string | null
    konfirmasiNama?: string | null
    konfirmasiProsedurFinal?: string | null
    konfirmasiSisi?: string | null
    antibiotikProfilaksis?: string | null
    imagingTersedia?: string | null
    catatanKritis?: string | null
    catatanTimeOut?: string | null
  } | null
}

interface BackendPostOpChecklist {
  signOut?: {
    hitungInstrumen?: string | null
    hitungKasa?: string | null
    hitungJarum?: string | null
    spesimenDilabeli?: string | null
    masalahPeralatan?: string | null
    catatanSignOut?: string | null
  } | null
  checklist?: {
    kondisi_pasien?: Record<string, string | null | undefined>
    luka_operasi?: Record<string, string | null | undefined>
    administrasi_keluar_ok?: Record<string, string | null | undefined>
  } | null
}

interface BackendOkRequest {
  id: number
  kode?: string | null
  encounterId?: string | null
  sourceUnit?: string | null
  dpjpId?: number | null
  operatingRoomId?: number | null
  requestedAt?: string | null
  scheduledAt?: string | null
  estimatedDurationMinutes?: number | null
  priority?: string | null
  status?: string | null
  mainDiagnosis?: string | null
  plannedProcedureSummary?: string | null
  notes?: string | null
  dokumenPendukung?: string | null
  rejectionReason?: string | null
  createdBy?: number | null
  paketTindakanList?: BackendOkRequestPaket[]
  preOpChecklist?: BackendPreOpChecklist | null
  whoChecklist?: BackendWhoChecklist | null
  postOpChecklist?: BackendPostOpChecklist | null
}

interface EncounterDetailResponse {
  result?: {
    patient?: {
      id?: string
      name?: string
      medicalRecordNumber?: string
    }
    patientId?: string
    queueTicket?: {
      paymentMethod?: string | null
    }
  }
}

interface TeamMember {
  roleTenaga: string
  pegawaiId: number
}

interface TeamMemberAssignment {
  roleTenaga: string
  pegawaiId?: number
}

interface TeamMemberFormItem {
  roleTenaga?: string
  pegawaiId?: number | null
}

interface TeamOperationFormValues {
  kelas?: string
  teamMembers?: TeamMemberFormItem[]
}

interface PaketRow {
  key: string
  no: number
  paketId: number
  kode: string
  nama: string
  kategori: string
  kelasTarifSnapshot: string | null
  tarifSnapshot: number | null
}

interface PaketTeamState {
  kelas: string
  roleList: string[]
  teamMembers: TeamMemberAssignment[]
}

interface PaketTarifKomponenRef {
  jenisKomponenId?: number | string | null
  kode?: string | null
  jenisKomponen?: {
    id?: number
    kode?: string | null
    label?: string | null
    isUntukMedis?: boolean | null
  } | null
}

interface PaketTarifRincianRef {
  paketDetailId?: number | string | null
  komponenTarifList?: PaketTarifKomponenRef[] | null
}

interface PaketTarifHeaderRef {
  kelas?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  rincianTarif?: PaketTarifRincianRef[] | null
}

interface PaketMasterDetailItemRef {
  id?: number | string | null
  paketId?: number | string | null
  masterTindakanId?: number | string | null
  qty?: number | string | null
  satuan?: string | null
  tindakan?: {
    namaTindakan?: string | null
  } | null
  masterTindakan?: {
    namaTindakan?: string | null
  } | null
  bhpList?: PaketMasterBhpItemRef[] | null
}

interface PaketMasterBhpItemRef {
  id?: number | string | null
  paketDetailId?: number | string | null
  itemId?: number | string | null
  includedInPaket?: boolean | null
  jumlahDefault?: number | string | null
  jumlah?: number | string | null
  qty?: number | string | null
  satuan?: string | null
  item?: {
    nama?: string | null
    sellingPrice?: number | string | null
  } | null
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: 'Menunggu Verifikasi', color: 'orange' },
  verified: { label: 'Disetujui', color: 'green' },
  rejected: { label: 'Ditolak', color: 'red' },
  in_progress: { label: 'Sedang Diproses', color: 'blue' },
  done: { label: 'Selesai', color: 'green' },
  cancelled: { label: 'Dibatalkan', color: 'red' }
}

const formatDate = (value?: string | null): string => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '-'
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : '-'
}

const formatCurrency = (value?: number | null): string =>
  `Rp ${Number(value || 0).toLocaleString('id-ID')}`

const formatTimeRange = (startAt?: string | null, durationMinutes?: number | null): string => {
  if (!startAt) return '-'
  const start = dayjs(startAt)
  if (!start.isValid()) return '-'

  if (durationMinutes && durationMinutes > 0) {
    const end = start.add(durationMinutes, 'minute')
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}`
  }

  return start.format('HH:mm')
}

const normalizeKelas = (kelas: unknown): string =>
  String(kelas || '')
    .trim()
    .toLowerCase()

const isCytoFromPriority = (priority: unknown): boolean => {
  const normalized = String(priority || '')
    .trim()
    .toLowerCase()

  if (normalized === 'emergency' || normalized === 'cyto' || normalized === 'cito') {
    return true
  }

  return false
}

const mapPaymentMethodToTarifKelas = (paymentMethod: unknown): string => {
  const normalized = String(paymentMethod || '')
    .trim()
    .toLowerCase()

  switch (normalized) {
    case 'cash':
      return 'umum'
    case 'bpjs':
      return 'bpjs'
    case 'asuransi':
      return 'asuransi'
    case 'company':
      return 'company'
    default:
      return normalized || 'umum'
  }
}

const getKelasLabel = (kelas: string): string => {
  const normalized = normalizeKelas(kelas)
  if (!normalized) return '-'
  if (normalized.startsWith('kelas_'))
    return `Kelas ${normalized.replace('kelas_', '').toUpperCase()}`
  if (normalized === 'vip') return 'VIP'
  if (normalized === 'vvip') return 'VVIP'
  if (normalized === 'bpjs') return 'BPJS'
  if (normalized === 'umum') return 'Umum'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const parseNumber = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const KELAS_OPTIONS_BASE = [
  { value: 'kelas_1', label: 'Kelas 1' },
  { value: 'kelas_2', label: 'Kelas 2' },
  { value: 'kelas_3', label: 'Kelas 3' },
  { value: 'vip', label: 'VIP' },
  { value: 'vvip', label: 'VVIP' },
  { value: 'umum', label: 'Umum / Non Kelas' }
]

const isDateWithinPeriod = (tanggal: string, from?: string | null, to?: string | null) => {
  const start = String(from || '')
  const end = to ? String(to) : null
  if (!start) return false
  if (start > tanggal) return false
  if (end && end < tanggal) return false
  return true
}

const pickTarifForKelasAndDate = (
  tarifList: PaketTarifHeaderRef[],
  kelas: string,
  tanggal: string
) => {
  const kelasTarget = normalizeKelas(kelas)
  const kelasPriority = Array.from(new Set([kelasTarget, 'umum'].filter(Boolean)))

  const candidates = (tarifList || [])
    .filter((tarif) => isDateWithinPeriod(tanggal, tarif?.effectiveFrom, tarif?.effectiveTo))
    .sort((a, b) => {
      const kelasA = normalizeKelas(a?.kelas)
      const kelasB = normalizeKelas(b?.kelas)
      const rankA = kelasPriority.indexOf(kelasA)
      const rankB = kelasPriority.indexOf(kelasB)
      const safeRankA = rankA === -1 ? Number.MAX_SAFE_INTEGER : rankA
      const safeRankB = rankB === -1 ? Number.MAX_SAFE_INTEGER : rankB
      if (safeRankA !== safeRankB) return safeRankA - safeRankB

      const fromA = String(a?.effectiveFrom ?? '')
      const fromB = String(b?.effectiveFrom ?? '')
      return fromB.localeCompare(fromA)
    })

  return candidates[0]
}

const normalizeTeamAssignments = (
  source: TeamMemberFormItem[] | TeamMemberAssignment[] | TeamMember[]
): TeamMemberAssignment[] => {
  const mapped = (Array.isArray(source) ? source : [])
    .map((item) => ({
      roleTenaga: String(item?.roleTenaga || '').trim(),
      pegawaiId:
        Number.isFinite(Number(item?.pegawaiId)) && Number(item?.pegawaiId) > 0
          ? Number(item?.pegawaiId)
          : undefined
    }))
    .filter((item) => item.roleTenaga)

  const deduped = new Map<string, TeamMemberAssignment>()
  mapped.forEach((item) => {
    const existing = deduped.get(item.roleTenaga)
    if (!existing || item.pegawaiId) {
      deduped.set(item.roleTenaga, item)
    }
  })

  return Array.from(deduped.values())
}

const toValidTeamMembers = (source: TeamMemberAssignment[]): TeamMember[] => {
  const deduped = new Map<string, TeamMember>()
  ;(Array.isArray(source) ? source : []).forEach((item) => {
    const roleTenaga = String(item?.roleTenaga || '').trim()
    const pegawaiId = Number(item?.pegawaiId)
    if (!roleTenaga || !Number.isFinite(pegawaiId) || pegawaiId <= 0) return
    deduped.set(`${roleTenaga}::${pegawaiId}`, { roleTenaga, pegawaiId })
  })
  return Array.from(deduped.values())
}

const buildRoleAssigneeMap = (source: TeamMemberAssignment[] | TeamMember[]) => {
  const map = new Map<string, number>()
  ;(Array.isArray(source) ? source : []).forEach((item) => {
    const roleTenaga = String(item?.roleTenaga || '').trim()
    const pegawaiId = Number(item?.pegawaiId)
    if (!roleTenaga || !Number.isFinite(pegawaiId) || pegawaiId <= 0) return
    if (!map.has(roleTenaga)) {
      map.set(roleTenaga, pegawaiId)
    }
  })
  return map
}

const DetailVerifikasiPage = () => {
  const { id } = useParams()
  const { modal, message } = App.useApp()
  const { token } = theme.useToken()

  const [preOpForm] = Form.useForm()
  const [signInForm] = Form.useForm()
  const [timeOutForm] = Form.useForm()
  const [signOutForm] = Form.useForm()
  const [postOpCheckForm] = Form.useForm()
  const [paketTeamForm] = Form.useForm<TeamOperationFormValues>()

  const [paketTeamMap, setPaketTeamMap] = useState<Record<number, PaketTeamState>>({})
  const [isPaketTeamModalOpen, setIsPaketTeamModalOpen] = useState(false)
  const [activePaketForTeam, setActivePaketForTeam] = useState<PaketRow | null>(null)
  const [paketTeamModalWarning, setPaketTeamModalWarning] = useState<string | null>(null)
  const [isPaketTeamInitialized, setIsPaketTeamInitialized] = useState(false)
  const [restoreWarning, setRestoreWarning] = useState<string | null>(null)

  const routeId = String(id || '').trim()

  const {
    data: okRequestData,
    isLoading: isLoadingOkRequest,
    isFetching: isFetchingOkRequest,
    error: okRequestError,
    refetch: refetchOkRequest
  } = useOkRequestList()

  const { data: performers, isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse',
    'bidan'
  ])
  const { data: preOpPerformers = [], isLoading: isLoadingPreOpPerformers } = usePerformers([
    'doctor',
    'nurse'
  ])
  const { data: signInNursePerformers = [], isLoading: isLoadingSignInNursePerformers } =
    usePerformers(['nurse'])
  const { data: operatingRooms } = useOperatingRoomList()
  const { data: listJenisKomponen = [] } = useMasterJenisKomponenList({
    isUntukMedis: true,
    items: 200
  })
  const { data: masterPaketList = [] } = useMasterPaketTindakanList({
    aktif: true,
    items: 500,
    depth: 1
  })

  const verifyOkRequest = useVerifyOkRequest()
  const saveOkRequestChecklists = useSaveOkRequestChecklists()

  const okRequests = useMemo<BackendOkRequest[]>(() => {
    return Array.isArray(okRequestData) ? (okRequestData as BackendOkRequest[]) : []
  }, [okRequestData])

  const selectedRequest = useMemo(() => {
    if (!routeId) return undefined
    return okRequests.find(
      (item) => String(item.id) === routeId || (item.kode ? item.kode === routeId : false)
    )
  }, [okRequests, routeId])

  const createDetailTindakan = useCreateDetailTindakan(selectedRequest?.encounterId || undefined)
  const updateDetailTindakan = useUpdateDetailTindakan(selectedRequest?.encounterId || undefined)

  const { data: encounterDetailResponse, isLoading: isLoadingEncounter } = useEncounterDetail(
    selectedRequest?.encounterId || undefined
  )

  const encounterDetail = (encounterDetailResponse as EncounterDetailResponse | undefined)?.result

  const { data: detailTindakanByEncounter = [] } = useDetailTindakanByEncounter(
    selectedRequest?.encounterId || undefined
  )

  const performerMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(performers || []).forEach((item) => {
      if (typeof item.id === 'number') map.set(item.id, item.name)
    })
    return map
  }, [performers])

  const preOpPerformerOptions = useMemo(() => {
    return (preOpPerformers || [])
      .filter((item) => Number.isFinite(Number(item?.id)) && Number(item.id) > 0)
      .map((item) => ({
        value: Number(item.id),
        label: item.name
      }))
  }, [preOpPerformers])

  const signInNurseOptions = useMemo(() => {
    return (signInNursePerformers || [])
      .filter((item) => Number.isFinite(Number(item?.id)) && Number(item.id) > 0)
      .map((item) => ({
        value: Number(item.id),
        label: item.name
      }))
  }, [signInNursePerformers])

  const operatingRoomMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(operatingRooms || []).forEach((item) => {
      if (typeof item.id === 'number') {
        const label = `${item.nama || 'Ruang OK'}${item.kelas ? ` (${item.kelas})` : ''}`
        map.set(item.id, label)
      }
    })
    return map
  }, [operatingRooms])

  const paketById = useMemo(() => {
    const map = new Map<number, any>()
    ;(masterPaketList || []).forEach((item) => {
      const paketId = Number(item?.id)
      if (Number.isFinite(paketId) && paketId > 0) {
        map.set(paketId, item)
      }
    })
    return map
  }, [masterPaketList])

  const roleOptions = useMemo(() => {
    const fromMaster = listJenisKomponen
      .map((item) => {
        const kode = String(item?.kode || '').trim()
        const label = String(item?.label || '').trim()
        if (!kode || !label) return null
        return { value: kode, label }
      })
      .filter((item): item is { value: string; label: string } => !!item)

    if (fromMaster.length > 0) return fromMaster

    return [
      { value: 'operator_utama', label: 'Dokter Operator Utama' },
      { value: 'anestesi', label: 'Dokter Anestesi' },
      { value: 'asisten_operator', label: 'Asisten Operator' },
      { value: 'perawat_instrumen', label: 'Perawat Instrumen' },
      { value: 'perawat_sirkuler', label: 'Perawat Sirkuler' }
    ]
  }, [listJenisKomponen])

  const roleLabelByCode = useMemo(
    () => new Map(roleOptions.map((item) => [item.value, item.label])),
    [roleOptions]
  )

  const roleByKomponenId = useMemo(
    () => new Map((listJenisKomponen || []).map((item) => [Number(item.id), item.kode])),
    [listJenisKomponen]
  )

  const selectedTarifKelas = useMemo(() => {
    const paymentMethod = encounterDetail?.queueTicket?.paymentMethod
    return normalizeKelas(mapPaymentMethodToTarifKelas(paymentMethod)) || 'umum'
  }, [encounterDetail?.queueTicket?.paymentMethod])

  const kelasOptions = useMemo(() => {
    const optionMap = new Map<string, string>()
    KELAS_OPTIONS_BASE.forEach((item) => {
      optionMap.set(normalizeKelas(item.value), item.label)
    })
    ;(masterPaketList || []).forEach((paket) => {
      const tarifList = Array.isArray((paket as any)?.tarifList)
        ? ((paket as any).tarifList as PaketTarifHeaderRef[])
        : []
      tarifList.forEach((tarif) => {
        const kelas = normalizeKelas(tarif?.kelas)
        if (!kelas) return
        if (!optionMap.has(kelas)) {
          optionMap.set(kelas, getKelasLabel(kelas))
        }
      })
    })

    if (!optionMap.has(selectedTarifKelas)) {
      optionMap.set(selectedTarifKelas, getKelasLabel(selectedTarifKelas))
    }

    return Array.from(optionMap.entries()).map(([value, label]) => ({ value, label }))
  }, [masterPaketList, selectedTarifKelas])

  const roleResolutionDate = useMemo(() => {
    const rawDate =
      selectedRequest?.scheduledAt || selectedRequest?.requestedAt || dayjs().toISOString()
    return dayjs(rawDate).format('YYYY-MM-DD')
  }, [selectedRequest?.requestedAt, selectedRequest?.scheduledAt])

  const resolveRolesFromPaketByClass = useCallback(
    (paketId: number, kelas: string): string[] => {
      const selectedPaket = paketById.get(paketId)
      const tarifList = Array.isArray(selectedPaket?.tarifList)
        ? (selectedPaket.tarifList as PaketTarifHeaderRef[])
        : []
      if (!selectedPaket || tarifList.length === 0) return []

      const pickedTarif = pickTarifForKelasAndDate(tarifList, kelas, roleResolutionDate)
      if (!pickedTarif) return []

      const detailItems = Array.isArray(selectedPaket?.listTindakan)
        ? selectedPaket.listTindakan
        : Array.isArray(selectedPaket?.detailItems)
          ? selectedPaket.detailItems
          : []
      const entryDetailIds = new Set<number>(
        detailItems
          .map((item: any) => Number(item?.id))
          .filter((detailId: number) => Number.isFinite(detailId) && detailId > 0)
      )

      const roleSet = new Set<string>()
      const rincianList = Array.isArray(pickedTarif?.rincianTarif) ? pickedTarif.rincianTarif : []

      rincianList.forEach((rincian) => {
        const paketDetailId = Number(rincian?.paketDetailId)
        if (
          entryDetailIds.size > 0 &&
          (!Number.isFinite(paketDetailId) || !entryDetailIds.has(paketDetailId))
        ) {
          return
        }

        const komponenList = Array.isArray(rincian?.komponenTarifList)
          ? rincian.komponenTarifList
          : []

        komponenList.forEach((komponen) => {
          const komponenId = Number(komponen?.jenisKomponenId)
          const isUntukMedis = komponen?.jenisKomponen?.isUntukMedis === true
          const fallbackKode = String(komponen?.kode || komponen?.jenisKomponen?.kode || '').trim()
          const roleKode = roleByKomponenId.get(komponenId) || (isUntukMedis ? fallbackKode : '')
          if (roleKode) roleSet.add(roleKode)
        })
      })

      return Array.from(roleSet)
    },
    [paketById, roleByKomponenId, roleResolutionDate]
  )

  const buildPaketTeamState = useCallback(
    (
      paketId: number,
      kelas: string,
      initialAssignees?: Map<string, number>,
      fallbackDpjpId?: number | null
    ): PaketTeamState => {
      const normalizedClass = normalizeKelas(kelas) || 'umum'
      const roleList = resolveRolesFromPaketByClass(paketId, normalizedClass)
      const teamMembers = roleList.map((roleTenaga, idx) => {
        const fromInitial = initialAssignees?.get(roleTenaga)
        const fromDpjp = idx === 0 && fallbackDpjpId ? Number(fallbackDpjpId) : undefined
        const pegawaiId =
          Number.isFinite(Number(fromInitial)) && Number(fromInitial) > 0
            ? Number(fromInitial)
            : Number.isFinite(Number(fromDpjp)) && Number(fromDpjp) > 0
              ? Number(fromDpjp)
              : undefined

        return { roleTenaga, pegawaiId }
      })

      return {
        kelas: normalizedClass,
        roleList,
        teamMembers
      }
    },
    [resolveRolesFromPaketByClass]
  )

  const statusMeta = STATUS_META[selectedRequest?.status || 'draft'] || {
    label: selectedRequest?.status || 'Menunggu Verifikasi',
    color: 'default'
  }
  const normalizedRequestStatus = String(selectedRequest?.status || 'draft')
    .trim()
    .toLowerCase()
  const canTakeDecision =
    normalizedRequestStatus === 'draft' || normalizedRequestStatus === 'diajukan'

  const selectedPaketRows = useMemo<PaketRow[]>(() => {
    const source = Array.isArray(selectedRequest?.paketTindakanList)
      ? [...(selectedRequest?.paketTindakanList || [])].sort(
          (a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)
        )
      : []

    return source
      .map((item, index) => {
        const paketId = Number(item?.paketId)
        if (!Number.isFinite(paketId) || paketId <= 0) return null
        const masterPaket = paketById.get(paketId)
        return {
          key: `${item.id || paketId || index}`,
          no: index + 1,
          paketId,
          kode: String(item?.paketKodeSnapshot || masterPaket?.kodePaket || '-'),
          nama: String(item?.paketNamaSnapshot || masterPaket?.namaPaket || '-'),
          kategori: String(item?.kategoriPaketSnapshot || masterPaket?.kategoriPaket || '-'),
          kelasTarifSnapshot: item?.kelasTarifSnapshot ? String(item.kelasTarifSnapshot) : null,
          tarifSnapshot: parseNumber(item?.tarifPaketSnapshot)
        }
      })
      .filter((item): item is PaketRow => !!item)
  }, [paketById, selectedRequest?.paketTindakanList])

  const selectedPaketIds = useMemo(
    () => selectedPaketRows.map((row) => row.paketId).filter((id) => Number.isFinite(id) && id > 0),
    [selectedPaketRows]
  )
  const isSelectedRequestCyto = useMemo(
    () => isCytoFromPriority(selectedRequest?.priority),
    [selectedRequest?.priority]
  )

  const getPaketTindakanItems = useCallback((paket: any): PaketMasterDetailItemRef[] => {
    if (Array.isArray(paket?.listTindakan)) return paket.listTindakan as PaketMasterDetailItemRef[]
    if (Array.isArray(paket?.detailItems)) return paket.detailItems as PaketMasterDetailItemRef[]
    return []
  }, [])

  const getPaketBhpItems = useCallback(
    (paket: any): PaketMasterBhpItemRef[] => {
      if (Array.isArray(paket?.listBHP)) return paket.listBHP as PaketMasterBhpItemRef[]

      return getPaketTindakanItems(paket).flatMap((detail) =>
        (Array.isArray(detail?.bhpList) ? detail.bhpList : []).map((bhp) => ({
          ...bhp,
          paketDetailId: bhp?.paketDetailId ?? detail?.id
        }))
      )
    },
    [getPaketTindakanItems]
  )

  const paketOperationDetailById = useMemo(() => {
    const detailMap = new Map<
      number,
      {
        tindakanRows: Array<{
          key: string
          namaPaket: string
          item: string
          qty: number
          satuan: string
          cyto: boolean
          catatanTambahan: string
        }>
        bhpRows: Array<{
          key: string
          namaPaket: string
          item: string
          qty: number
          satuan: string
        }>
      }
    >()

    selectedPaketRows.forEach((row) => {
      const paket = paketById.get(row.paketId)
      const tindakanRows = getPaketTindakanItems(paket).map((detail, index) => {
        const masterTindakanId = Number(detail?.masterTindakanId)
        const itemName =
          detail?.tindakan?.namaTindakan ||
          detail?.masterTindakan?.namaTindakan ||
          (Number.isFinite(masterTindakanId) && masterTindakanId > 0
            ? `Tindakan ID: ${masterTindakanId}`
            : '-')

        return {
          key: `ok-paket-tindakan-${row.paketId}-${detail?.id ?? index}`,
          namaPaket: `[${row.kode}] ${row.nama}`,
          item: String(itemName || '-'),
          qty: Number(detail?.qty || 1),
          satuan: String(detail?.satuan || '-'),
          cyto: false,
          catatanTambahan: '-'
        }
      })

      const bhpRows = getPaketBhpItems(paket).map((bhp, index) => {
        const itemId = Number(bhp?.itemId)
        const itemName =
          bhp?.item?.nama || (Number.isFinite(itemId) && itemId > 0 ? `Item ID: ${itemId}` : '-')

        return {
          key: `ok-paket-bhp-${row.paketId}-${bhp?.id ?? index}`,
          namaPaket: `[${row.kode}] ${row.nama}`,
          item: String(itemName || '-'),
          qty: Number(bhp?.jumlahDefault || bhp?.jumlah || bhp?.qty || 1),
          satuan: String(bhp?.satuan || '-')
        }
      })

      detailMap.set(row.paketId, { tindakanRows, bhpRows })
    })

    return detailMap
  }, [getPaketBhpItems, getPaketTindakanItems, paketById, selectedPaketRows])

  const billingComputation = useMemo<{
    computedData: BillingComputedData | null
    warnings: string[]
  }>(() => {
    const warningSet = new Set<string>()
    const chargeRows: BillingChargeRow[] = []
    const komponenRows: BillingKomponenRow[] = []

    selectedPaketRows.forEach((row) => {
      const paket = paketById.get(row.paketId)
      if (!paket) {
        warningSet.add(`Master paket tidak ditemukan untuk [${row.kode}] ${row.nama}.`)
        return
      }

      const resolvedKelas = normalizeKelas(
        paketTeamMap[row.paketId]?.kelas || row.kelasTarifSnapshot || selectedTarifKelas || 'umum'
      )
      const tarifList = Array.isArray((paket as any)?.tarifList)
        ? ((paket as any).tarifList as PaketTarifHeaderRef[])
        : []
      const pickedTarif = pickTarifForKelasAndDate(tarifList, resolvedKelas, roleResolutionDate)

      const snapshotTarif = parseNumber(row.tarifSnapshot)
      const masterTarif = parseNumber((pickedTarif as any)?.tarifTotal)
      const pickedKelas = normalizeKelas((pickedTarif as any)?.kelas)

      if (!pickedTarif) {
        warningSet.add(
          `Tarif aktif tidak ditemukan untuk [${row.kode}] ${row.nama} pada kelas ${getKelasLabel(resolvedKelas)}.`
        )
      } else if (pickedKelas && pickedKelas !== resolvedKelas) {
        warningSet.add(
          `[${row.kode}] ${row.nama}: kelas ${getKelasLabel(resolvedKelas)} tidak tersedia, fallback ke ${getKelasLabel(pickedKelas)}.`
        )
      }

      if (
        snapshotTarif !== null &&
        masterTarif !== null &&
        Math.abs(snapshotTarif - masterTarif) > 1
      ) {
        warningSet.add(
          `[${row.kode}] ${row.nama}: nominal snapshot (${formatCurrency(snapshotTarif)}) berbeda dari master aktif (${formatCurrency(masterTarif)}).`
        )
      }

      const tarifPaketNominal = snapshotTarif ?? masterTarif ?? 0
      chargeRows.push({
        key: `charge-paket-${row.paketId}`,
        kategori: 'Tarif Paket',
        paket: `[${row.kode}] ${row.nama}`,
        keterangan: row.nama,
        kelas: getKelasLabel(pickedKelas || resolvedKelas),
        jumlah: 1,
        satuan: 'paket',
        harga: tarifPaketNominal,
        subtotal: tarifPaketNominal
      })

      const detailItems = getPaketTindakanItems(paket)
      const detailNameById = new Map<number, string>()
      detailItems.forEach((detail, index) => {
        const detailId = Number(detail?.id)
        const tindakanName =
          detail?.tindakan?.namaTindakan ||
          detail?.masterTindakan?.namaTindakan ||
          `Detail ${index + 1}`
        if (Number.isFinite(detailId) && detailId > 0) {
          detailNameById.set(detailId, String(tindakanName))
        }
      })

      const rincianTarif = Array.isArray((pickedTarif as any)?.rincianTarif)
        ? ((pickedTarif as any).rincianTarif as PaketTarifRincianRef[])
        : []
      if (pickedTarif && rincianTarif.length === 0) {
        warningSet.add(`[${row.kode}] ${row.nama}: rincian komponen tarif belum tersedia.`)
      }

      rincianTarif.forEach((rincian, rincianIndex) => {
        const paketDetailId = Number(rincian?.paketDetailId)
        const tindakanName =
          (Number.isFinite(paketDetailId) && paketDetailId > 0
            ? detailNameById.get(paketDetailId)
            : null) || `Tindakan ${rincianIndex + 1}`
        const komponenTarifList = Array.isArray(rincian?.komponenTarifList)
          ? rincian.komponenTarifList
          : []

        komponenTarifList.forEach((komponen, komponenIndex) => {
          const komponenLabel =
            String(
              komponen?.jenisKomponen?.label ||
                komponen?.jenisKomponen?.kode ||
                komponen?.kode ||
                `Komponen ${komponenIndex + 1}`
            ).trim() || '-'
          const nominal = parseNumber((komponen as any)?.nominal) ?? 0

          komponenRows.push({
            key: `komponen-${row.paketId}-${paketDetailId || rincianIndex}-${komponenIndex}`,
            paket: `[${row.kode}] ${row.nama}`,
            kelas: getKelasLabel(pickedKelas || resolvedKelas),
            tindakan: tindakanName,
            komponen: komponenLabel,
            nominal
          })
        })
      })

      const bhpItems = getPaketBhpItems(paket).filter((item) => item?.includedInPaket !== true)
      bhpItems.forEach((bhp, index) => {
        const qty = Number(bhp?.jumlahDefault || bhp?.jumlah || bhp?.qty || 1)
        const jumlah = Number.isFinite(qty) && qty > 0 ? qty : 1
        const hargaSatuan = parseNumber(bhp?.item?.sellingPrice) ?? 0
        const namaItem = String(
          bhp?.item?.nama || (Number.isFinite(Number(bhp?.itemId)) ? `Item #${bhp?.itemId}` : '-')
        )
        if (hargaSatuan <= 0) {
          warningSet.add(
            `[${row.kode}] ${row.nama}: harga BHP "${namaItem}" belum tersedia (subtotal dihitung 0).`
          )
        }

        chargeRows.push({
          key: `charge-bhp-${row.paketId}-${bhp?.id ?? index}`,
          kategori: 'BHP Tambahan',
          paket: `[${row.kode}] ${row.nama}`,
          keterangan: namaItem,
          kelas: getKelasLabel(pickedKelas || resolvedKelas),
          jumlah,
          satuan: String(bhp?.satuan || 'pcs'),
          harga: hargaSatuan,
          subtotal: jumlah * hargaSatuan
        })
      })
    })

    const tarifPaketTotal = chargeRows
      .filter((row) => row.kategori === 'Tarif Paket')
      .reduce((sum, row) => sum + Number(row.subtotal || 0), 0)
    const bhpTambahanTotal = chargeRows
      .filter((row) => row.kategori === 'BHP Tambahan')
      .reduce((sum, row) => sum + Number(row.subtotal || 0), 0)
    const grandTotal = tarifPaketTotal + bhpTambahanTotal

    if (chargeRows.length === 0) {
      return {
        computedData: null,
        warnings: Array.from(warningSet)
      }
    }

    return {
      computedData: {
        chargeRows,
        komponenRows,
        totals: {
          tarifPaketTotal,
          bhpTambahanTotal,
          grandTotal
        }
      },
      warnings: Array.from(warningSet)
    }
  }, [
    getPaketBhpItems,
    getPaketTindakanItems,
    paketById,
    paketTeamMap,
    roleResolutionDate,
    selectedPaketRows,
    selectedTarifKelas
  ])

  const okRequestSyncMarker = useMemo(() => {
    if (!selectedRequest?.id) return null
    return `[OK_REQUEST:${selectedRequest.id}]`
  }, [selectedRequest?.id])

  const syncedDetailTindakan = useMemo(() => {
    if (!okRequestSyncMarker) return null

    return (Array.isArray(detailTindakanByEncounter) ? detailTindakanByEncounter : []).find(
      (record: any) => {
        const tindakanPaket = Array.isArray(record?.tindakanPaket) ? record.tindakanPaket : []
        return tindakanPaket.some((item: any) =>
          String(item?.catatanTambahan || '').includes(okRequestSyncMarker)
        )
      }
    )
  }, [detailTindakanByEncounter, okRequestSyncMarker])

  useEffect(() => {
    if (!selectedRequest?.id) {
      preOpForm.resetFields()
      signInForm.resetFields()
      timeOutForm.resetFields()
      signOutForm.resetFields()
      postOpCheckForm.resetFields()
      return
    }

    preOpForm.setFieldsValue({
      ...(selectedRequest.preOpChecklist || {})
    })

    signInForm.setFieldsValue({
      ...((selectedRequest.whoChecklist?.signIn as Record<string, unknown>) || {})
    })
    timeOutForm.setFieldsValue({
      ...((selectedRequest.whoChecklist?.timeOut as Record<string, unknown>) || {})
    })

    signOutForm.setFieldsValue({
      ...((selectedRequest.postOpChecklist?.signOut as Record<string, unknown>) || {})
    })
    postOpCheckForm.setFieldsValue({
      postopChecklist:
        (selectedRequest.postOpChecklist?.checklist as Record<string, unknown> | undefined) || {}
    })
  }, [
    postOpCheckForm,
    preOpForm,
    selectedRequest?.id,
    selectedRequest?.postOpChecklist,
    selectedRequest?.preOpChecklist,
    selectedRequest?.whoChecklist,
    signInForm,
    signOutForm,
    timeOutForm
  ])

  useEffect(() => {
    setPaketTeamMap({})
    setIsPaketTeamInitialized(false)
    setRestoreWarning(null)
    setPaketTeamModalWarning(null)
    setIsPaketTeamModalOpen(false)
    setActivePaketForTeam(null)
  }, [selectedRequest?.id])

  useEffect(() => {
    if (!selectedRequest?.id) return
    if (isPaketTeamInitialized) return
    if (selectedPaketRows.length === 0) {
      setIsPaketTeamInitialized(true)
      return
    }

    const persistedTeams = toValidTeamMembers(
      (Array.isArray(syncedDetailTindakan?.tindakanPelaksanaList)
        ? syncedDetailTindakan?.tindakanPelaksanaList
        : []) as TeamMember[]
    )
    const persistedAssigneeMap = buildRoleAssigneeMap(persistedTeams)

    if (persistedTeams.length > 0) {
      const nextMap: Record<number, PaketTeamState> = {}
      selectedPaketRows.forEach((row) => {
        const initialKelas = normalizeKelas(row.kelasTarifSnapshot || selectedTarifKelas || 'umum')
        nextMap[row.paketId] = buildPaketTeamState(
          row.paketId,
          initialKelas,
          persistedAssigneeMap,
          null
        )
      })
      setPaketTeamMap(nextMap)
      setRestoreWarning(
        'Data historis tidak menyimpan tim per paket. Sistem memuat tim yang sama ke semua paket dari data sinkron sebelumnya.'
      )
      setIsPaketTeamInitialized(true)
      return
    }

    const firstPaket = selectedPaketRows[0]
    if (firstPaket) {
      const nextMap: Record<number, PaketTeamState> = {}
      selectedPaketRows.forEach((row, index) => {
        const initialKelas = normalizeKelas(row.kelasTarifSnapshot || selectedTarifKelas || 'umum')
        nextMap[row.paketId] = buildPaketTeamState(
          row.paketId,
          initialKelas,
          undefined,
          index === 0 ? selectedRequest?.dpjpId : null
        )
      })
      setPaketTeamMap(nextMap)
    }

    setIsPaketTeamInitialized(true)
  }, [
    buildPaketTeamState,
    isPaketTeamInitialized,
    selectedTarifKelas,
    selectedPaketRows,
    selectedRequest?.dpjpId,
    selectedRequest?.id,
    syncedDetailTindakan?.id,
    syncedDetailTindakan?.tindakanPelaksanaList
  ])

  const displayData = useMemo(() => {
    const rencanaAt = selectedRequest?.scheduledAt || selectedRequest?.requestedAt

    return {
      transaksiId: selectedRequest?.kode || routeId || '-',
      namaPasien: encounterDetail?.patient?.name || '-',
      noRM: encounterDetail?.patient?.medicalRecordNumber || '-',
      kelas: getKelasLabel(selectedTarifKelas),
      dpjp: selectedRequest?.dpjpId
        ? performerMap.get(selectedRequest.dpjpId) || `ID ${selectedRequest.dpjpId}`
        : '-',
      ruangOK: selectedRequest?.operatingRoomId
        ? operatingRoomMap.get(selectedRequest.operatingRoomId) ||
          `Ruang #${selectedRequest.operatingRoomId}`
        : '-',
      tanggalRencana: formatDate(rencanaAt),
      jamRencana: formatTimeRange(rencanaAt, selectedRequest?.estimatedDurationMinutes),
      dibuatPada: formatDateTime(selectedRequest?.requestedAt),
      dibuatOleh: selectedRequest?.createdBy
        ? performerMap.get(selectedRequest.createdBy) || `User ID ${selectedRequest.createdBy}`
        : selectedRequest?.dpjpId
          ? performerMap.get(selectedRequest.dpjpId) || `DPJP ID ${selectedRequest.dpjpId}`
          : 'Sistem'
    }
  }, [
    encounterDetail,
    operatingRoomMap,
    performerMap,
    routeId,
    selectedRequest,
    selectedTarifKelas
  ])

  const billingLetterMeta = useMemo<BillingLetterMeta>(
    () => ({
      transactionCode: displayData.transaksiId,
      encounterId: selectedRequest?.encounterId || null,
      patientName: displayData.namaPasien,
      medicalRecordNumber: displayData.noRM,
      dpjpName: displayData.dpjp,
      operatingRoomName: displayData.ruangOK,
      plannedDate: displayData.tanggalRencana,
      plannedTime: displayData.jamRencana,
      createdByName: displayData.dibuatOleh,
      verifiedByName: displayData.dpjp
    }),
    [displayData, selectedRequest?.encounterId]
  )

  const dokumenPendukungPath = useMemo(() => {
    return String(selectedRequest?.dokumenPendukung || '').trim()
  }, [selectedRequest?.dokumenPendukung])

  const dokumenPendukungUrl = useMemo(() => {
    if (!dokumenPendukungPath) return ''
    const base = (import.meta.env.VITE_FILE_SERVER_URL ?? '').replace(/\/$/, '')
    return `${base}/public/${dokumenPendukungPath}`
  }, [dokumenPendukungPath])

  const tindakanPaketPayload = useMemo(() => {
    const rows = Array.isArray(selectedRequest?.paketTindakanList)
      ? selectedRequest.paketTindakanList
      : []
    const mapped: Array<{
      masterTindakanId: number
      paketId: number
      paketDetailId: number
      kelas: string
      jumlah: number
      satuan: string | null
      cyto: boolean
      catatanTambahan: string
    }> = []
    const missingPaketIds: number[] = []
    const missingDetailPaketIds: number[] = []

    rows.forEach((item) => {
      const paketId = Number(item?.paketId)
      if (!Number.isFinite(paketId) || paketId <= 0) return

      const paket = paketById.get(paketId)
      if (!paket) {
        missingPaketIds.push(paketId)
        return
      }

      const detailItems = Array.isArray(paket?.listTindakan)
        ? paket.listTindakan
        : Array.isArray(paket?.detailItems)
          ? paket.detailItems
          : []

      if (detailItems.length === 0) {
        missingDetailPaketIds.push(paketId)
        return
      }

      detailItems.forEach((detail: any) => {
        const paketDetailId = Number(detail?.id)
        const masterTindakanId = Number(detail?.masterTindakanId)
        if (!Number.isFinite(paketDetailId) || paketDetailId <= 0) return
        if (!Number.isFinite(masterTindakanId) || masterTindakanId <= 0) return

        const jumlahRaw = Number(detail?.qty)
        const jumlah = Number.isFinite(jumlahRaw) && jumlahRaw > 0 ? jumlahRaw : 1
        const kelasPaket = normalizeKelas(
          paketTeamMap[paketId]?.kelas || item?.kelasTarifSnapshot || selectedTarifKelas || 'umum'
        )

        mapped.push({
          masterTindakanId,
          paketId,
          paketDetailId,
          kelas: kelasPaket,
          jumlah,
          satuan: detail?.satuan ? String(detail.satuan) : null,
          cyto: isSelectedRequestCyto,
          catatanTambahan: `${okRequestSyncMarker || '[OK_REQUEST]'} sinkron verifikasi OK`
        })
      })
    })

    const unique = new Map<string, (typeof mapped)[number]>()
    mapped.forEach((row) => {
      unique.set(`${row.paketId}-${row.paketDetailId}`, row)
    })

    return {
      rows: Array.from(unique.values()),
      missingPaketIds: Array.from(new Set(missingPaketIds)),
      missingDetailPaketIds: Array.from(new Set(missingDetailPaketIds))
    }
  }, [
    okRequestSyncMarker,
    paketById,
    paketTeamMap,
    isSelectedRequestCyto,
    selectedRequest?.paketTindakanList,
    selectedTarifKelas
  ])

  const paketTeamStatusMap = useMemo(() => {
    const map: Record<
      number,
      {
        kelas: string
        roleCount: number
        assignedCount: number
        complete: boolean
        hasRole: boolean
      }
    > = {}

    selectedPaketRows.forEach((row) => {
      const state = paketTeamMap[row.paketId]
      const kelas = normalizeKelas(
        state?.kelas || row.kelasTarifSnapshot || selectedTarifKelas || 'umum'
      )
      const roleList = Array.isArray(state?.roleList) ? state.roleList : []
      const teamMembers = normalizeTeamAssignments(state?.teamMembers || [])
      const assignedMap = buildRoleAssigneeMap(teamMembers)
      const assignedCount = roleList.filter((role) => assignedMap.has(role)).length
      const hasRole = roleList.length > 0
      const complete = hasRole && assignedCount === roleList.length

      map[row.paketId] = {
        kelas,
        roleCount: roleList.length,
        assignedCount,
        complete,
        hasRole
      }
    })

    return map
  }, [paketTeamMap, selectedPaketRows, selectedTarifKelas])

  const invalidTeamRows = useMemo(() => {
    return selectedPaketRows.filter((row) => !paketTeamStatusMap[row.paketId]?.complete)
  }, [paketTeamStatusMap, selectedPaketRows])

  const isLoadingPage = isLoadingOkRequest || isFetchingOkRequest || isLoadingEncounter
  const errorMessage =
    okRequestError instanceof Error
      ? okRequestError.message
      : okRequestError
        ? 'Gagal memuat data detail verifikasi OK'
        : ''

  const handleSavePreOp = async () => {
    if (!selectedRequest?.id) {
      message.error('Data pengajuan OK belum tersedia')
      return
    }

    try {
      const values = await preOpForm.validateFields()
      await saveOkRequestChecklists.mutateAsync({
        id: Number(selectedRequest.id),
        preOpChecklist: values
      })
      message.success('Checklist Pre-Op berhasil disimpan')
      void refetchOkRequest()
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      message.error(text || 'Mohon lengkapi seluruh field wajib di Checklist Pre-Op')
    }
  }

  const handleSaveIntraOp = async () => {
    if (!selectedRequest?.id) {
      message.error('Data pengajuan OK belum tersedia')
      return
    }

    try {
      const signInValues = await signInForm.validateFields()
      const timeOutValues = timeOutForm.getFieldsValue()
      await saveOkRequestChecklists.mutateAsync({
        id: Number(selectedRequest.id),
        whoChecklist: {
          signIn: signInValues,
          timeOut: timeOutValues
        }
      })
      message.success('WHO Checklist berhasil disimpan')
      void refetchOkRequest()
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      message.error(text || 'Mohon lengkapi seluruh item wajib pada Sign-In')
    }
  }

  const handleSavePostOp = async () => {
    if (!selectedRequest?.id) {
      message.error('Data pengajuan OK belum tersedia')
      return
    }

    try {
      const signOutValues = await signOutForm.validateFields()
      const postOpValues = await postOpCheckForm.validateFields()
      await saveOkRequestChecklists.mutateAsync({
        id: Number(selectedRequest.id),
        postOpChecklist: {
          signOut: signOutValues,
          checklist: (postOpValues as { postopChecklist?: Record<string, unknown> })?.postopChecklist
        }
      })
      message.success('Data Post-Operasi berhasil disimpan')
      void refetchOkRequest()
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      message.error(text || 'Mohon lengkapi seluruh field wajib di form Post-Op')
    }
  }

  const syncModalTeamMembersByClass = (
    paketId: number,
    kelasRaw: string,
    sourceAssignments?: TeamMemberAssignment[] | TeamMemberFormItem[]
  ) => {
    const kelas = normalizeKelas(kelasRaw) || 'umum'
    const roleList = resolveRolesFromPaketByClass(paketId, kelas)
    const assigneeMap = buildRoleAssigneeMap(
      normalizeTeamAssignments(
        sourceAssignments || (paketTeamForm.getFieldValue('teamMembers') ?? [])
      )
    )
    const teamMembers: TeamMemberAssignment[] = roleList.map((roleTenaga) => ({
      roleTenaga,
      pegawaiId: assigneeMap.get(roleTenaga)
    }))

    paketTeamForm.setFieldsValue({
      kelas,
      teamMembers
    })

    if (roleList.length === 0) {
      setPaketTeamModalWarning(
        'Role tenaga medis belum tersedia untuk paket dan kelas ini. Pastikan komponen jasa medis pada tarif paket sudah dikonfigurasi.'
      )
    } else {
      setPaketTeamModalWarning(null)
    }

    return { kelas, roleList, teamMembers }
  }

  const openPaketTeamModal = (row: PaketRow) => {
    const existingState = paketTeamMap[row.paketId]
    const kelas = normalizeKelas(
      existingState?.kelas || row.kelasTarifSnapshot || selectedTarifKelas || 'umum'
    )
    const sourceAssignments = normalizeTeamAssignments(existingState?.teamMembers || [])

    setActivePaketForTeam(row)
    setPaketTeamModalWarning(null)
    paketTeamForm.setFieldsValue({ kelas, teamMembers: sourceAssignments })
    syncModalTeamMembersByClass(row.paketId, kelas, sourceAssignments)
    setIsPaketTeamModalOpen(true)
  }

  const handleSavePaketTeamModal = async () => {
    if (!activePaketForTeam) return

    try {
      const values = await paketTeamForm.validateFields()
      const kelas = normalizeKelas(values?.kelas || selectedTarifKelas || 'umum')
      const roleList = resolveRolesFromPaketByClass(activePaketForTeam.paketId, kelas)
      if (roleList.length === 0) {
        message.error('Role tenaga medis belum tersedia untuk paket dan kelas yang dipilih')
        return
      }
      const teamMembers = normalizeTeamAssignments(values?.teamMembers || [])
      const assigneeMap = buildRoleAssigneeMap(teamMembers)
      const missingRoles = roleList.filter((role) => !assigneeMap.has(role))
      if (missingRoles.length > 0) {
        message.error('Semua role tenaga medis wajib diisi petugas')
        return
      }

      const normalizedMembers = roleList.map((roleTenaga) => ({
        roleTenaga,
        pegawaiId: assigneeMap.get(roleTenaga)
      }))

      setPaketTeamMap((prev) => ({
        ...prev,
        [activePaketForTeam.paketId]: {
          kelas,
          roleList,
          teamMembers: normalizedMembers
        }
      }))

      message.success(`Tim pelaksana paket ${activePaketForTeam.kode} tersimpan`)
      setIsPaketTeamModalOpen(false)
      setActivePaketForTeam(null)
      setPaketTeamModalWarning(null)
    } catch {
      message.error('Mohon lengkapi data tim pelaksana paket')
    }
  }

  const buildFlattenedPetugasList = (): TeamMember[] => {
    const flattened: TeamMember[] = []
    selectedPaketIds.forEach((paketId) => {
      const list = toValidTeamMembers(
        normalizeTeamAssignments(paketTeamMap[paketId]?.teamMembers || [])
      )
      flattened.push(...list)
    })
    return toValidTeamMembers(flattened)
  }

  const savePaketTeamsToDetailTindakan = async (): Promise<boolean> => {
    if (!selectedRequest?.encounterId || !selectedRequest?.id) {
      message.error('Encounter pengajuan OK tidak ditemukan')
      return false
    }

    const patientId =
      String(encounterDetail?.patient?.id || encounterDetail?.patientId || '').trim() || undefined

    if (!patientId) {
      message.error(
        'Patient ID dari encounter tidak ditemukan, tidak dapat membuat detail tindakan'
      )
      return false
    }

    if (tindakanPaketPayload.rows.length === 0) {
      if (tindakanPaketPayload.missingPaketIds.length > 0) {
        message.error(
          `Paket tidak ditemukan di master: ${tindakanPaketPayload.missingPaketIds.join(', ')}`
        )
        return false
      }

      if (tindakanPaketPayload.missingDetailPaketIds.length > 0) {
        message.error(
          `Detail tindakan paket belum tersedia: ${tindakanPaketPayload.missingDetailPaketIds.join(', ')}`
        )
        return false
      }

      message.error('Tidak ada item tindakan paket yang bisa disinkronkan ke detail tindakan')
      return false
    }

    if (invalidTeamRows.length > 0) {
      const detail = invalidTeamRows
        .map((row) => {
          const status = paketTeamStatusMap[row.paketId]
          if (!status?.hasRole) return `[${row.kode}] ${row.nama} (role medis belum tersedia)`
          return `[${row.kode}] ${row.nama} (pelaksana ${status.assignedCount}/${status.roleCount})`
        })
        .join(', ')
      message.error(`Tim pelaksana belum lengkap: ${detail}`)
      return false
    }

    const petugasList = buildFlattenedPetugasList()
    if (petugasList.length === 0) {
      message.error('Tim pelaksana belum valid untuk disimpan')
      return false
    }

    try {
      const payload = {
        encounterId: selectedRequest.encounterId,
        patientId,
        tanggalTindakan:
          selectedRequest.scheduledAt || selectedRequest.requestedAt || dayjs().toISOString(),
        cyto: isSelectedRequestCyto,
        catatanTambahan: `${okRequestSyncMarker || '[OK_REQUEST]'} sinkron dari verifikasi OK`,
        petugasList,
        tindakanPaketList: tindakanPaketPayload.rows,
        tindakanSatuanList: [],
        bhpSatuanList: [],
        bhpPaketList: []
      }

      if (syncedDetailTindakan?.id) {
        await updateDetailTindakan.mutateAsync({
          id: Number(syncedDetailTindakan.id),
          ...payload
        })
      } else {
        await createDetailTindakan.mutateAsync(payload)
      }

      message.success('Tim pelaksana paket berhasil disimpan ke detail tindakan pasien')
      return true
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      message.error(`Gagal sinkron ke detail tindakan: ${text}`)
      return false
    }
  }

  const handleApproveVerification = async () => {
    if (!selectedRequest?.id) return

    if (invalidTeamRows.length > 0) {
      const firstInvalidRow = invalidTeamRows[0]
      const invalidItems = invalidTeamRows.map((row) => {
        const status = paketTeamStatusMap[row.paketId]
        const detail = !status?.hasRole
          ? 'Role medis belum tersedia'
          : `Pelaksana ${status.assignedCount}/${status.roleCount}`
        return {
          key: row.key,
          text: `[${row.kode}] ${row.nama}`,
          detail
        }
      })

      modal.confirm({
        title: 'Tim pelaksana paket belum lengkap',
        okText: 'Isi Tim Sekarang',
        cancelText: 'Nanti',
        content: (
          <div className="space-y-2">
            <Text className="text-sm text-gray-600">
              Lengkapi tim pelaksana pada paket berikut sebelum verifikasi disetujui:
            </Text>
            <ul className="list-disc pl-5 mb-0">
              {invalidItems.map((item) => (
                <li key={item.key}>
                  <Text strong>{item.text}</Text> - <Text type="secondary">{item.detail}</Text>
                </li>
              ))}
            </ul>
          </div>
        ),
        onOk: () => {
          if (firstInvalidRow) {
            openPaketTeamModal(firstInvalidRow)
          }
        }
      })
      return
    }

    const syncSuccess = await savePaketTeamsToDetailTindakan()
    if (!syncSuccess) return

    try {
      await verifyOkRequest.mutateAsync({
        id: Number(selectedRequest.id),
        status: OkRequestStatus.VERIFIED,
        scheduledAt: selectedRequest.scheduledAt || null,
        estimatedDurationMinutes: selectedRequest.estimatedDurationMinutes ?? null,
        operatingRoomId: selectedRequest.operatingRoomId ?? null,
        notes: selectedRequest.notes || 'Disetujui melalui verifikasi OK'
      })

      message.success('Pengajuan OK berhasil disetujui')
      void refetchOkRequest()
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      message.error(`Gagal menyetujui pengajuan OK: ${text}`)
    }
  }

  const handleRejectVerification = () => {
    if (!selectedRequest?.id) return

    let rejectionReason = ''
    modal.confirm({
      title: 'Tolak Pengajuan OK',
      content: (
        <Input.TextArea
          rows={4}
          placeholder="Alasan penolakan"
          onChange={(event) => {
            rejectionReason = event.target.value
          }}
        />
      ),
      okText: 'Tolak Pengajuan',
      okButtonProps: { danger: true },
      cancelText: 'Batal',
      onOk: async () => {
        const reason = rejectionReason.trim()
        if (!reason) {
          message.error('Alasan penolakan wajib diisi')
          throw new Error('Alasan penolakan wajib diisi')
        }

        await verifyOkRequest.mutateAsync({
          id: Number(selectedRequest.id),
          status: OkRequestStatus.REJECTED,
          rejectionReason: reason,
          notes: reason
        })

        message.success('Pengajuan OK berhasil ditolak')
        void refetchOkRequest()
      }
    })
  }

  const tabItems = [
    {
      key: 'verifikasi',
      label: '1. Verifikasi & Tim Operasi',
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 gap-4 flex flex-col">
            <Card
              title="Informasi Pasien & Operasi"
              className="shadow-none border-gray-100"
              size="small"
            >
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Nama Pasien" span={2}>
                  {displayData.namaPasien}
                </Descriptions.Item>
                <Descriptions.Item label="No. Rekam Medis">{displayData.noRM}</Descriptions.Item>
                <Descriptions.Item label="Kelas Tarif">{displayData.kelas}</Descriptions.Item>
                <Descriptions.Item label="DPJP">{displayData.dpjp}</Descriptions.Item>
                <Descriptions.Item label="Ruang OK">{displayData.ruangOK}</Descriptions.Item>
                <Descriptions.Item label="Tanggal Rencana">
                  {displayData.tanggalRencana}
                </Descriptions.Item>
                <Descriptions.Item label="Estimasi Waktu">
                  {displayData.jamRencana}
                </Descriptions.Item>
                <Descriptions.Item label="Surat Praoperasi" span={2}>
                  {dokumenPendukungUrl ? (
                    <Space size="small" wrap>
                      <Button
                        type="link"
                        className="p-0"
                        onClick={() => {
                          window.open(dokumenPendukungUrl, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        Lihat Dokumen
                      </Button>
                      <a href={dokumenPendukungUrl} target="_blank" rel="noopener noreferrer" download>
                        Unduh
                      </a>
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              title="Paket Tindakan Pengajuan"
              className="shadow-none border-gray-100"
              size="small"
            >
              {restoreWarning && (
                <Alert className="!mb-3" type="info" showIcon message={restoreWarning} />
              )}

              {invalidTeamRows.length > 0 && (
                <Alert
                  className="!mb-3"
                  type="warning"
                  showIcon
                  message={`Tim pelaksana belum lengkap pada ${invalidTeamRows.length} paket.`}
                />
              )}

              <Table<PaketRow>
                size="small"
                dataSource={selectedPaketRows}
                rowKey="key"
                pagination={false}
                expandable={{
                  rowExpandable: (row) => {
                    const detail = paketOperationDetailById.get(row.paketId)
                    return Boolean(
                      detail &&
                        ((detail.tindakanRows?.length || 0) > 0 ||
                          (detail.bhpRows?.length || 0) > 0)
                    )
                  },
                  expandedRowRender: (row) => {
                    const detail = paketOperationDetailById.get(row.paketId)
                    return (
                      <PaketOperationBreakdown
                        paketRows={detail?.tindakanRows || []}
                        paketBhpRows={detail?.bhpRows || []}
                      />
                    )
                  }
                }}
                locale={{
                  emptyText: <Empty description="Belum ada paket tindakan pada pengajuan" />
                }}
                columns={[
                  // { title: 'No', dataIndex: 'no', key: 'no', width: 64 },
                  {
                    title: 'Paket',
                    key: 'paket',
                    render: (_, row) => (
                      <div>
                        <div className="font-semibold">
                          [{row.kode}] {row.nama}
                        </div>
                      </div>
                    )
                  },
                  {
                    title: 'Kelas',
                    key: 'kelas',
                    width: 150,
                    render: (_, row) => {
                      const status = paketTeamStatusMap[row.paketId]
                      return getKelasLabel(
                        status?.kelas ||
                          normalizeKelas(row.kelasTarifSnapshot) ||
                          selectedTarifKelas
                      )
                    }
                  },
                  {
                    title: 'Tim Pelaksana',
                    key: 'teamStatus',
                    width: 240,
                    render: (_, row) => {
                      const status = paketTeamStatusMap[row.paketId]
                      if (!status?.hasRole) {
                        return (
                          <Space direction="vertical" size={2}>
                            <Tag color="red">Role belum tersedia</Tag>
                            <Text type="secondary" className="text-xs">
                              Cek konfigurasi tarif komponen medis
                            </Text>
                          </Space>
                        )
                      }
                      if (!status?.complete) {
                        return (
                          <Space direction="vertical" size={2}>
                            <Tag color="orange">Belum lengkap</Tag>
                            <Text type="secondary" className="text-xs">
                              {status?.assignedCount || 0}/{status?.roleCount || 0} pelaksana
                            </Text>
                          </Space>
                        )
                      }
                      return (
                        <Space direction="vertical" size={2}>
                          <Tag color="green">Lengkap</Tag>
                          <Text type="secondary" className="text-xs">
                            {status?.assignedCount || 0}/{status?.roleCount || 0} pelaksana
                          </Text>
                        </Space>
                      )
                    }
                  },
                  {
                    title: 'Tarif Snapshot',
                    key: 'tarifSnapshot',
                    align: 'right',
                    width: 170,
                    render: (_, row) =>
                      typeof row.tarifSnapshot === 'number'
                        ? `Rp ${row.tarifSnapshot.toLocaleString('id-ID')}`
                        : '-'
                  },
                  {
                    title: 'Aksi',
                    key: 'aksi',
                    width: 120,
                    render: (_, row) => (
                      <Space wrap>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            openPaketTeamModal(row)
                          }}
                        >
                          Isi Tim
                        </Button>
                      </Space>
                    )
                  }
                ]}
              />

              {tindakanPaketPayload.missingPaketIds.length > 0 && (
                <Alert
                  className="mt-3"
                  type="warning"
                  showIcon
                  message={`Master paket belum ditemukan untuk ID: ${tindakanPaketPayload.missingPaketIds.join(', ')}`}
                />
              )}

              {tindakanPaketPayload.missingDetailPaketIds.length > 0 && (
                <Alert
                  className="mt-3"
                  type="warning"
                  showIcon
                  message={`Detail tindakan paket belum tersedia untuk paket ID: ${tindakanPaketPayload.missingDetailPaketIds.join(', ')}`}
                />
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Verifikasi Keputusan" className="shadow-none border-gray-100" size="small">
              <div className="space-y-4">
                {canTakeDecision ? (
                  <Space direction="vertical" className="w-full">
                    <Button
                      type="primary"
                      block
                      size="large"
                      icon={<CheckCircleOutlined />}
                      style={{ background: '#10b981', borderColor: '#10b981' }}
                      loading={
                        verifyOkRequest.isPending ||
                        createDetailTindakan.isPending ||
                        updateDetailTindakan.isPending
                      }
                      onClick={() => {
                        void handleApproveVerification()
                      }}
                    >
                      Setujui & Sinkronkan
                    </Button>
                    <Button
                      danger
                      block
                      size="large"
                      icon={<CloseCircleOutlined />}
                      loading={verifyOkRequest.isPending}
                      onClick={handleRejectVerification}
                    >
                      Tolak Pengajuan
                    </Button>
                  </Space>
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    className="!mb-3"
                    message={`Pengajuan sudah berstatus "${statusMeta.label}" dan tidak bisa diputuskan ulang dari halaman ini.`}
                  />
                )}
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-500">
                  <FileTextOutlined className="mr-1" />
                  Dibuat oleh {displayData.dibuatOleh} pada {displayData.dibuatPada}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'pre-op',
      label: '2. Checklist Pre-Op',
      children: (
        <div className="space-y-6">
          <Form form={preOpForm} layout="vertical">
            <ChecklistPreOpForm
              standalone={false}
              externalForm={preOpForm}
              performerOptions={preOpPerformerOptions}
              isLoadingPerformers={isLoadingPreOpPerformers}
            />
            <div className="flex justify-end mt-6">
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSavePreOp}
                style={{ background: '#3b82f6', border: 'none' }}
              >
                Simpan Seluruh Data Pre-Op
              </Button>
            </div>
          </Form>
        </div>
      )
    },
    {
      key: 'intra-op',
      label: '3. WHO (SignIn + TimeOut)',
      children: (
        <div className="space-y-4">
          <div className="space-y-4">
            <Form form={signInForm} layout="vertical">
              <SignInForm
                standalone={false}
                externalForm={signInForm}
                performerOptions={signInNurseOptions}
                isLoadingPerformers={isLoadingSignInNursePerformers}
              />
            </Form>
            <Form form={timeOutForm} layout="vertical">
              <TimeOutForm standalone={false} externalForm={timeOutForm} />
            </Form>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSaveIntraOp}
              style={{ background: '#3b82f6', border: 'none' }}
            >
              Simpan WHO Checklist (SignIn)
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'post-op-checklist',
      label: '4. SignOut & Post-Op',
      children: (
        <div className="space-y-4">
          <Form form={signOutForm} layout="vertical">
            <SignOutForm standalone={false} externalForm={signOutForm} />
          </Form>
          <Form form={postOpCheckForm} layout="vertical">
            <ChecklistPostOpForm standalone={false} externalForm={postOpCheckForm} />
          </Form>
          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSavePostOp}
              style={{ background: '#3b82f6', border: 'none' }}
            >
              Simpan Sign-Out & Checklist Post-Op
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'billing',
      label: '5. Billing & Tagihan',
      children: (
        <div className="space-y-6">
          <TagihanOKView
            computedData={billingComputation.computedData}
            warnings={billingComputation.warnings}
            letterMeta={billingLetterMeta}
            isLoading={isLoadingPage}
            emptyState="Belum ada data paket pengajuan untuk dihitung sebagai tagihan."
          />
        </div>
      )
    }
  ]

  return (
    <div>
      {isLoadingPage ? (
        <Card className="shadow-none border-gray-100">
          <div className="py-10 flex justify-center">
            <Spin tip="Memuat detail verifikasi OK..." />
          </div>
        </Card>
      ) : errorMessage ? (
        <Card className="shadow-none border-gray-100">
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            action={
              <Button
                size="small"
                onClick={() => {
                  void refetchOkRequest()
                }}
              >
                Muat Ulang
              </Button>
            }
          />
        </Card>
      ) : !selectedRequest ? (
        <Card className="shadow-none border-gray-100">
          <Alert
            type="warning"
            showIcon
            message={`Data pengajuan OK dengan ID ${routeId || '-'} tidak ditemukan.`}
          />
        </Card>
      ) : (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <FileTextOutlined className="text-blue-500" />
                <span className="text-gray-700 font-bold uppercase tracking-wider text-xs">
                  Detail Transaksi Operasi: {displayData.transaksiId}
                </span>
              </div>
              <Tag color={statusMeta.color} icon={<HistoryOutlined />} className="mr-0">
                Status: {statusMeta.label}
              </Tag>
            </div>
          }
          className="shadow-none border-gray-100 overflow-hidden"
          bodyStyle={{ padding: '0 24px 24px 24px' }}
        >
          <Tabs
            defaultActiveKey="verifikasi"
            items={tabItems}
            size="small"
            className="ok-tabs-custom"
            tabBarStyle={{ marginBottom: 20 }}
          />
        </Card>
      )}

      <Modal
        title={
          activePaketForTeam
            ? `Isi Tim Pelaksana - [${activePaketForTeam.kode}] ${activePaketForTeam.nama}`
            : 'Isi Tim Pelaksana Paket'
        }
        open={isPaketTeamModalOpen}
        onCancel={() => {
          setIsPaketTeamModalOpen(false)
          setActivePaketForTeam(null)
          setPaketTeamModalWarning(null)
          paketTeamForm.resetFields()
        }}
        onOk={() => {
          void handleSavePaketTeamModal()
        }}
        okText="Simpan Tim"
        cancelText="Batal"
        width={860}
        destroyOnClose
      >
        <Form form={paketTeamForm} layout="vertical" className="flex! flex-col! gap-4!">
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Form.Item
              name="kelas"
              label={<span className="font-bold">Kelas</span>}
              rules={[{ required: true, message: 'Kelas wajib dipilih' }]}
              className="mb-0!"
            >
              <Select
                placeholder="Pilih kelas..."
                options={kelasOptions}
                onChange={(nextKelas) => {
                  if (!activePaketForTeam) return
                  syncModalTeamMembersByClass(activePaketForTeam.paketId, String(nextKelas || ''))
                }}
              />
            </Form.Item>
          </div>

          {paketTeamModalWarning && (
            <Alert className="mb-3" type="warning" showIcon message={paketTeamModalWarning} />
          )}

          <AutoRolePetugasListCard
            form={paketTeamForm}
            listName="teamMembers"
            token={token}
            performers={performers || []}
            isLoadingPerformers={isLoadingPerformers}
            roleLabelByCode={roleLabelByCode}
            listRules={[
              {
                validator: async (_: unknown, value: TeamMemberFormItem[]) => {
                  const list = normalizeTeamAssignments(value || [])
                  if (list.length === 0) {
                    throw new Error('Role tenaga medis belum tersedia untuk paket dan kelas ini')
                  }
                  const invalid = list.some(
                    (item) =>
                      !Number.isFinite(Number(item.pegawaiId)) || Number(item.pegawaiId) <= 0
                  )
                  if (invalid) {
                    throw new Error('Semua role tenaga medis wajib diisi petugas')
                  }
                }
              }
            ]}
          />
        </Form>
      </Modal>

      <style>{`
        .ok-tabs-custom .ant-tabs-tab {
          padding: 12px 0 !important;
          margin-right: 24px !important;
        }
        .ok-tabs-custom .ant-tabs-tab-btn {
          font-weight: 500;
          color: #6b7280;
          font-size: 13px;
        }
        .ok-tabs-custom .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #3b82f6 !important;
        }
        .ok-tabs-custom .ant-tabs-ink-bar {
          height: 3px !important;
          background: #3b82f6 !important;
        }
      `}</style>
    </div>
  )
}

export default DetailVerifikasiPage
