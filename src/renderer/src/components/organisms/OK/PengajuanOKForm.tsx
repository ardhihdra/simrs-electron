import React, { useState, useRef, useMemo, useEffect } from 'react'
import {
  App,
  Form,
  Input,
  Row,
  Col,
  Select,
  Button,
  DatePicker,
  Radio,
  Tag,
  Divider,
  Card,
  Checkbox,
  Typography,
  Upload,
  Alert,
  Modal,
  Tabs,
  Spin,
  Empty
} from 'antd'
import { DeleteOutlined, InboxOutlined, SaveOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import bodyMapImage from '@renderer/assets/images/body_map.png'
import { InformedConsentForm } from '../InformedConsentForm'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useOperatingRoomList } from '@renderer/hooks/query/use-operating-room'
import {
  findOkRequestScheduleConflicts,
  useCreateOkRequest,
  useOkRequestList,
  useUploadOkSupportingDocument
} from '@renderer/hooks/query/use-ok-request'
import { useCreateQuestionnaireResponse } from '@renderer/hooks/query/use-questionnaire-response'
import { SelectKelasTarif } from '@renderer/components/molecules/SelectKelasTarif'
import {
  DEFAULT_KELAS_TARIF_OPTIONS,
  KELAS_ORDER,
  getKelasTarifLabel,
  normalizeKelasTarifValue
} from '@renderer/utils/tarif-kelas'
import { useTarifKelasOptions } from '@renderer/hooks/query/use-tarif-kelas-options'
import {
  useMasterPaketTindakanList,
  type MasterPaketTindakanItem
} from '@renderer/hooks/query/use-master-paket-tindakan'
import {
  QuestionnaireResponseStatus,
  type QuestionnaireResponseItem
} from '@renderer/types/questionnaire.types'
import type { Dayjs } from 'dayjs'
import { OkRequestPriority, OkRequestSourceUnit, OkRequestStatus } from 'simrs-types'

const { Title, Text } = Typography
const { Dragger } = Upload

interface ServiceConfig {
  label: string
  color: string
  accentColor: string
  defaultStatus: 'draft' | 'diajukan'
  tab4Label: string
  showEmergencyAlert?: boolean
}

const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  rajal: {
    label: 'Rajal',
    color: 'cyan',
    accentColor: 'text-cyan-600',
    defaultStatus: 'draft',
    tab4Label: 'Surat Praoperasi'
  },
  ranap: {
    label: 'Ranap',
    color: 'emerald',
    accentColor: 'text-emerald-600',
    defaultStatus: 'draft',
    tab4Label: 'Surat Praoperasi'
  },
  igd: {
    label: 'IGD / CYTO',
    color: 'red',
    accentColor: 'text-red-600',
    defaultStatus: 'diajukan',
    tab4Label: 'Berkas Cyto',
    showEmergencyAlert: true
  }
}

interface PengajuanOKProps {
  type: 'rajal' | 'ranap' | 'igd'
  encounterId: string
  patientData: OkPatientData
  onSuccess?: () => void
}

interface ActivePaketTarif {
  kelas: string
  tarif: number
}

interface BodyMapMarker {
  [key: string]: unknown
  id: number
  x: number
  y: number
  note: string
}

type TarifListRow = NonNullable<MasterPaketTindakanItem['tarifList']>[number] & {
  tarifPaket?: number | string | null
  nominal?: number | string | null
}

type CreateOkRequestPayload = Parameters<NonNullable<Window['api']['query']['okRequest']['create']>>[0]
type CreateOkRequestResult = Awaited<
  ReturnType<NonNullable<Window['api']['query']['okRequest']['create']>>
>
type UploadOkSupportingDocumentResult = Awaited<
  ReturnType<NonNullable<Window['api']['query']['okRequest']['uploadSupportingDocument']>>
>

interface OkPatientData {
  subjectId?: string | null
  patient?: {
    id?: string | null
  } | null
  queueTicket?: {
    paymentMethod?: string | null
  } | null
  encounter?: {
    queueTicket?: {
      paymentMethod?: string | null
    } | null
  } | null
}

interface PengajuanOKFormValues {
  mainDiagnosis: string
  sifatOperasi: 'cyto' | 'efektif' | string
  jenisOperasi: string
  status: 'draft' | 'diajukan'
  perujuk: number | string
  ruangOK: number | string
  rencanaMulai: Dayjs
  rencanaSelesai: Dayjs
  catatanBodyMap?: string
  selectedTarifKelas?: string
  selectedPaketIds?: Array<number | string>
  dokumenPendukung?: string | null
  receiver_name?: string
  receiver_birthdate?: Dayjs
  receiver_address?: string
  consent_type?: string
  assessment_date?: Dayjs
  performerId?: number | string | null
  witness1_name?: string
  witness2_name?: string
  info_diagnosis?: string
  check_diagnosis?: boolean
  info_basis?: string
  check_basis?: boolean
  info_procedure?: string
  check_procedure?: boolean
  info_indication?: string
  check_indication?: boolean
  info_method?: string
  check_method?: boolean
  info_objective?: string
  check_objective?: boolean
  info_risk?: string
  check_risk?: boolean
  info_complication?: string
  check_complication?: boolean
  info_prognosis?: string
  check_prognosis?: boolean
  info_alternative?: string
  check_alternative?: boolean
}

interface FormFinishErrorInfo {
  errorFields?: Array<{
    name?: unknown
    errors?: string[]
  }>
}

const FIELD_TAB_MAP: Record<string, string> = {
  mainDiagnosis: '1',
  sifatOperasi: '1',
  jenisOperasi: '1',
  status: '1',
  perujuk: '1',
  tanggalRujukan: '1',
  ruangOK: '1',
  rencanaMulai: '1',
  rencanaSelesai: '1',
  catatanBodyMap: '1',
  selectedTarifKelas: '2',
  selectedPaketIds: '2',
  receiver_name: '3',
  receiver_birthdate: '3',
  receiver_address: '3',
  consent_type: '3',
  assessment_date: '3',
  performerId: '3',
  witness1_name: '3',
  witness2_name: '3'
}

const normalizeKelas = normalizeKelasTarifValue

const mapPaymentMethodToTarifKelas = (paymentMethod: unknown): string => {
  const normalized = String(paymentMethod || '')
    .trim()
    .toLowerCase()

  switch (normalized) {
    case 'cash':
    case 'bpjs':
    case 'asuransi':
    case 'company':
    case 'general':
    case 'umum':
      return 'UMUM'
    default:
      return normalizeKelasTarifValue(paymentMethod) || 'UMUM'
  }
}

const mapSifatOperasiToPriority = (sifatOperasi: unknown): OkRequestPriority => {
  const normalized = String(sifatOperasi || '')
    .trim()
    .toLowerCase()

  if (normalized === 'cyto' || normalized === 'cito' || normalized === 'emergency') {
    return OkRequestPriority.EMERGENCY
  }

  return OkRequestPriority.ELECTIVE
}

const mapSourceUnit = (type: PengajuanOKProps['type']): OkRequestSourceUnit => {
  switch (type) {
    case 'rajal':
      return OkRequestSourceUnit.RAJAL
    case 'ranap':
      return OkRequestSourceUnit.RANAP
    case 'igd':
      return OkRequestSourceUnit.IGD
    default:
      return OkRequestSourceUnit.RAJAL
  }
}

const resolveTabByFieldName = (namePath: unknown): string => {
  const fieldName = Array.isArray(namePath) ? String(namePath[0] || '') : String(namePath || '')
  if (!fieldName) return '1'
  if (FIELD_TAB_MAP[fieldName]) return FIELD_TAB_MAP[fieldName]
  if (fieldName.startsWith('info_') || fieldName.startsWith('check_')) return '3'
  return '1'
}

const normalizeOperationEndDateTime = (startAt: Dayjs, endAt: Dayjs): Dayjs => {
  if (!startAt.isValid() || !endAt.isValid()) return endAt

  // Support operasi lintas tengah malam:
  // jika tanggal sama tapi jam selesai < jam mulai, anggap selesai di hari berikutnya.
  if (endAt.isBefore(startAt) && endAt.isSame(startAt, 'day')) {
    return endAt.add(1, 'day')
  }

  return endAt
}

const formatScheduleDateTime = (value: Date): string => {
  return dayjs(value).format('DD/MM/YYYY HH:mm')
}

const classifySubmitErrorSource = (messageText: string): 'Validasi Form' | 'IPC' | 'Backend' => {
  const text = String(messageText || '').toLowerCase()
  if (
    text.includes('no_backend_token') ||
    text.includes('api okrequest tidak tersedia') ||
    text.includes('api operatingroom tidak tersedia') ||
    text.includes('invalid arguments') ||
    text.includes('invalid result') ||
    text.includes('zod') ||
    text.includes('ipc') ||
    text.includes('channel')
  ) {
    return 'IPC'
  }

  if (
    /http\s*\d{3}/.test(text) ||
    text.includes('forbidden') ||
    text.includes('unauthorized') ||
    text.includes('internal server') ||
    text.includes('sequelize') ||
    text.includes('hak akses') ||
    text.includes('autentikasi')
  ) {
    return 'Backend'
  }

  if (
    text.includes('required') ||
    text.includes('wajib') ||
    text.includes('harus') ||
    text.includes('pilih') ||
    text.includes('minimal') ||
    text.includes('must be')
  ) {
    return 'Validasi Form'
  }

  return 'Backend'
}

const getKelasLabel = getKelasTarifLabel

const extractTarifValue = (tarifRow: TarifListRow | null | undefined): number | null => {
  const candidates = [tarifRow?.tarifTotal, tarifRow?.tarifPaket, tarifRow?.nominal]
  for (const value of candidates) {
    const num = Number(value)
    if (Number.isFinite(num) && num >= 0) return num
  }
  return null
}

const pickActiveTarifByKelas = (tarifList: Array<TarifListRow | null | undefined>): ActivePaketTarif[] => {
  const today = dayjs().startOf('day')
  const latestByKelas = new Map<string, { effectiveFrom: Dayjs; tarif: number }>()

  for (const row of Array.isArray(tarifList) ? tarifList : []) {
    if (row?.aktif === false) continue

    const kelas = normalizeKelas(row?.kelas)
    if (!kelas) continue

    const tarif = extractTarifValue(row)
    if (tarif === null) continue

    const effectiveFrom = dayjs(row?.effectiveFrom)
    if (!effectiveFrom.isValid() || effectiveFrom.isAfter(today, 'day')) continue

    const effectiveTo = row?.effectiveTo ? dayjs(row.effectiveTo) : null
    if (effectiveTo && effectiveTo.isValid() && effectiveTo.isBefore(today, 'day')) continue

    const existing = latestByKelas.get(kelas)
    if (!existing || effectiveFrom.isAfter(existing.effectiveFrom, 'day')) {
      latestByKelas.set(kelas, { effectiveFrom, tarif })
    }
  }

  return Array.from(latestByKelas.entries())
    .map(([kelas, item]) => ({ kelas, tarif: item.tarif }))
    .sort((a, b) => {
      const idxA = KELAS_ORDER.indexOf(a.kelas)
      const idxB = KELAS_ORDER.indexOf(b.kelas)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.kelas.localeCompare(b.kelas)
    })
}

export const PengajuanOKForm: React.FC<PengajuanOKProps> = ({
  type,
  encounterId,
  patientData,
  onSuccess
}) => {
  const { message: messageApi } = App.useApp()
  const [form] = Form.useForm()
  const config = useMemo(() => SERVICE_CONFIGS[type], [type])
  const [activeTab, setActiveTab] = useState('1')
  const imgRef = useRef<HTMLImageElement>(null)
  const [markers, setMarkers] = useState<BodyMapMarker[]>([])
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState(false)
  const [tempMarker, setTempMarker] = useState<{ x: number; y: number } | null>(null)
  const [markerNote, setMarkerNote] = useState('')
  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [dokumenFileList, setDokumenFileList] = useState<UploadFile[]>([])

  const { data: performers, isLoading: loadingPerformers } = usePerformers(['doctor'])
  const {
    data: operatingRooms,
    isLoading: loadingRooms,
    isError: isRoomListError,
    error: roomListError
  } = useOperatingRoomList('available')
  const { data: masterPaketList, isLoading: loadingPaketTindakan } = useMasterPaketTindakanList({
    aktif: true,
    isPaketOk: true,
    items: 500
  })
  const { data: referenceKelasOptions = DEFAULT_KELAS_TARIF_OPTIONS } = useTarifKelasOptions()
  const { data: existingOkRequests = [] } = useOkRequestList()
  const createOkRequest = useCreateOkRequest()
  const uploadSupportingDocument = useUploadOkSupportingDocument()
  const { mutateAsync: createQuestionnaireResponse } = useCreateQuestionnaireResponse()

  const performerOptions = useMemo(
    () =>
      performers?.map((p) => ({
        label: p.name,
        value: Number(p.id)
      })) || [],
    [performers]
  )

  const roomOptions = useMemo(
    () =>
      operatingRooms?.map((r) => ({
        label: `${r.nama} (${r.kelas})`,
        value: Number(r.id)
      })) || [],
    [operatingRooms]
  )
  const roomListErrorMessage = roomListError instanceof Error
    ? roomListError.message
    : 'Gagal memuat daftar ruang OK. Coba muat ulang halaman.'

  const paketById = useMemo(() => {
    const map = new Map<number, MasterPaketTindakanItem>()
    ;(masterPaketList || []).forEach((item) => {
      const id = Number(item?.id)
      if (Number.isFinite(id) && id > 0) map.set(id, item)
    })
    return map
  }, [masterPaketList])

  const groupedPaket = useMemo(() => {
    const groupMap = new Map<string, MasterPaketTindakanItem[]>()
    ;(masterPaketList || []).forEach((item) => {
      const id = Number(item?.id)
      if (!Number.isFinite(id) || id <= 0) return
      const groupName = String(item.kategoriPaket || 'Tanpa Kategori')
      const current = groupMap.get(groupName) || []
      current.push(item)
      groupMap.set(groupName, current)
    })

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([kategori, paketList]) => ({
        kategori,
        paketList: [...paketList].sort((a, b) => String(a.namaPaket || '').localeCompare(String(b.namaPaket || '')))
      }))
  }, [masterPaketList])

  const selectedPaketIds = Form.useWatch('selectedPaketIds', form) as Array<number | string> | undefined
  const selectedTarifKelas = Form.useWatch('selectedTarifKelas', form) as string | undefined
  const selectedOperatingRoom = Form.useWatch('ruangOK', form) as number | string | undefined
  const selectedScheduleStart = Form.useWatch('rencanaMulai', form) as Dayjs | undefined
  const selectedScheduleEnd = Form.useWatch('rencanaSelesai', form) as Dayjs | undefined

  const selectedOperatingRoomLabel = useMemo(() => {
    const roomId = Number(selectedOperatingRoom)
    if (!Number.isInteger(roomId) || roomId <= 0) return ''
    const selected = roomOptions.find((item) => Number(item?.value) === roomId)
    return String(selected?.label || '').trim()
  }, [roomOptions, selectedOperatingRoom])

  const selectedScheduleWindow = useMemo(() => {
    const roomId = Number(selectedOperatingRoom)
    if (!Number.isInteger(roomId) || roomId <= 0) return null
    if (!selectedScheduleStart || !selectedScheduleEnd) return null

    const startAt = dayjs(selectedScheduleStart)
    const endAt = normalizeOperationEndDateTime(startAt, dayjs(selectedScheduleEnd))
    if (!startAt.isValid() || !endAt.isValid()) return null
    if (endAt.isBefore(startAt)) return null

    return {
      operatingRoomId: roomId,
      startAt,
      endAt
    }
  }, [selectedOperatingRoom, selectedScheduleEnd, selectedScheduleStart])

  const scheduleConflicts = useMemo(() => {
    if (!selectedScheduleWindow) return []
    return findOkRequestScheduleConflicts(existingOkRequests, {
      operatingRoomId: selectedScheduleWindow.operatingRoomId,
      scheduledStartAt: selectedScheduleWindow.startAt.toDate(),
      scheduledEndAt: selectedScheduleWindow.endAt.toDate()
    })
  }, [existingOkRequests, selectedScheduleWindow])

  const firstScheduleConflict = scheduleConflicts[0]

  const selectedPaketDetails = useMemo(() => {
    const ids = Array.isArray(selectedPaketIds) ? selectedPaketIds : []
    return ids
      .map((raw) => paketById.get(Number(raw)))
      .filter((item): item is MasterPaketTindakanItem => !!item)
  }, [paketById, selectedPaketIds])

  const activeTarifByPaketId = useMemo(() => {
    const map = new Map<number, ActivePaketTarif[]>()
    ;(masterPaketList || []).forEach((paket) => {
      const paketId = Number(paket?.id)
      if (!Number.isFinite(paketId) || paketId <= 0) return
      map.set(paketId, pickActiveTarifByKelas(Array.isArray(paket?.tarifList) ? paket.tarifList : []))
    })
    return map
  }, [masterPaketList])

  const kelasOrderMap = useMemo(() => {
    const map = new Map<string, number>()
    referenceKelasOptions.forEach((option, idx) => {
      const normalizedValue = normalizeKelas(option.value)
      if (!normalizedValue) return
      map.set(normalizedValue, idx)
    })
    return map
  }, [referenceKelasOptions])

  const selectedTarifKelasNormalized = useMemo(
    () => normalizeKelas(selectedTarifKelas),
    [selectedTarifKelas]
  )

  const availableKelasOptions = useMemo(() => {
    const kelasSet = new Set<string>()
    activeTarifByPaketId.forEach((tarifList) => {
      tarifList.forEach((tarif) => {
        const kelas = normalizeKelas(tarif?.kelas)
        if (kelas) kelasSet.add(kelas)
      })
    })
    return Array.from(kelasSet)
      .sort((a, b) => {
        const idxA = kelasOrderMap.get(a)
        const idxB = kelasOrderMap.get(b)
        if (idxA !== undefined && idxB !== undefined) return idxA - idxB
        if (idxA !== undefined) return -1
        if (idxB !== undefined) return 1
        return a.localeCompare(b)
      })
      .map((kelas) => ({ value: kelas, label: getKelasLabel(kelas) }))
  }, [activeTarifByPaketId, kelasOrderMap])

  const availableKelasSet = useMemo(() => {
    return new Set(availableKelasOptions.map((option) => normalizeKelas(option.value)))
  }, [availableKelasOptions])

  const defaultTarifKelasFromPatientData = useMemo(() => {
    const paymentMethod =
      patientData?.queueTicket?.paymentMethod || patientData?.encounter?.queueTicket?.paymentMethod
    return normalizeKelas(mapPaymentMethodToTarifKelas(paymentMethod))
  }, [patientData])

  const initialTarifKelas = useMemo(() => {
    const preferred = normalizeKelas(defaultTarifKelasFromPatientData)
    if (preferred && availableKelasSet.has(preferred)) return preferred
    if (availableKelasSet.has('UMUM')) return 'UMUM'
    return availableKelasOptions[0]?.value
  }, [availableKelasOptions, availableKelasSet, defaultTarifKelasFromPatientData])

  useEffect(() => {
    const current = normalizeKelas(form.getFieldValue('selectedTarifKelas'))
    if (!current && initialTarifKelas) {
      form.setFieldValue('selectedTarifKelas', initialTarifKelas)
    }
  }, [form, initialTarifKelas])

  const selectedKelasTarifByPaketId = useMemo(() => {
    const map = new Map<number, number>()
    if (!selectedTarifKelasNormalized) return map
    activeTarifByPaketId.forEach((tarifList, paketId) => {
      const matchedTarif = tarifList.find(
        (tarif) => normalizeKelas(tarif?.kelas) === selectedTarifKelasNormalized
      )
      if (matchedTarif) map.set(paketId, Number(matchedTarif.tarif))
    })
    return map
  }, [activeTarifByPaketId, selectedTarifKelasNormalized])

  const selectablePaketIdSet = useMemo(() => {
    const set = new Set<number>()
    if (!selectedTarifKelasNormalized) return set
    selectedKelasTarifByPaketId.forEach((_, paketId) => set.add(paketId))
    return set
  }, [selectedKelasTarifByPaketId, selectedTarifKelasNormalized])

  useEffect(() => {
    const paketList = Array.isArray(masterPaketList) ? masterPaketList : []
    const selectableIds = Array.from(selectablePaketIdSet.values())

    const tableRows = paketList.map((paket) => {
      const paketId = Number(paket?.id)
      const activeTarif = activeTarifByPaketId.get(paketId) || []
      return {
        id: paketId,
        kodePaket: paket?.kodePaket,
        namaPaket: paket?.namaPaket,
        kategoriPaket: paket?.kategoriPaket,
        aktif: paket?.aktif,
        isPaketOk: paket?.isPaketOk,
        selectable: selectablePaketIdSet.has(paketId),
        activeTarifKelas: activeTarif.map((row) => row.kelas).join(', '),
        activeTarifCount: activeTarif.length
      }
    })

    console.groupCollapsed(
      `[PengajuanOKForm][Debug Paket] total=${paketList.length} selectable=${selectableIds.length}`
    )
    console.log('selectedTarifKelasNormalized:', selectedTarifKelasNormalized)
    console.log('referenceKelasOptions:', referenceKelasOptions)
    console.log('availableKelasOptions:', availableKelasOptions)
    console.log('selectablePaketIds:', selectableIds)
    console.log('masterPaketList(raw):', paketList)
    console.table(tableRows)
    console.groupEnd()
  }, [
    activeTarifByPaketId,
    availableKelasOptions,
    masterPaketList,
    referenceKelasOptions,
    selectablePaketIdSet,
    selectedTarifKelasNormalized
  ])

  useEffect(() => {
    const rawSelected = Array.isArray(selectedPaketIds) ? selectedPaketIds : []
    if (!selectedTarifKelasNormalized) {
      if (rawSelected.length > 0) form.setFieldValue('selectedPaketIds', [])
      return
    }
    if (rawSelected.length === 0) return

    const normalizedCurrent = Array.from(
      new Set(
        rawSelected
          .map((raw) => Number(raw))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    )
    const normalizedValid = normalizedCurrent.filter((id) => selectablePaketIdSet.has(id))

    if (normalizedCurrent.length !== normalizedValid.length) {
      form.setFieldValue('selectedPaketIds', normalizedValid)
    }
  }, [form, selectablePaketIdSet, selectedPaketIds, selectedTarifKelasNormalized])

  const formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`

  const notifySuccess = (content: string) => {
    messageApi.open({
      type: 'success',
      content,
      duration: 3
    })
  }

  const notifyError = (content: string) => {
    messageApi.open({
      type: 'error',
      content,
      duration: 4
    })
  }

  const handleImageClick = (e: React.MouseEvent) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setTempMarker({ x, y })
    setMarkerNote('')
    setIsMarkerModalOpen(true)
  }

  const saveMarker = () => {
    const note = markerNote.trim()
    if (!tempMarker) return
    if (!note) {
      notifyError('Keterangan penanda wajib diisi.')
      return
    }

    setMarkers((prev) => [
      ...prev,
      { id: Date.now(), x: tempMarker.x, y: tempMarker.y, note }
    ])
    setIsMarkerModalOpen(false)
    setTempMarker(null)
    setMarkerNote('')
  }

  const removeMarker = (id: number) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id))
  }

  const handleFinish = (values: PengajuanOKFormValues) => {
    if (uploadSupportingDocument.isPending) {
      notifyError('Upload dokumen masih diproses. Mohon tunggu hingga selesai.')
      return
    }

    if (isRoomListError) {
      notifyError('Daftar ruang OK gagal dimuat. Periksa koneksi/akses lalu coba lagi.')
      return
    }

    const selectedKelas = normalizeKelas(selectedTarifKelasNormalized)
    if (!selectedKelas) {
      notifyError('Pilih kelas tarif terlebih dahulu.')
      return
    }

    const selectedPaketIdNumbers: number[] = Array.from(
      new Set(
        (Array.isArray(values.selectedPaketIds) ? values.selectedPaketIds : [])
          .map((raw: unknown) => Number(raw))
          .filter((id: number) => Number.isFinite(id) && id > 0)
      )
    )

    if (selectedPaketIdNumbers.length === 0) {
      notifyError('Pilih minimal satu paket tindakan operasi.')
      return
    }

    const firstEmptyMarkerIndex = markers.findIndex((marker) => String(marker.note || '').trim() === '')
    if (firstEmptyMarkerIndex >= 0) {
      setActiveTab('1')
      notifyError(`Catatan lokasi marker #${firstEmptyMarkerIndex + 1} belum diisi.`)
      return
    }

    const invalidPaket = selectedPaketIdNumbers.filter((paketId) => {
      return !selectedKelasTarifByPaketId.has(paketId)
    })
    if (invalidPaket.length > 0) {
      notifyError(`Ada paket yang tidak punya tarif aktif untuk kelas ${getKelasLabel(selectedKelas)}.`)
      return
    }

    const paketTindakanList = selectedPaketIdNumbers.map((paketId, index) => {
      const paket = paketById.get(paketId)
      const tarifUntukKelas = selectedKelasTarifByPaketId.get(paketId)
      return {
        paketId,
        paketKodeSnapshot: String(paket?.kodePaket || ''),
        paketNamaSnapshot: String(paket?.namaPaket || ''),
        kategoriPaketSnapshot: paket?.kategoriPaket || null,
        kelasTarifSnapshot: selectedKelas || null,
        tarifPaketSnapshot: Number.isFinite(Number(tarifUntukKelas))
          ? Number(tarifUntukKelas)
          : null,
        sortOrder: index
      }
    })

    const plannedProcedureSummary = paketTindakanList
      .map((item) => item.paketNamaSnapshot)
      .filter((name) => name.length > 0)
      .join(', ')
    const estimatedCostFromPaket = paketTindakanList.reduce(
      (sum, item) => sum + Number(item.tarifPaketSnapshot || 0),
      0
    )

    // Mapping prioritas berbasis sifat operasi dengan normalisasi
    const priority = mapSifatOperasiToPriority(values.sifatOperasi)

    // Hitung durasi dalam menit
    let estimatedDurationMinutes = 0
    let scheduledStartAt: Dayjs | null = null
    let scheduledEndAt: Dayjs | null = null
    if (values.rencanaMulai && values.rencanaSelesai) {
      const startAt = dayjs(values.rencanaMulai)
      const endAt = normalizeOperationEndDateTime(startAt, dayjs(values.rencanaSelesai))
      const diffMinutes = endAt.diff(startAt, 'minute')

      if (!Number.isFinite(diffMinutes) || diffMinutes < 0) {
        setActiveTab('1')
        notifyError('Estimasi selesai tidak valid. Periksa kembali jadwal operasi.')
        return
      }

      scheduledStartAt = startAt
      scheduledEndAt = endAt
      estimatedDurationMinutes = Math.floor(diffMinutes)
    }

    const normalizedOperatingRoomId = Number(values.ruangOK)
    if (
      Number.isInteger(normalizedOperatingRoomId) &&
      normalizedOperatingRoomId > 0 &&
      scheduledStartAt &&
      scheduledEndAt
    ) {
      const submitConflicts = findOkRequestScheduleConflicts(existingOkRequests, {
        operatingRoomId: normalizedOperatingRoomId,
        scheduledStartAt: scheduledStartAt.toDate(),
        scheduledEndAt: scheduledEndAt.toDate()
      })
      const firstConflict = submitConflicts[0]
      if (firstConflict) {
        const roomLabel =
          roomOptions.find((room) => Number(room.value) === normalizedOperatingRoomId)?.label ||
          `Ruang #${normalizedOperatingRoomId}`
        messageApi.warning(
          `Jadwal bentrok di ${roomLabel} dengan ${firstConflict.kode || `ID ${firstConflict.id}`} (${formatScheduleDateTime(firstConflict.scheduledStartAt)} - ${formatScheduleDateTime(firstConflict.scheduledEndAt)}).`
        )
      }
    }

    const payload: CreateOkRequestPayload = {
      encounterId,
      sourceUnit: mapSourceUnit(type),
      dpjpId: values.perujuk,
      referrerId: values.perujuk,
      operatingRoomId: values.ruangOK,
      scheduledAt: scheduledStartAt ? scheduledStartAt.toISOString() : null,
      estimatedDurationMinutes,
      priority,
      status: values.status === 'diajukan' ? 'diajukan' : OkRequestStatus.DRAFT,
      klasifikasi: values.jenisOperasi,
      mainDiagnosis: values.mainDiagnosis,
      plannedProcedureSummary,
      estimatedCost: Number.isFinite(estimatedCostFromPaket) ? estimatedCostFromPaket : null,
      paketTindakanList,
      markers,
      notes: values.catatanBodyMap,
      dokumenPendukung: values.dokumenPendukung || null
    }

    createOkRequest.mutate(payload, {
      onSuccess: async (res) => {
        const typedResult = res as CreateOkRequestResult
        const okRequestId = typedResult.result?.id

        // Jika ada data informed consent, simpan QuestionnaireResponse
        if (values.receiver_name && okRequestId) {
          try {
            const items: QuestionnaireResponseItem[] = [
              { linkId: 'receiver-name', text: 'Nama Penerima', valueString: values.receiver_name },
              { linkId: 'receiver-birthdate', text: 'Tanggal Lahir Penerima', valueDateTime: values.receiver_birthdate?.toISOString() },
              { linkId: 'receiver-address', text: 'Alamat Penerima', valueString: values.receiver_address },
              { linkId: 'consent-type', text: 'Jenis Persetujuan', valueString: values.consent_type },
              { linkId: 'diagnosis', text: 'Diagnosis (WD & DD)', valueString: values.info_diagnosis, item: [{ linkId: 'diagnosis-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_diagnosis }] },
              { linkId: 'basis', text: 'Dasar Diagnosis', valueString: values.info_basis, item: [{ linkId: 'basis-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_basis }] },
              { linkId: 'procedure', text: 'Tindakan Kedokteran', valueString: values.info_procedure, item: [{ linkId: 'procedure-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_procedure }] },
              { linkId: 'indication', text: 'Indikasi Tindakan', valueString: values.info_indication, item: [{ linkId: 'indication-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_indication }] },
              { linkId: 'method', text: 'Tata Cara', valueString: values.info_method, item: [{ linkId: 'method-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_method }] },
              { linkId: 'objective', text: 'Tujuan', valueString: values.info_objective, item: [{ linkId: 'objective-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_objective }] },
              { linkId: 'risk', text: 'Risiko', valueString: values.info_risk, item: [{ linkId: 'risk-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_risk }] },
              { linkId: 'complication', text: 'Komplikasi', valueString: values.info_complication, item: [{ linkId: 'complication-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_complication }] },
              { linkId: 'prognosis', text: 'Prognosis', valueString: values.info_prognosis, item: [{ linkId: 'prognosis-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_prognosis }] },
              { linkId: 'alternative', text: 'Alternatif & Risiko', valueString: values.info_alternative, item: [{ linkId: 'alternative-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_alternative }] },
              { linkId: 'witness1', text: 'Saksi 1', valueString: values.witness1_name },
              { linkId: 'witness2', text: 'Saksi 2', valueString: values.witness2_name },
              { linkId: 'signature-doctor', text: 'Tanda Tangan Dokter', valueString: signatures['doctor'] },
              { linkId: 'signature-receiver', text: 'Tanda Tangan Penerima', valueString: signatures['receiver'] },
              { linkId: 'signature-witness1', text: 'Tanda Tangan Saksi 1', valueString: signatures['witness1'] },
              { linkId: 'signature-witness2', text: 'Tanda Tangan Saksi 2', valueString: signatures['witness2'] }
            ]

            await createQuestionnaireResponse({
              encounterId,
              subjectId: patientData?.subjectId || patientData?.patient?.id || '',
              status: QuestionnaireResponseStatus.COMPLETED,
              authored: values.assessment_date?.toISOString() || new Date().toISOString(),
              authorId: values.performerId,
              okRequestId: okRequestId,
              items
            })
          } catch (qcErr) {
            console.error('Failed to save Informed Consent part:', qcErr)
          }
        }

        notifySuccess('Pengajuan OK berhasil dikirim')
        onSuccess?.()
      },
      onError: (err: unknown) => {
        const typedError = err as { message?: unknown }
        const rawMessage =
          typeof typedError?.message === 'string' && typedError.message.length > 0
            ? typedError.message
            : 'Terjadi kesalahan saat submit pengajuan OK'
        if (rawMessage.toLowerCase().includes('jadwal operasi bentrok')) {
          setActiveTab('1')
        }
        const source = classifySubmitErrorSource(rawMessage)
        console.error('[PengajuanOKForm] submit failed', {
          source,
          error: typedError,
          message: rawMessage
        })
        notifyError(`${source}: ${rawMessage}`)
      }
    })
  }

  const handleFinishFailed = (errorInfo: FormFinishErrorInfo) => {
    const firstErrorField = Array.isArray(errorInfo?.errorFields) ? errorInfo.errorFields[0] : null
    const firstFieldNamePath = firstErrorField?.name
    const targetTab = resolveTabByFieldName(firstFieldNamePath)
    setActiveTab(targetTab)

    const firstErrorMessage = Array.isArray(firstErrorField?.errors) && firstErrorField.errors.length > 0
      ? String(firstErrorField.errors[0])
      : 'Lengkapi field wajib sebelum submit.'

    notifyError(`Validasi Form: ${firstErrorMessage}`)
  }

  const dokumenUploadProps: UploadProps = {
    maxCount: 1,
    accept: '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv',
    fileList: dokumenFileList,
    customRequest: async (options) => {
      const rawFile = options.file as File
      try {
        if (rawFile.size > 25 * 1024 * 1024) {
          throw new Error('Ukuran file terlalu besar. Maksimal 25MB')
        }

        setDokumenFileList([
          {
            uid: (rawFile as unknown as { uid?: string }).uid || `${Date.now()}`,
            name: rawFile.name,
            status: 'uploading'
          }
        ])

        const arrayBuffer = await rawFile.arrayBuffer()
        const response = (await uploadSupportingDocument.mutateAsync({
          file: arrayBuffer,
          filename: rawFile.name,
          mimetype: rawFile.type || null
        })) as UploadOkSupportingDocumentResult

        const uploadedPath = response?.result?.path
        if (!uploadedPath) {
          throw new Error('Path dokumen dari server tidak ditemukan')
        }

        form.setFieldValue('dokumenPendukung', uploadedPath)
        setDokumenFileList([
          {
            uid: (rawFile as unknown as { uid?: string }).uid || `${Date.now()}`,
            name: rawFile.name,
            status: 'done',
            url: `${import.meta.env.VITE_FILE_SERVER_URL ?? ''}/public/${uploadedPath}`
          }
        ])
        notifySuccess('Dokumen praoperasi berhasil diunggah')
        options.onSuccess?.({ path: uploadedPath })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Gagal upload dokumen pendukung'
        setDokumenFileList([])
        form.setFieldValue('dokumenPendukung', null)
        notifyError(message)
        options.onError?.(new Error(message))
      }
    },
    onRemove: () => {
      setDokumenFileList([])
      form.setFieldValue('dokumenPendukung', null)
      return true
    }
  }

  const items = [
    {
      key: '1',
      label: '1. Pengajuan & Penjadwalan',
      children: (
        <div className="flex flex-col gap-4">
          {config.showEmergencyAlert && (
            <Alert
              type="error"
              showIcon
              icon={<ThunderboltOutlined />}
              message="KATEGORI CYTO: Pastikan identitas pasien, sisi operasi (body map), dan jenis tindakan darurat sudah diverifikasi."
              className="mb-2"
            />
          )}

          <section>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Form.Item name="mainDiagnosis" label="Diagnosis Utama" rules={[{ required: true }]}>
                  <Input.TextArea placeholder="Masukkan diagnosis utama pasien..." rows={2} />
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item
                  name="sifatOperasi"
                  label={<span className="font-semibold text-gray-600">Sifat Operasi</span>}
                  rules={[{ required: true }]}
                >
                  <Radio.Group className="flex gap-4">
                    <Radio value="cyto">
                      <Tag color="red">CYTO</Tag>
                    </Radio>
                    <Radio value="efektif">
                      <Tag color="green">EFEKTIF</Tag>
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item name="jenisOperasi" label="Jenis Operasi" rules={[{ required: true }]}>
                  <Select
                    placeholder="Pilih jenis"
                    options={[
                      { label: 'Operasi Kecil', value: 'kecil' },
                      { label: 'Operasi Sedang', value: 'sedang' },
                      { label: 'Operasi Besar', value: 'besar' },
                      { label: 'Operasi Khusus', value: 'khusus' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={24}>
                <Form.Item name="status" label="Status">
                  <Select
                    options={[
                      { label: 'Draft', value: 'draft' },
                      { label: 'Diajukan', value: 'diajukan' }
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <Divider />

          <section>
            <Title level={5} className={`mb-4 ${config.accentColor}`}>
              Detail Penjadwalan & Rujukan
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={24} md={12}>
                <Form.Item name="perujuk" label="Dokter Perujuk/DPJP" rules={[{ required: true }]}>
                  <Select
                    placeholder="Pilih dokter"
                    showSearch
                    options={performerOptions}
                    loading={loadingPerformers}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item name="tanggalRujukan" label="Tanggal Rujukan">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
               <Col span={24} md={8}>
                {isRoomListError && (
                  <Alert
                    type="error"
                    showIcon
                    className="mb-2"
                    message={roomListErrorMessage}
                  />
                )}
                <Form.Item name="ruangOK" label="Ruang OK Tujuan" rules={[{ required: true }]}>
                  <Select 
                    placeholder={isRoomListError ? 'Ruang OK gagal dimuat' : 'Pilih kamar'} 
                    options={roomOptions} 
                    loading={loadingRooms}
                    disabled={isRoomListError}
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  name="rencanaMulai"
                  label="Rencana Mulai"
                  rules={[{ required: true, message: 'Rencana mulai wajib diisi' }]}
                >
                  <DatePicker
                    className="w-full"
                    showTime={{ format: 'HH:mm' }}
                    format="DD/MM/YYYY HH:mm"
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  name="rencanaSelesai"
                  dependencies={['rencanaMulai']}
                  label="Estimasi Selesai"
                  rules={[
                    { required: true, message: 'Estimasi selesai wajib diisi' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const startValue = getFieldValue('rencanaMulai')
                        if (!startValue || !value) return Promise.resolve()

                        const startAt = dayjs(startValue)
                        const rawEndAt = dayjs(value)
                        const endAt = normalizeOperationEndDateTime(startAt, rawEndAt)
                        if (!startAt.isValid() || !endAt.isValid()) return Promise.resolve()
                        if (endAt.isBefore(startAt)) {
                          return Promise.reject(
                            new Error('Estimasi selesai harus sama atau setelah rencana mulai')
                          )
                        }
                        return Promise.resolve()
                      }
                    })
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    showTime={{ format: 'HH:mm' }}
                    format="DD/MM/YYYY HH:mm"
                  />
                </Form.Item>
              </Col>
              {selectedScheduleWindow && firstScheduleConflict && (
                <Col span={24}>
                  <Alert
                    type="warning"
                    showIcon
                    message="Jadwal operasi berpotensi bentrok"
                    description={
                      <span>
                        Slot di {selectedOperatingRoomLabel || `Ruang #${selectedScheduleWindow.operatingRoomId}`} bentrok dengan{' '}
                        {firstScheduleConflict.kode || `ID ${firstScheduleConflict.id}`} (
                        {formatScheduleDateTime(firstScheduleConflict.scheduledStartAt)} -{' '}
                        {formatScheduleDateTime(firstScheduleConflict.scheduledEndAt)}).
                      </span>
                    }
                  />
                </Col>
              )}
            </Row>
          </section>

          <Divider />

          <section>
            <Title level={5} className={`mb-4 ${config.accentColor}`}>
              Penandaan Lokasi Operasi (Body Map)
            </Title>
            <Card
              size="small"
              className={`bg-${config.color === 'red' ? 'red-50/30' : 'gray-50'} border-${config.color}-100`}
            >
              <Row gutter={24}>
                <Col span={24} lg={12}>
                  <div
                    className={`mb-2 bg-${config.color}-50 p-3 rounded text-${config.color}-700 text-xs font-bold border border-${config.color}-200 flex items-center gap-2`}
                  >
                    {config.color === 'red' && <ThunderboltOutlined />}
                    KLIK PADA AREA TUBUH UNTUK MENANDAI LOKASI OPERASI
                  </div>
                  <div
                    className="relative w-full overflow-hidden border border-gray-200 rounded-lg bg-white mb-4 flex justify-center"
                    style={{ minHeight: '450px' }}
                  >
                    <img
                      ref={imgRef}
                      src={bodyMapImage}
                      alt="Body Map"
                      className="h-[440px] w-auto cursor-crosshair block py-2"
                      onClick={handleImageClick}
                    />
                    {markers.map((marker, index) => (
                      <div
                        key={marker.id}
                        style={{
                          position: 'absolute',
                          left: `${marker.x}%`,
                          top: `${marker.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        className="group"
                      >
                        <div className="w-5 h-5 bg-red-500 rounded-full border border-white shadow flex items-center justify-center text-white text-xs font-bold cursor-pointer">
                          {index + 1}
                        </div>
                        <div
                          className="absolute -top-10 left-1/2 transform -translate-x-1/2 hidden group-hover:flex bg-white rounded-md shadow-md p-1 cursor-pointer z-10 border border-gray-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMarker(marker.id)
                          }}
                        >
                          <DeleteOutlined className="text-red-500" />
                        </div>
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {String(marker.note || '').trim() || 'Catatan belum diisi'}
                        </div>
                      </div>
                    ))}
                  </div>
                </Col>
                <Col span={24} lg={12}>
                  <div
                    className={`text-xs font-bold ${config.accentColor} mb-4 uppercase tracking-wider`}
                  >
                    Titik Lokasi Insisi / Operasi
                  </div>
                  <div className="flex flex-col gap-4">
                    {markers.length === 0 ? (
                      <Alert
                        message="Harap berikan penanda lokasi operasi pada gambar untuk mempercepat verifikasi tim OK."
                        type={config.color === 'red' ? 'warning' : 'info'}
                        showIcon
                      />
                    ) : (
                      markers.map((m, idx) => (
                        <div
                          key={m.id}
                          className={`flex items-start gap-3 p-3 bg-white border border-${config.color}-100 rounded-lg shadow-sm`}
                        >
                          <Tag color={config.color} className="m-0 mt-1 font-bold">
                            {idx + 1}
                          </Tag>
                          <div className="flex-1 text-sm font-semibold text-gray-800">
                            {m.note}
                          </div>
                          <Button
                            size="small"
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeMarker(m.id)}
                          />
                        </div>
                      ))
                    )}
                    <Divider />
                    <Form.Item label="Catatan Tambahan Lokasi" name="catatanBodyMap">
                      <Input.TextArea
                        rows={4}
                        placeholder="Jelaskan detail spesifik lokasi jika diperlukan..."
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>
          </section>
        </div>
      )
    },
    {
      key: '2',
      label: '2. Paket Tindakan & Kelas Tarif',
      children: (
        <div className="flex flex-col gap-4">
          <Card size="small" className="shadow-none border-gray-200">
            <Row gutter={[16, 12]}>
              <Col xs={24} md={24}>
                <Form.Item
                  name="selectedTarifKelas"
                  label="Kelas Tarif"
                  rules={[{ required: true, message: 'Pilih kelas tarif' }]}
                  className="mb-0"
                >
                  <SelectKelasTarif
                    placeholder="Pilih kelas tarif"
                    options={availableKelasOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item
            name="selectedPaketIds"
            rules={[
              {
                validator: async (_, value) => {
                  if (!selectedTarifKelasNormalized) {
                    throw new Error('Pilih kelas tarif terlebih dahulu')
                  }
                  const selectedIds = Array.from(
                    new Set(
                      (Array.isArray(value) ? value : [])
                        .map((raw: unknown) => Number(raw))
                        .filter((id: number) => Number.isFinite(id) && id > 0)
                    )
                  )
                  if (selectedIds.length === 0) {
                    throw new Error('Pilih minimal satu paket tindakan')
                  }
                  const invalidPaket = selectedIds.filter((id) => !selectablePaketIdSet.has(id))
                  if (invalidPaket.length > 0) {
                    throw new Error('Paket tanpa tarif aktif tidak dapat dipilih')
                  }
                  return
                }
              }
            ]}
          >
            {loadingPaketTindakan ? (
              <div className="py-8 flex items-center justify-center">
                <Spin tip="Memuat paket tindakan..." />
              </div>
            ) : groupedPaket.length === 0 ? (
              <Empty description="Master paket tindakan aktif belum tersedia" />
            ) : (
              <Checkbox.Group className="w-full">
                {groupedPaket.map((group) => (
                  <div key={group.kategori} className="mb-6 last:mb-0">
                    <Divider
                      orientation="left"
                      className={`mt-0 mb-4 font-bold ${config.accentColor} border-${config.color}-100`}
                    >
                      <span className={`bg-${config.color}-50 px-3 py-1 rounded-full text-xs`}>
                        {group.kategori}
                      </span>
                    </Divider>
                    <Row gutter={[16, 16]}>
                      {group.paketList.map((paket) => {
                        const paketId = Number(paket.id)
                        const selectedKelasTarif = selectedKelasTarifByPaketId.get(paketId)
                        const hasSelectedKelas = Boolean(selectedTarifKelasNormalized)
                        const hasTarifForSelectedKelas = selectedKelasTarif !== undefined
                        const canChoose = hasSelectedKelas && hasTarifForSelectedKelas
                        return (
                          <Col xs={24} key={paket.id}>
                            <Card
                              size="default"
                              className={`h-full rounded-xl shadow-none ${
                                canChoose
                                  ? `border-${config.color}-200 bg-white`
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                              bodyStyle={{ padding: 16 }}
                            >
                              <Checkbox
                                value={paket.id}
                                className="w-full font-semibold text-base leading-6"
                                disabled={!canChoose}
                              >
                                [{paket.kodePaket}] {paket.namaPaket}
                              </Checkbox>
                              <div className="text-xs text-gray-500 mt-3">Tarif kelas dipilih:</div>
                              {!hasSelectedKelas ? (
                                <Tag className="mt-2 m-0">Pilih kelas tarif</Tag>
                              ) : hasTarifForSelectedKelas ? (
                                <Tag color="blue" className="mt-2 m-0">
                                  {getKelasLabel(selectedTarifKelasNormalized)}: {formatCurrency(Number(selectedKelasTarif))}
                                </Tag>
                              ) : (
                                <Tag color="warning" className="mt-2 m-0">
                                  Tarif kelas {getKelasLabel(selectedTarifKelasNormalized)} belum diatur
                                </Tag>
                              )}
                              {!canChoose && hasSelectedKelas && (
                                <div className="text-xs text-red-500 mt-2">
                                  Paket ini tidak bisa dipilih pada kelas tarif yang dipilih.
                                </div>
                              )}
                            </Card>
                          </Col>
                        )
                      })}
                    </Row>
                  </div>
                ))}
              </Checkbox.Group>
            )}
          </Form.Item>

          <Card
            size="small"
            title={<span className="font-semibold">Ringkasan Paket Terpilih</span>}
            className="shadow-none border-gray-200"
          >
            {selectedPaketDetails.length === 0 ? (
              <Text type="secondary" className="text-xs">
                Belum ada paket yang dipilih.
              </Text>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedPaketDetails.map((item) => {
                  const selectedKelasTarif = selectedKelasTarifByPaketId.get(Number(item.id))
                  return (
                    <div key={item.id} className="border border-gray-100 rounded-md p-2">
                      <div className="text-sm">
                        [{item.kodePaket}] {item.namaPaket}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedTarifKelasNormalized && selectedKelasTarif !== undefined ? (
                          <Tag color="blue" className="m-0">
                            {getKelasLabel(selectedTarifKelasNormalized)}: {formatCurrency(Number(selectedKelasTarif))}
                          </Tag>
                        ) : (
                          <Tag color="warning" className="m-0">
                            Tarif belum diatur
                          </Tag>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )
    },
    {
      key: '3',
      label: '3. Informed Consent',
      children: (
        <div className="flex flex-col gap-4">
          <InformedConsentForm
            standalone={false}
            externalForm={form}
            hideHeader
            encounterId={encounterId}
            patientData={patientData}
            signatures={signatures}
            onSignatureChange={(type, dataUrl) => setSignatures(prev => ({ ...prev, [type]: dataUrl }))}
          />
        </div>
      )
    },
    {
      key: '4',
      label: `4. ${config.tab4Label}`,
      children: (
        <div className="flex flex-col gap-4">
          <Card
            title={
              <span className={`font-bold ${config.accentColor}`}>Unggah {config.tab4Label}</span>
            }
            size="small"
            className={`shadow-none border-${config.color}-100`}
            extra={
              <Text type="secondary" className="text-xs">
                Wajib: Hasil Lab & Dokumen Pendukung
              </Text>
            }
          >
            <Form.Item name="dokumenPendukung" hidden>
              <Input />
            </Form.Item>
            <Form.Item label="Dokumen Surat Praoperasi" className="mb-2">
              <Dragger {...dokumenUploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined className={config.accentColor} />
                </p>
                <p className="ant-upload-text">Klik atau seret file ke area ini</p>
                <p className="ant-upload-hint text-xs">
                  Mendukung 1 file. Maksimal 25MB.
                </p>
              </Dragger>
            </Form.Item>
            {form.getFieldValue('dokumenPendukung') ? (
              <Text type="secondary" className="text-xs">
                Path dokumen: {String(form.getFieldValue('dokumenPendukung'))}
              </Text>
            ) : null}
          </Card>
        </div>
      )
    }
  ]

  return (
    <Card
      title={
        <div className="flex justify-between items-center py-1">
          <div className="flex flex-col">
            <span
              className={`text-gray-700 font-bold uppercase tracking-wider text-xs flex items-center gap-2`}
            >
              {config.color === 'red' && <ThunderboltOutlined />}
              Form Pengajuan Kamar Operasi ({config.label})
            </span>
          </div>
        </div>
      }
      className={`shadow-none border-${config.color}-200 overflow-hidden`}
      bodyStyle={{ padding: '0 24px 24px' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onFinishFailed={handleFinishFailed}
        initialValues={{
          assessment_date: dayjs(),
          tanggalRencana: dayjs(),
          sifatOperasi: 'efektif',
          status: config.defaultStatus,
          selectedTarifKelas: initialTarifKelas || undefined,
          selectedPaketIds: []
        }}
        className="pt-6"
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          className="assessment-tabs"
          size="small"
          tabBarStyle={{ marginBottom: 24 }}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            size="large"
            disabled={createOkRequest.isPending}
            onClick={() => {
              form.resetFields()
              form.setFieldValue('selectedTarifKelas', initialTarifKelas || undefined)
              form.setFieldValue('dokumenPendukung', null)
              setDokumenFileList([])
            }}
          >
            Reset Form
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={createOkRequest.isPending}
            onClick={() => form.submit()}
            className={`bg-${config.color === 'red' ? 'red-600' : config.color === 'cyan' ? 'cyan-600' : 'emerald-600'} hover:opacity-90 border-none shadow-lg px-8`}
          >
            Submit Pengajuan OK
          </Button>
        </div>
      </Form>

      <Modal
        title="Tambah Penanda"
        open={isMarkerModalOpen}
        onOk={saveMarker}
        onCancel={() => {
          setIsMarkerModalOpen(false)
          setTempMarker(null)
          setMarkerNote('')
        }}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical">
          <Form.Item
            label="Keterangan Lokasi Operasi"
            required
            validateStatus={markerNote.trim() ? undefined : 'error'}
            help={markerNote.trim() ? undefined : 'Keterangan wajib diisi'}
          >
            <Input
              autoFocus
              value={markerNote}
              onChange={(event) => setMarkerNote(event.target.value)}
              onPressEnter={saveMarker}
              placeholder="Misal: Sisi kanan, regio abdomen kanan bawah"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
