/**
 * purpose: Form detail tindakan pasien untuk input/edit tindakan paket/non-paket dan BHP per encounter.
 * main callers: Workspace dokter/perawat EMR melalui komponen asesmen detail tindakan.
 * key dependencies: Hook detail tindakan encounter, master tindakan/paket/BHP, komponen tab detail tindakan.
 * main/public functions: `DetailTindakanForm`.
 * side effects: Query master data dan detail encounter, create/update/void detail tindakan pasien ke backend.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import {
  Form,
  Button,
  Card,
  App,
  Modal,
  Table,
  Space,
  Tooltip,
  Popconfirm,
  Popover,
  Spin,
  Tag,
  Tabs
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  HistoryOutlined,
  EditOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useMyProfile } from '@renderer/hooks/useProfile'
import {
  useMasterTindakanList,
  type MasterTindakanItem,
  type CategoryBpjs
} from '@renderer/hooks/query/use-master-tindakan'
import {
  useMasterPaketTindakanListPaged,
  type PaketDetailItem,
  type PaketBhpItem
} from '@renderer/hooks/query/use-master-paket-tindakan'
import {
  useCreateDetailTindakan,
  useDetailTindakanByEncounter,
  useUpdateDetailTindakan,
  useVoidDetailTindakan
} from '../../../../hooks/query/use-detail-tindakan-pasien'
import { useMasterJenisKomponenList } from '@renderer/hooks/query/use-master-jenis-komponen'
import { useMasterPaketBhpList } from '@renderer/hooks/query/use-master-paket-bhp'
import { theme } from 'antd'
import PaketTindakanTab from './PaketTindakanTab'
import TindakanNonPaketTab from './TindakanNonPaketTab'
import PaketBhpTab from './PaketBhpTab'
import BhpNonPaketTab from './BhpNonPaketTab'
import PaketOperationBreakdown from './PaketOperationBreakdown'
import {
  ItemSelectorModal,
  ItemAttributes,
  ItemOption
} from '@renderer/components/organisms/ItemSelectorModal'
import { ProcedureSelectorModal } from '@renderer/components/organisms/ProcedureSelectorModal'
import {
  DEFAULT_TARIF_KELAS_CODE,
  DEFAULT_KELAS_TARIF_OPTIONS,
  ensureUmumOption,
  normalizeKelasTarifValue,
  sortKelasTarifOptions
} from '@renderer/utils/tarif-kelas'
import { useTarifKelasOptions } from '@renderer/hooks/query/use-tarif-kelas-options'
import type { TarifPayerCategory } from '@renderer/utils/ok-tarif-selector'
import {
  mapDetailTindakanPaymentMethodToPayerCategory,
  pickDetailTindakanTarifWithFallback,
  resolveDetailTindakanPaketCyto
} from './detail-tindakan-tarif-flow'

interface DetailTindakanFormProps {
  encounterId: string
  patientData: any
}

interface ItemListResponse {
  success: boolean
  result?: ItemAttributes[]
  message?: string
  error?: string
}

// Using ItemAttributes defined in ItemSelectorModal

interface MasterTarifKomponenRef {
  jenisKomponenId?: number | string | null
  kode?: string | null
  jenisKomponen?: {
    id?: number
    kode?: string | null
    label?: string | null
    isUntukMedis?: boolean | null
  } | null
}

interface MasterTarifTindakanRef {
  id?: number | string | null
  aktif?: boolean | null
  kelas?: string | null
  payerCategory?: string | null
  isCyto?: boolean | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  komponenList?: MasterTarifKomponenRef[] | null
}

interface MasterTindakanDetailRef {
  id: number
  tarifList?: MasterTarifTindakanRef[] | null
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
  id?: number | string | null
  aktif?: boolean | null
  kelas?: string | null
  payerCategory?: string | null
  isCyto?: boolean | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  rincianTarif?: PaketTarifRincianRef[] | null
}

interface TarifResolutionAuditRow {
  key: string
  jenis: 'Paket' | 'Non-Paket'
  item: string
  kelas: string
  requestedPayerCategory: TarifPayerCategory
  resolvedPayerCategory: TarifPayerCategory | null
  source: 'exact' | 'fallback_umum' | 'missing'
  isCyto: boolean
}

const MASTER_PAKET_KATEGORI_BASE_OPTIONS = [
  'Pemeriksaan Fisik',
  'Tindakan Bedah',
  'Rawat Luka',
  'Injeksi & Infus',
  'Kateter & Drainase',
  'Kebidanan',
  'Endoskopi',
  'Anestesi',
  'Fisioterapi',
  'Gawat Darurat',
  'Dialisis',
  'Konsultasi'
]

const MASTER_PAKET_KATEGORI_BPJS_BASE_OPTIONS = [
  'Prosedur Non Bedah',
  'Prosedur Bedah',
  'Tenaga Ahli',
  'Keperawatan',
  'Radiologi',
  'Laboratorium',
  'Rehabilitasi',
  'Kamar / Akomodasi',
  'Obat',
  'Alkes',
  'BMHP',
  'Pelayanan Darah',
  'Rawat Intensif',
  'Konsultasi',
  'Penunjang',
  'Sewa Alat'
]

type InputTabKey = 'paket' | 'non-paket' | 'paket-bhp' | 'bhp-non-paket'
type ProcedureSelectorState = {
  open: boolean
  mode?: 'select' | 'readonly'
  title?: string
  procedures?: MasterTindakanItem[]
  onSelect?: (item: MasterTindakanItem) => void
}

export const DetailTindakanForm = ({ encounterId, patientData }: DetailTindakanFormProps) => {
  const { message, modal } = App.useApp()
  const { token } = theme.useToken()
  const [modalForm] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeInputTab, setActiveInputTab] = useState<InputTabKey>('paket')
  const [searchTindakan, setSearchTindakan] = useState('')
  const [searchPaket, setSearchPaket] = useState('')
  const [searchPaketBhp, setSearchPaketBhp] = useState('')
  const [paketQuery, setPaketQuery] = useState<{
    page: number
    items: number
    q?: string
    kategoriPaket?: string
    kategoriBpjs?: string
    status?: string
  }>({
    page: 1,
    items: 10,
    status: 'active'
  })
  const [procedureQuery, setProcedureQuery] = useState<{
    page: number
    items: number
    q?: string
    kategori?: string
    categoryBpjs?: CategoryBpjs
  }>({
    page: 1,
    items: 10
  })

  // Modals for Advanced Selection
  const [itemSelectorState, setItemSelectorState] = useState<{
    open: boolean
    onSelect?: (item: ItemOption) => void
  }>({ open: false })

  const [procedureSelectorState, setProcedureSelectorState] = useState<ProcedureSelectorState>({
    open: false,
    mode: 'select'
  })
  const [masterTindakanCache, setMasterTindakanCache] = useState<
    Record<number, MasterTindakanItem>
  >({})
  const [paketCache, setPaketCache] = useState<Record<number, any>>({})
  const { data: kelasOptions = DEFAULT_KELAS_TARIF_OPTIONS } = useTarifKelasOptions()
  const resolvedKelasOptions = useMemo(() => {
    const optionMap = new Map<string, string>()
    kelasOptions.forEach((opt) => {
      const normalized = normalizeKelasTarifValue(opt?.value)
      if (!normalized) return
      if (!optionMap.has(normalized)) {
        optionMap.set(normalized, String(opt?.label || '').trim() || normalized)
      }
    })

    return ensureUmumOption(
      sortKelasTarifOptions(
        Array.from(optionMap.entries()).map(([value, label]) => ({
          value,
          label
        }))
      )
    )
  }, [kelasOptions])
  const [paketBhpCache, setPaketBhpCache] = useState<Record<number, any>>({})
  const [masterTindakanDetailCache, setMasterTindakanDetailCache] = useState<
    Record<number, MasterTindakanDetailRef | null>
  >({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialPetugas, setInitialPetugas] = useState<any[]>([])
  const [initialPaketPetugas, setInitialPaketPetugas] = useState<Record<string, any[]>>({})
  const { profile } = useMyProfile()

  const patientId = patientData?.patient?.id || patientData?.id || ''
  const encounterType = patientData?.encounter?.encounterType || ''
  const normalizedEncounterType = String(encounterType || '').toUpperCase()
  const normalizedServiceType = String(
    patientData?.serviceType || patientData?.encounter?.serviceType || ''
  ).toLowerCase()
  const isIgdEncounter = normalizedEncounterType === 'EMER' || normalizedServiceType.includes('igd')
  const isRawatJalan = encounterType === 'AMB' || encounterType === 'ambulatory'
  const defaultKelas = isRawatJalan ? 'umum' : undefined
  const selectedPayerCategory = useMemo<TarifPayerCategory>(() => {
    const paymentMethod =
      patientData?.encounter?.queueTicket?.paymentMethod || patientData?.queueTicket?.paymentMethod
    return mapDetailTindakanPaymentMethodToPayerCategory(paymentMethod)
  }, [patientData?.encounter?.queueTicket?.paymentMethod, patientData?.queueTicket?.paymentMethod])

  const { data: performers = [], isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse',
    'bidan'
  ])

  const { data: masterTindakanResponse, isLoading: isLoadingMaster } = useMasterTindakanList(
    {
      page: procedureQuery.page,
      items: procedureQuery.items,
      q: procedureQuery.q || undefined,
      kategori: procedureQuery.kategori || undefined,
      categoryBpjs: procedureQuery.categoryBpjs,
      status: 'active'
    },
    {
      enabled: procedureSelectorState.open && (procedureSelectorState.mode ?? 'select') === 'select'
    }
  )
  const masterTindakanList = masterTindakanResponse?.rows ?? []
  const masterTindakanPagination = masterTindakanResponse?.pagination

  useEffect(() => {
    if (!procedureSelectorState.open) return
    if ((procedureSelectorState.mode ?? 'select') !== 'select') return
    setProcedureQuery((prev) => ({ ...prev, page: 1 }))
  }, [procedureSelectorState.mode, procedureSelectorState.open])

  useEffect(() => {
    if (!Array.isArray(masterTindakanList) || masterTindakanList.length === 0) return
    setMasterTindakanCache((prev) => {
      const next = { ...prev }
      masterTindakanList.forEach((item) => {
        const id = Number(item.id)
        if (!Number.isFinite(id) || id <= 0) return
        next[id] = item
      })
      return next
    })
  }, [masterTindakanList])

  const handleProcedureSearchChange = useCallback((value: string) => {
    const normalized = value.trim()
    setProcedureQuery((prev) => {
      if ((prev.q || '') === normalized && prev.page === 1) return prev
      return {
        ...prev,
        q: normalized || undefined,
        page: 1
      }
    })
  }, [])

  const handleProcedureCategoryChange = useCallback((value?: string) => {
    setProcedureQuery((prev) => {
      if ((prev.kategori || undefined) === (value || undefined) && prev.page === 1) return prev
      return {
        ...prev,
        kategori: value || undefined,
        page: 1
      }
    })
  }, [])

  const handleProcedureBpjsCategoryChange = useCallback((value?: CategoryBpjs) => {
    setProcedureQuery((prev) => {
      if ((prev.categoryBpjs || undefined) === (value || undefined) && prev.page === 1) return prev
      return {
        ...prev,
        categoryBpjs: value || undefined,
        page: 1
      }
    })
  }, [])

  const handleProcedurePageChange = useCallback((page: number, pageSize: number) => {
    setProcedureQuery((prev) => {
      if (prev.page === page && prev.items === pageSize) return prev
      return {
        ...prev,
        page,
        items: pageSize
      }
    })
  }, [])

  const handlePaketSearchChange = useCallback((value: string) => {
    setSearchPaket(value)
    setPaketQuery((prev) => {
      const normalized = value.trim()
      if ((prev.q || '') === normalized && prev.page === 1) return prev
      return {
        ...prev,
        q: normalized || undefined,
        page: 1
      }
    })
  }, [])

  const handlePaketPageChange = useCallback((page: number, pageSize: number) => {
    setPaketQuery((prev) => {
      if (prev.page === page && prev.items === pageSize) return prev
      return {
        ...prev,
        page,
        items: pageSize
      }
    })
  }, [])

  const handlePaketKategoriChange = useCallback((value?: string) => {
    setPaketQuery((prev) => {
      if ((prev.kategoriPaket || undefined) === (value || undefined) && prev.page === 1) return prev
      return {
        ...prev,
        kategoriPaket: value || undefined,
        page: 1
      }
    })
  }, [])

  const handlePaketKategoriBpjsChange = useCallback((value?: string) => {
    setPaketQuery((prev) => {
      if ((prev.kategoriBpjs || undefined) === (value || undefined) && prev.page === 1) return prev
      return {
        ...prev,
        kategoriBpjs: value || undefined,
        page: 1
      }
    })
  }, [])

  const handlePaketStatusChange = useCallback((value?: string) => {
    setPaketQuery((prev) => {
      if ((prev.status || undefined) === (value || undefined) && prev.page === 1) return prev
      return {
        ...prev,
        status: value || undefined,
        page: 1
      }
    })
  }, [])

  const procedureCategoryOptions = useMemo(() => {
    const categories = new Set<string>()
    Object.values(masterTindakanCache).forEach((item) => {
      const kategori = String(item.kategoriTindakan || '').trim()
      if (kategori) categories.add(kategori)
    })
    masterTindakanList.forEach((item) => {
      const kategori = String(item.kategoriTindakan || '').trim()
      if (kategori) categories.add(kategori)
    })
    return Array.from(categories)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: value }))
  }, [masterTindakanCache, masterTindakanList])

  const masterTindakanDisplayList = useMemo(() => {
    const map = new Map<number, MasterTindakanItem>()
    Object.values(masterTindakanCache).forEach((item) => {
      const id = Number(item.id)
      if (!Number.isFinite(id) || id <= 0) return
      map.set(id, item)
    })
    masterTindakanList.forEach((item) => {
      const id = Number(item.id)
      if (!Number.isFinite(id) || id <= 0) return
      map.set(id, item)
    })
    return Array.from(map.values())
  }, [masterTindakanCache, masterTindakanList])

  const { data: paketListResult, isLoading: isLoadingPaket } = useMasterPaketTindakanListPaged({
    page: paketQuery.page,
    items: paketQuery.items,
    q: paketQuery.q,
    kategoriPaket: paketQuery.kategoriPaket,
    kategoriBpjs: paketQuery.kategoriBpjs,
    status: paketQuery.status,
    isPaketOk: false,
    depth: 1
  })
  const paketList = paketListResult?.rows ?? []
  const paketPagination = paketListResult?.pagination

  const paketKategoriOptions = useMemo(() => {
    const set = new Set<string>(MASTER_PAKET_KATEGORI_BASE_OPTIONS)
    paketList.forEach((paket) => {
      const kategori = String((paket as any)?.kategoriPaket || '').trim()
      if (kategori) set.add(kategori)
    })
    Object.values(paketCache).forEach((paket: any) => {
      const kategori = String(paket?.kategoriPaket || '').trim()
      if (kategori) set.add(kategori)
    })
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }))
  }, [paketCache, paketList])

  const paketKategoriBpjsOptions = useMemo(() => {
    const set = new Set<string>(MASTER_PAKET_KATEGORI_BPJS_BASE_OPTIONS)
    paketList.forEach((paket) => {
      const kategori = String((paket as any)?.kategoriBpjs || '').trim()
      if (kategori) set.add(kategori)
    })
    Object.values(paketCache).forEach((paket: any) => {
      const kategori = String(paket?.kategoriBpjs || '').trim()
      if (kategori) set.add(kategori)
    })
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value }))
  }, [paketCache, paketList])

  useEffect(() => {
    if (!Array.isArray(paketList) || paketList.length === 0) return

    setPaketCache((prev) => {
      const next = { ...prev }
      paketList.forEach((paket) => {
        const id = Number(paket?.id)
        if (Number.isFinite(id) && id > 0) {
          next[id] = paket
        }
      })
      return next
    })
  }, [paketList])

  const { data: paketBhpList = [], isLoading: isLoadingPaketBhp } = useMasterPaketBhpList({
    q: searchPaketBhp || undefined,
    items: 10,
    depth: 1
  })

  useEffect(() => {
    if (!Array.isArray(paketBhpList) || paketBhpList.length === 0) return

    setPaketBhpCache((prev) => {
      const next = { ...prev }
      paketBhpList.forEach((paket) => {
        const id = Number(paket?.id)
        if (Number.isFinite(id) && id > 0) {
          next[id] = paket
        }
      })
      return next
    })
  }, [paketBhpList])

  const { data: consumableItems = [], isLoading: isLoadingConsumableItems } = useQuery({
    queryKey: ['item', 'list-for-detail-tindakan'],
    queryFn: async (): Promise<ItemAttributes[]> => {
      const fn = window.api?.query?.item?.list as any
      if (!fn) throw new Error('API master item tidak tersedia')

      const res = await fn({ items: 2000, depth: 1 })
      if (!res.success) {
        throw new Error(res.message || res.error || 'Gagal mengambil data item')
      }

      return (Array.isArray(res.result) ? res.result : []) as ItemAttributes[]
    },
    staleTime: 5 * 60 * 1000
  })

  // Resolve Doctor Location
  const session = useModuleScopeStore((state) => state.session)

  const { data: myEmployeeData } = useQuery({
    queryKey: ['kepegawaian', 'getById', profile?.id],
    queryFn: async () => {
      const api = (window.api?.query as any)?.kepegawaian
      const pid = Number(profile?.id)
      if (!api?.getById || !Number.isFinite(pid) || pid <= 0) return null
      const res = await api.getById({ id: pid })
      const plain = (res?.result ?? res?.data ?? null) as any
      return plain || null
    },
    enabled: Number.isFinite(Number(profile?.id))
  })

  const { data: lokasiKerjaFromSession } = useQuery({
    queryKey: ['lokasiKerja', 'by-id', session?.lokasiKerjaId],
    queryFn: async () => {
      const api = (window.api?.query as any)?.lokasiKerja
      const id = Number(session?.lokasiKerjaId)
      if (!api?.read || !Number.isFinite(id) || id <= 0) return null
      const res = await api.read({ id })
      const plain = (res?.result ?? res?.data ?? null) as any
      if (!plain) return null
      return {
        id: Number(plain.id),
        kode: String(plain.kode || '')
          .trim()
          .toUpperCase(),
        nama: String(plain.nama || '')
      }
    },
    enabled: !!session?.lokasiKerjaId
  })

  const currentWorkLocation = useMemo(() => {
    try {
      if (lokasiKerjaFromSession?.kode) {
        return lokasiKerjaFromSession.kode
      }
      if (myEmployeeData) {
        const contracts = Array.isArray(myEmployeeData.kontrakPegawai)
          ? myEmployeeData.kontrakPegawai
          : []
        const active = contracts[0] // list.ts sorts by date desc
        if (active?.kodeLokasiKerja) return String(active.kodeLokasiKerja).trim().toUpperCase()
        if (active?.lokasiKerja?.kode) return String(active.lokasiKerja.kode).trim().toUpperCase()
      }
    } catch {
      /* empty */
    }
    return 'GUDANG' // fallback
  }, [lokasiKerjaFromSession, myEmployeeData])

  // Fetch Stock for Doctor Location
  const { data: locationStockData } = useQuery({
    queryKey: ['inventoryStock', 'by-location', currentWorkLocation],
    queryFn: async () => {
      const api = (window.api?.query as any)?.inventoryStock
      const fn = api?.listByLocation
      console.log(
        '[BHP][Debug] call by-location, fn exists:',
        !!fn,
        'kodeLokasi:',
        currentWorkLocation
      )
      if (!fn) return null
      let res: any = null
      try {
        res = await fn({
          kodeLokasi: String(currentWorkLocation || '')
            .trim()
            .toUpperCase(),
          items: 1000
        })
      } catch (e) {
        console.error('[BHP][Debug] by-location error:', e)
        return null
      }
      console.log('[BHP][Debug] by-location response:', res)
      if (res && typeof res === 'object') {
        if (res.success === true && Array.isArray(res.result)) return res.result
        if (Array.isArray((res as any).data)) return (res as any).data
      }
      if (Array.isArray(res)) return res
      return null
    },
    enabled: !!currentWorkLocation && String(currentWorkLocation).trim().length > 0
  })

  const locationStockByItemMap = useMemo(() => {
    const map = new Map<string, number>()
    try {
      const locs = Array.isArray(locationStockData) ? locationStockData : []
      const target = String(currentWorkLocation || '')
        .trim()
        .toUpperCase()
      const current =
        (locs[0] as any) ||
        locs.find(
          (l: any) =>
            String(l?.kodeLokasi || '')
              .trim()
              .toUpperCase() === target
        )
      const items = Array.isArray(current?.items) ? current.items : []
      items.forEach((it: any) => {
        const kode = String(it.kodeItem || '')
          .trim()
          .toUpperCase()
        if (kode) map.set(kode, Number(it.availableStock || 0))
      })
    } catch (err) {
      console.error('[BHP][Debug] Error build map:', err)
    }
    return map
  }, [locationStockData, currentWorkLocation])

  const { data: fallbackBatchStocks } = useQuery({
    queryKey: [
      'inventoryStock',
      'batches-by-location',
      currentWorkLocation,
      (consumableItems || []).map((i) => i.kode).join(',')
    ],
    queryFn: async () => {
      const api = (window.api?.query as any)?.inventoryStock
      const fn = api?.listBatchesByLocation
      const kodeLokasi = String(currentWorkLocation || '')
        .trim()
        .toUpperCase()
      if (!fn || !kodeLokasi) return null
      const codes = (consumableItems || [])
        .map((it) =>
          String(it.kode || '')
            .trim()
            .toUpperCase()
        )
        .filter((s) => !!s)
      const out: Record<string, number> = {}
      for (const kodeItem of codes.slice(0, 100)) {
        try {
          const res = await fn({ kodeItem, kodeLokasi })
          const arr = Array.isArray((res as any)?.result)
            ? (res as any).result
            : Array.isArray(res)
              ? (res as any)
              : []
          const total = arr.reduce((sum: number, b: any) => sum + Number(b?.availableStock || 0), 0)
          out[kodeItem] = total
        } catch (e) {
          console.warn('[BHP][Debug] fallback listBatchesByLocation error for', kodeItem, e)
        }
      }
      return out
    },
    enabled:
      !locationStockData || (Array.isArray(locationStockData) && locationStockData.length === 0)
  })

  const fallbackStockByItemMap = useMemo(() => {
    const map = new Map<string, number>()
    try {
      const obj = fallbackBatchStocks as Record<string, number> | null
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([kode, qty]) => {
          const key = String(kode || '')
            .trim()
            .toUpperCase()
          if (key) map.set(key, Number(qty || 0))
        })
      }
    } catch {
      /* empty */
    }
    return map
  }, [fallbackBatchStocks])

  const stockByItemMap = useMemo(() => {
    return locationStockByItemMap.size > 0 ? locationStockByItemMap : fallbackStockByItemMap
  }, [locationStockByItemMap, fallbackStockByItemMap])

  const allowedItemIdSet = useMemo(() => {
    const set = new Set<number>()
    try {
      const locs = Array.isArray(locationStockData) ? locationStockData : []
      const target = String(currentWorkLocation || '')
        .trim()
        .toUpperCase()
      const current =
        (locs[0] as any) ||
        locs.find(
          (l: any) =>
            String(l?.kodeLokasi || '')
              .trim()
              .toUpperCase() === target
        )
      const items = Array.isArray(current?.items) ? current.items : []
      items.forEach((it: any) => {
        const idVal = Number(it.itemId ?? it.id)
        if (Number.isFinite(idVal) && idVal > 0) set.add(idVal)
      })
    } catch {
      /* empty */
    }
    return set
  }, [locationStockData, currentWorkLocation])

  useEffect(() => {
    console.log('[BHP][Debug] profile:', profile)
    console.log('[BHP][Debug] myEmployeeData:', myEmployeeData)
    console.log('[BHP][Debug] session:', session)
    console.log('[BHP][Debug] lokasiKerjaFromSession:', lokasiKerjaFromSession)
    console.log('[BHP][Debug] currentWorkLocation:', currentWorkLocation)
    console.log('[BHP][Debug] locationStockData:', locationStockData)
  }, [profile, myEmployeeData, currentWorkLocation, locationStockData])

  const { data: listJenisKomponen = [] } = useMasterJenisKomponenList({
    isUntukMedis: true,
    items: 500
  })

  const roleOptions = useMemo(() => {
    return listJenisKomponen.map((j) => ({
      label: j.label,
      value: j.kode
    }))
  }, [listJenisKomponen])

  const currentTindakanList = Form.useWatch('tindakanList', modalForm)
  const paketEntriesWatcher = Form.useWatch('paketEntries', modalForm)
  const assessmentDateWatcher = Form.useWatch('assessment_date', modalForm)

  const getDetailMasterTindakan = (detail: any) =>
    detail?.masterTindakan ?? detail?.tindakan ?? null
  const getPaketTindakanItems = (paket: any): PaketDetailItem[] => {
    if (Array.isArray(paket?.listTindakan)) return paket.listTindakan
    if (Array.isArray(paket?.detailItems)) return paket.detailItems
    return []
  }
  const getPaketBhpItems = (paket: any): PaketBhpItem[] => {
    if (Array.isArray(paket?.listBHP)) return paket.listBHP

    return getPaketTindakanItems(paket).flatMap((detail) => {
      const bhpList = Array.isArray(detail?.bhpList) ? detail.bhpList : []
      return bhpList.map((bhp) => ({
        ...bhp,
        paketDetailId: bhp?.paketDetailId ?? detail?.id,
        masterTindakanId: detail?.masterTindakanId,
        tindakan: detail?.tindakan ?? detail?.masterTindakan ?? null
      }))
    })
  }
  const consumableItemMap = useMemo(
    () => new Map(consumableItems.map((item) => [Number(item.id), item])),
    [consumableItems]
  )

  useEffect(() => {
    try {
      const preview = (consumableItems || []).slice(0, 10).map((i) => ({
        id: i.id,
        kode: i.kode,
        nama: i.nama
      }))
      console.log(
        '[BHP][Debug] consumableItems preview:',
        preview,
        'total:',
        (consumableItems || []).length
      )
      const stockPreview = Array.from(stockByItemMap.entries()).slice(0, 10)
      console.log(
        '[BHP][Debug] stockByItemMap preview:',
        stockPreview,
        'size:',
        stockByItemMap.size
      )
    } catch (e) {
      console.log('[BHP][Debug] consumableItems log error:', e)
    }
  }, [consumableItems, stockByItemMap])

  const consumableItemOptions = useMemo((): ItemOption[] => {
    return (consumableItems || [])
      .filter((item) => item.itemGroupCode === 'G08') // Filter only BHP
      .map((item) => {
        const unitCodeRaw = typeof item.kodeUnit === 'string' ? item.kodeUnit : item.unit?.kode
        const unitCode = unitCodeRaw ? unitCodeRaw.trim().toUpperCase() : ''
        const unitName = item.unit?.nama ?? unitCode

        const code = typeof item.kode === 'string' ? item.kode.trim().toUpperCase() : ''
        const name = item.nama ?? code
        const displayName = name || code || String(item.id)
        const label = unitName ? `${displayName} (${unitName})` : displayName

        const categoryId =
          typeof item.itemCategoryId === 'number'
            ? item.itemCategoryId
            : (item.category?.id ?? null)
        const categoryType = item.category?.categoryType?.toLowerCase() || 'item'

        return {
          value: item.id as number,
          label,
          unitCode,
          categoryId,
          categoryType,
          itemCategoryCode: item.itemCategoryCode,
          itemGroupCode: item.itemGroupCode,
          fpktl: item.fpktl,
          prb: item.prb,
          oen: item.oen,
          sediaanId: item.sediaanId,
          peresepanMaksimal: item.peresepanMaksimal,
          restriksi: item.restriksi,
          kekuatan: item.kekuatan,
          satuanId: item.satuanId
        }
      })
  }, [consumableItems])

  const roleByKomponenId = useMemo(
    () => new Map((listJenisKomponen || []).map((item) => [Number(item.id), item.kode])),
    [listJenisKomponen]
  )

  const filteredPaketBhpOptions = useMemo(() => {
    return (paketBhpList || []).map((p: any) => {
      const listBhp = Array.isArray(p.listBhp) ? p.listBhp : []
      const missingFromLocation: string[] = []
      const outOfStock: string[] = []

      const noLocationStock = allowedItemIdSet.size === 0 && stockByItemMap.size === 0

      if (!noLocationStock && listBhp.length > 0) {
        for (const bhp of listBhp) {
          const item = consumableItemMap.get(Number(bhp.itemId))
          if (!item) {
            missingFromLocation.push(`ID:${bhp.itemId}`)
            continue
          }
          const kode = String(item.kode || '')
            .trim()
            .toUpperCase()
          const stock = stockByItemMap.get(kode)

          if (stock === undefined) {
            if (allowedItemIdSet.size > 0 && !allowedItemIdSet.has(Number(item.id))) {
              missingFromLocation.push(item.nama || '')
            } else if (allowedItemIdSet.size === 0) {
              missingFromLocation.push(item.nama || '')
            }
          } else if (stock <= 0) {
            outOfStock.push(item.nama || '')
          }
        }
      }

      let statusText = ''
      if (missingFromLocation.length > 0) {
        statusText = ` (Item tdk tersedia di lokasi: ${missingFromLocation.join(', ')})`
      } else if (outOfStock.length > 0) {
        statusText = ` (Stok habis: ${outOfStock.join(', ')})`
      }

      return {
        value: p.id,
        label: `${p.namaPaketBhp || 'Paket Tanpa Nama'}${statusText}`,
        disabled: statusText !== ''
      }
    })
  }, [paketBhpList, consumableItemMap, stockByItemMap, allowedItemIdSet])

  const filteredPaketOptions = useMemo(() => {
    return (paketList || []).map((p: any) => {
      const directBhp = Array.isArray(p.listBHP) ? p.listBHP : []
      const detailItems = Array.isArray(p.detailItems || p.listTindakan)
        ? p.detailItems || p.listTindakan
        : []
      const indirectBhp = detailItems.flatMap((di: any) =>
        Array.isArray(di.bhpList) ? di.bhpList : []
      )
      const allBhp = [...directBhp, ...indirectBhp]

      const missingFromLocation: string[] = []
      const outOfStock: string[] = []

      const noLocationStock = allowedItemIdSet.size === 0 && stockByItemMap.size === 0

      if (!noLocationStock && allBhp.length > 0) {
        for (const bhp of allBhp) {
          const item = consumableItemMap.get(Number(bhp.itemId))
          if (!item) {
            missingFromLocation.push(`ID:${bhp.itemId}`)
            continue
          }
          const kode = String(item.kode || '')
            .trim()
            .toUpperCase()
          const stock = stockByItemMap.get(kode)

          if (stock === undefined) {
            if (allowedItemIdSet.size > 0 && !allowedItemIdSet.has(Number(item.id))) {
              missingFromLocation.push(item.nama || '')
            } else if (allowedItemIdSet.size === 0) {
              missingFromLocation.push(item.nama || '')
            }
          } else if (stock <= 0) {
            outOfStock.push(item.nama || '')
          }
        }
      }

      let statusText = ''
      if (missingFromLocation.length > 0) {
        statusText = ` (Item tdk tersedia di lokasi: ${missingFromLocation.join(', ')})`
      } else if (outOfStock.length > 0) {
        statusText = ` (Stok habis: ${outOfStock.join(', ')})`
      }

      return {
        value: p.id,
        label: `${p.namaPaket}${statusText}`,
        disabled: statusText !== ''
      }
    })
  }, [paketList, consumableItemMap, stockByItemMap, allowedItemIdSet])

  const roleLabelByCode = useMemo(
    () => new Map((listJenisKomponen || []).map((item) => [item.kode, item.label])),
    [listJenisKomponen]
  )

  const pickTarifForKelasAndDate = useCallback(
    (
      tarifList: MasterTarifTindakanRef[],
      params: {
        kelas: string
        tanggal: string
        isCyto: boolean
      }
    ) => {
      return pickDetailTindakanTarifWithFallback(tarifList, {
        kelas: params.kelas,
        payerCategory: selectedPayerCategory,
        isCyto: params.isCyto,
        tanggal: params.tanggal
      })?.tarifRow
    },
    [selectedPayerCategory]
  )

  const pickPaketTarifForKelasAndDate = useCallback(
    (
      tarifList: PaketTarifHeaderRef[],
      params: {
        kelas: string
        tanggal: string
        isCyto: boolean
      }
    ) => {
      return pickDetailTindakanTarifWithFallback(tarifList, {
        kelas: params.kelas,
        payerCategory: selectedPayerCategory,
        isCyto: params.isCyto,
        tanggal: params.tanggal
      })?.tarifRow
    },
    [selectedPayerCategory]
  )

  const tarifResolutionAudit = useMemo(() => {
    const tanggal = assessmentDateWatcher
      ? dayjs(assessmentDateWatcher).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')

    const rows: TarifResolutionAuditRow[] = []

    ;(Array.isArray(currentTindakanList) ? currentTindakanList : [])
      .filter((item: any) => Number(item?.masterTindakanId) > 0 && String(item?.kelas || '').trim())
      .forEach((item: any, index: number) => {
        const tindakanId = Number(item.masterTindakanId)
        const detail = masterTindakanDetailCache[tindakanId]
        const kelas = String(item?.kelas || '').trim()
        const isCyto = Boolean(item?.cyto ?? false)

        const selection = Array.isArray(detail?.tarifList)
          ? pickDetailTindakanTarifWithFallback(detail.tarifList, {
              kelas,
              payerCategory: selectedPayerCategory,
              isCyto,
              tanggal
            })
          : null

        const source = selection?.source ?? 'missing'
        const tindakan = masterTindakanCache[tindakanId]
        const tindakanLabel = tindakan?.namaTindakan
          ? `[${tindakan.kodeTindakan}] ${tindakan.namaTindakan}`
          : `Tindakan ID ${tindakanId}`

        rows.push({
          key: `non-paket-${index}-${tindakanId}`,
          jenis: 'Non-Paket',
          item: tindakanLabel,
          kelas,
          requestedPayerCategory: selectedPayerCategory,
          resolvedPayerCategory: selection?.resolvedPayerCategory ?? null,
          source,
          isCyto
        })
      })
    ;(Array.isArray(paketEntriesWatcher) ? paketEntriesWatcher : [])
      .filter((entry: any) => Number(entry?.paketId) > 0 && String(entry?.kelas || '').trim())
      .forEach((entry: any, index: number) => {
        const paketId = Number(entry.paketId)
        const kelas = String(entry?.kelas || '').trim()
        const isCyto = resolveDetailTindakanPaketCyto(entry)
        const selectedPaket =
          paketCache[paketId] ?? paketList.find((p) => Number(p?.id) === paketId)
        const tarifList = Array.isArray(selectedPaket?.tarifList)
          ? (selectedPaket.tarifList as PaketTarifHeaderRef[])
          : []
        const selection =
          tarifList.length > 0
            ? pickDetailTindakanTarifWithFallback(tarifList, {
                kelas,
                payerCategory: selectedPayerCategory,
                isCyto,
                tanggal
              })
            : null

        const source = selection?.source ?? 'missing'
        const paketLabel = selectedPaket?.namaPaket
          ? `[${selectedPaket.kodePaket}] ${selectedPaket.namaPaket}`
          : `Paket ID ${paketId}`

        rows.push({
          key: `paket-${index}-${paketId}`,
          jenis: 'Paket',
          item: paketLabel,
          kelas,
          requestedPayerCategory: selectedPayerCategory,
          resolvedPayerCategory: selection?.resolvedPayerCategory ?? null,
          source,
          isCyto
        })
      })

    const exactCount = rows.filter((row) => row.source === 'exact').length
    const fallbackCount = rows.filter((row) => row.source === 'fallback_umum').length
    const missingCount = rows.filter((row) => row.source === 'missing').length
    const highlightedRows = rows.filter((row) => row.source !== 'exact')

    return {
      exactCount,
      fallbackCount,
      missingCount,
      highlightedRows
    }
  }, [
    assessmentDateWatcher,
    currentTindakanList,
    masterTindakanCache,
    masterTindakanDetailCache,
    paketCache,
    paketEntriesWatcher,
    paketList,
    selectedPayerCategory
  ])

  const resolveRolesFromTindakanItems = useCallback(
    (items: any[], kelas?: string | null, tanggal?: string) => {
      if (!Array.isArray(items) || items.length === 0 || !kelas || !tanggal) return []

      const roleSet = new Set<string>()

      items
        .filter((item) => Number(item?.masterTindakanId) > 0)
        .forEach((item) => {
          const tindakanId = Number(item.masterTindakanId)
          const detail = masterTindakanDetailCache[tindakanId]
          if (!detail || !Array.isArray(detail?.tarifList)) return

          const pickedTarif = pickTarifForKelasAndDate(detail.tarifList, {
            kelas,
            tanggal,
            isCyto: Boolean(item?.cyto ?? false)
          })
          const komponenList = Array.isArray(pickedTarif?.komponenList)
            ? pickedTarif.komponenList
            : []

          komponenList.forEach((komponen) => {
            const komponenId = Number(komponen?.jenisKomponenId)
            const isUntukMedis = komponen?.jenisKomponen?.isUntukMedis === true
            const fallbackKode = String(
              komponen?.kode || komponen?.jenisKomponen?.kode || ''
            ).trim()
            const roleKode = roleByKomponenId.get(komponenId) || (isUntukMedis ? fallbackKode : '')
            if (roleKode) roleSet.add(roleKode)
          })
        })

      return Array.from(roleSet)
    },
    [masterTindakanDetailCache, pickTarifForKelasAndDate, roleByKomponenId]
  )

  const resolveRolesFromPaketEntry = useCallback(
    (entry: any, tanggal?: string) => {
      if (!entry?.paketId || !entry?.kelas || !tanggal) return []

      const paketId = Number(entry.paketId)
      if (!Number.isFinite(paketId) || paketId <= 0) return []
      const entryItems = Array.isArray(entry?.tindakanList) ? entry.tindakanList : []
      const isPaketCyto = resolveDetailTindakanPaketCyto(entry)

      const selectedPaket = paketCache[paketId] ?? paketList.find((p) => Number(p?.id) === paketId)
      const tarifList = Array.isArray(selectedPaket?.tarifList)
        ? (selectedPaket.tarifList as PaketTarifHeaderRef[])
        : []
      if (tarifList.length === 0) return []

      const pickedTarif = pickPaketTarifForKelasAndDate(tarifList, {
        kelas: String(entry?.kelas || ''),
        tanggal,
        isCyto: isPaketCyto
      })

      if (!pickedTarif) return []

      const entryDetailIds = new Set<number>(
        entryItems
          .map((item: any) => Number(item?.paketDetailId))
          .filter((id: number) => Number.isFinite(id) && id > 0)
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
    [paketCache, paketList, pickPaketTarifForKelasAndDate, roleByKomponenId]
  )

  useEffect(() => {
    const allIds = new Set<number>()

    ;(Array.isArray(currentTindakanList) ? currentTindakanList : []).forEach((item: any) => {
      const id = Number(item?.masterTindakanId)
      if (Number.isFinite(id) && id > 0) allIds.add(id)
    })
    ;(Array.isArray(paketEntriesWatcher) ? paketEntriesWatcher : []).forEach((entry: any) => {
      ;(Array.isArray(entry?.tindakanList) ? entry.tindakanList : []).forEach((item: any) => {
        const id = Number(item?.masterTindakanId)
        if (Number.isFinite(id) && id > 0) allIds.add(id)
      })
    })

    const missingIds = Array.from(allIds).filter(
      (id) => !Object.prototype.hasOwnProperty.call(masterTindakanDetailCache, id)
    )
    if (missingIds.length === 0) return

    const fn = window.api?.query?.masterTindakan?.getById
    if (!fn) return

    let cancelled = false

    ;(async () => {
      const entries = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const res = await fn({ id })
            if (!res?.success) return [id, null] as const
            const payload = (res as any)?.result?.result ?? (res as any)?.result ?? null
            return [id, payload as MasterTindakanDetailRef | null] as const
          } catch {
            return [id, null] as const
          }
        })
      )

      if (cancelled) return

      setMasterTindakanDetailCache((prev) => {
        const next = { ...prev }
        entries.forEach(([id, data]) => {
          next[id] = data
        })
        return next
      })
    })()

    return () => {
      cancelled = true
    }
  }, [currentTindakanList, masterTindakanDetailCache, paketEntriesWatcher])

  useEffect(() => {
    const tanggal = assessmentDateWatcher
      ? dayjs(assessmentDateWatcher).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')

    const items = Array.isArray(currentTindakanList) ? currentTindakanList : []
    if (items.length === 0) return

    let hasChanges = false
    const nextItems = items.map((item: any) => {
      if (!item?.masterTindakanId || !item?.kelas) return item

      const roles = resolveRolesFromTindakanItems([item], item.kelas, tanggal)
      const existingPetugas = Array.isArray(item?.petugasList) ? item.petugasList : []

      const nextPetugas = roles.map((roleKode) => {
        let pegawaiId = existingPetugas.find((p: any) => p?.roleTenaga === roleKode)?.pegawaiId
        if (!pegawaiId) {
          pegawaiId = initialPetugas.find((p) => p?.roleTenaga === roleKode)?.pegawaiId
        }
        return { roleTenaga: roleKode, pegawaiId }
      })

      const currentSignature = JSON.stringify(
        existingPetugas.map((p: any) => ({ roleTenaga: p?.roleTenaga, pegawaiId: p?.pegawaiId }))
      )
      const nextSignature = JSON.stringify(
        nextPetugas.map((p) => ({ roleTenaga: p?.roleTenaga, pegawaiId: p?.pegawaiId }))
      )

      if (currentSignature !== nextSignature) {
        hasChanges = true
        return { ...item, petugasList: nextPetugas }
      }
      return item
    })

    if (hasChanges) {
      modalForm.setFieldValue('tindakanList', nextItems)
    }
  }, [
    assessmentDateWatcher,
    currentTindakanList,
    masterTindakanDetailCache,
    modalForm,
    resolveRolesFromTindakanItems,
    roleByKomponenId,
    initialPetugas
  ])

  useEffect(() => {
    const entries = Array.isArray(paketEntriesWatcher) ? paketEntriesWatcher : []
    if (entries.length === 0) return

    const tanggal = assessmentDateWatcher
      ? dayjs(assessmentDateWatcher).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')
    let hasChanges = false

    const nextEntries = entries.map((entry: any) => {
      const entryItems = Array.isArray(entry?.tindakanList) ? entry.tindakanList : []
      const rolesFromPaket = resolveRolesFromPaketEntry(entry, tanggal)
      const rolesFromTindakan = resolveRolesFromTindakanItems(entryItems, entry?.kelas, tanggal)
      const roles = Array.from(new Set([...rolesFromPaket, ...rolesFromTindakan]))
      const existingPetugas = Array.isArray(entry?.petugasList) ? entry.petugasList : []

      const nextPetugas = roles.map((roleKode) => {
        let pegawaiId = existingPetugas.find((p: any) => p?.roleTenaga === roleKode)?.pegawaiId
        if (!pegawaiId && initialPaketPetugas[entry.paketId]) {
          pegawaiId = initialPaketPetugas[entry.paketId].find(
            (p: any) => p?.roleTenaga === roleKode
          )?.pegawaiId
        }
        return { roleTenaga: roleKode, pegawaiId }
      })

      const currentSignature = JSON.stringify(
        existingPetugas.map((item: any) => ({
          roleTenaga: item?.roleTenaga,
          pegawaiId: item?.pegawaiId
        }))
      )
      const nextSignature = JSON.stringify(
        nextPetugas.map((item) => ({ roleTenaga: item?.roleTenaga, pegawaiId: item?.pegawaiId }))
      )
      if (currentSignature !== nextSignature) {
        hasChanges = true
        return {
          ...entry,
          petugasList: nextPetugas
        }
      }
      return entry
    })

    if (hasChanges) {
      modalForm.setFieldValue('paketEntries', nextEntries)
    }
  }, [
    assessmentDateWatcher,
    masterTindakanDetailCache,
    modalForm,
    paketCache,
    paketList,
    paketEntriesWatcher,
    roleByKomponenId,
    resolveRolesFromPaketEntry,
    resolveRolesFromTindakanItems,
    initialPaketPetugas
  ])

  const tindakanOptions = useMemo(() => {
    const list = masterTindakanDisplayList.map((t) => ({
      value: t.id,
      label: `[${t.kodeTindakan}] ${t.namaTindakan}${t.kategoriTindakan ? ` — ${t.kategoriTindakan}` : ''}`
    }))

    if (currentTindakanList) {
      currentTindakanList.forEach((item: any) => {
        const tindakan = getDetailMasterTindakan(item)
        if (tindakan && !list.some((opt) => opt.value === item.masterTindakanId)) {
          list.push({
            value: item.masterTindakanId,
            label: `[${tindakan.kodeTindakan}] ${tindakan.namaTindakan}${tindakan.kategoriTindakan ? ` — ${tindakan.kategoriTindakan}` : ''}`
          })
        }
      })
    }

    if (paketList) {
      paketList.forEach((paket) => {
        getPaketTindakanItems(paket).forEach((detail) => {
          const tindakan = getDetailMasterTindakan(detail)
          if (tindakan && !list.some((opt) => opt.value === detail.masterTindakanId)) {
            list.push({
              value: detail.masterTindakanId,
              label: `[${tindakan.kodeTindakan}] ${tindakan.namaTindakan}${tindakan.kategoriTindakan ? ` — ${tindakan.kategoriTindakan}` : ''}`
            })
          }
        })
      })
    }
    return list
  }, [masterTindakanDisplayList, paketList, currentTindakanList])

  const paketOptions = useMemo(() => {
    const optionMap = new Map<number, any>()
    paketList.forEach((paket) => {
      optionMap.set(Number(paket.id), paket)
    })

    if (Array.isArray(paketEntriesWatcher)) {
      paketEntriesWatcher.forEach((entry: any) => {
        const numId = Number(entry?.paketId)
        if (!Number.isFinite(numId) || numId <= 0) return
        const cached = paketCache[numId]
        if (cached) optionMap.set(numId, cached)
      })
    }

    return Array.from(optionMap.values()).map((p) => ({
      value: p.id,
      label: `[${p.kodePaket}] ${p.namaPaket}${p.kategoriPaket ? ` — ${p.kategoriPaket}` : ''}`
    }))
  }, [paketList, paketCache, paketEntriesWatcher])

  const { data: tindakanList = [], isLoading: isLoadingList } =
    useDetailTindakanByEncounter(encounterId)

  const createMutation = useCreateDetailTindakan(encounterId)
  const updateMutation = useUpdateDetailTindakan(encounterId)
  const voidMutation = useVoidDetailTindakan(encounterId)

  const normalizeToValidKelas = useCallback(
    (value: unknown): string => {
      const normalized = normalizeKelasTarifValue(value)
      return kelasOptions.some((opt) => opt.value === normalized) ? normalized : ''
    },
    [kelasOptions]
  )

  const resolveEncounterDefaultKelas = useCallback((): string => {
    const candidates = [
      patientData?.encounter?.kelasId,
      patientData?.kelasTarif,
      patientData?.kelas?.id
    ]

    for (const candidate of candidates) {
      const normalized = normalizeToValidKelas(candidate)
      if (normalized) return normalized
    }

    return DEFAULT_TARIF_KELAS_CODE
  }, [normalizeToValidKelas, patientData])

  const mergeBhpList = (existingBhpList: any[], incomingBhpList: any[]) => {
    const merged = new Map<
      string,
      { itemId: number; jumlah: number; satuan?: string; includedInPaket: boolean }
    >()

    const pushBhp = (raw: any) => {
      const itemId = Number(raw?.itemId)
      if (!Number.isFinite(itemId) || itemId <= 0) return

      const rawJumlah = Number(raw?.jumlah ?? raw?.jumlahDefault ?? 1)
      const jumlah = Math.max(1, Math.round(rawJumlah || 1))

      const selectedItem = consumableItemMap.get(itemId)
      const satuan = raw?.satuan ?? selectedItem?.kodeUnit ?? undefined
      const includedInPaket =
        typeof raw?.includedInPaket === 'boolean' ? raw.includedInPaket : false
      const key = `${itemId}__${includedInPaket ? 1 : 0}__${String(satuan ?? '').toUpperCase()}`

      const current = merged.get(key)
      if (current) {
        current.jumlah += jumlah
        return
      }

      merged.set(key, { itemId, jumlah, satuan, includedInPaket })
    }

    ;(existingBhpList || []).forEach(pushBhp)
    ;(incomingBhpList || []).forEach(pushBhp)

    return Array.from(merged.values())
  }

  const handlePaketEntryChange = (entryIndex: number, rawPaketId?: number) => {
    const currentEntries = modalForm.getFieldValue('paketEntries') || []
    const entryKelas =
      normalizeToValidKelas(currentEntries?.[entryIndex]?.kelas) ||
      normalizeToValidKelas(modalForm.getFieldValue('kelas')) ||
      DEFAULT_TARIF_KELAS_CODE
    const paketId = Number(rawPaketId)
    if (!Number.isFinite(paketId) || paketId <= 0) {
      modalForm.setFieldsValue({
        paketEntries: currentEntries.map((entry: any, idx: number) =>
          idx === entryIndex
            ? {
                ...entry,
                paketId: undefined,
                tindakanList: [],
                bhpList: []
              }
            : entry
        )
      })
      return
    }

    const selected = paketCache[paketId] ?? paketList.find((p) => Number(p.id) === paketId)
    if (!selected) {
      message.warning('Data paket belum termuat. Coba cari ulang paket lalu pilih lagi.')
      return
    }

    const cytoGlobal = Boolean(
      modalForm.getFieldValue(['paketEntries', entryIndex, 'paketCytoGlobal']) ?? false
    )
    const tindakanItems = getPaketTindakanItems(selected)
    const bhpItems = getPaketBhpItems(selected)

    const mappedTindakan = tindakanItems.map((d) => {
      const tindakan = getDetailMasterTindakan(d)
      return {
        masterTindakanId: d.masterTindakanId,
        kelas: entryKelas || normalizeToValidKelas((d as any)?.kelas) || DEFAULT_TARIF_KELAS_CODE,
        paketId: Number(selected.id),
        paketDetailId: d.id,
        jumlah: Number(d.qty ?? 1),
        satuan: d.satuan,
        masterTindakan: tindakan,
        cyto: cytoGlobal
      }
    })

    const mappedBhp = mergeBhpList(
      [],
      bhpItems
        .filter((bhp) => Number(bhp?.itemId) > 0)
        .map((bhp) => ({
          itemId: Number(bhp.itemId),
          jumlah: Number(bhp.jumlahDefault ?? 1),
          satuan: bhp.satuan ?? consumableItemMap.get(Number(bhp.itemId))?.kodeUnit ?? undefined,
          includedInPaket: typeof bhp.includedInPaket === 'boolean' ? bhp.includedInPaket : true
        }))
    )

    currentEntries[entryIndex] = {
      ...(currentEntries[entryIndex] || {}),
      paketId: Number(selected.id),
      tindakanList: mappedTindakan,
      bhpList: mappedBhp
    }
    modalForm.setFieldValue('paketEntries', [...currentEntries])
    message.success(`Paket dimuat: ${mappedTindakan.length} tindakan dan ${mappedBhp.length} BHP`)
  }

  const buildTindakanData = (values: any) => {
    const tanggal = values.assessment_date
      ? values.assessment_date.format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')

    const mapBhpList = (rawBhpList: any[], defaultIncludedInPaket: boolean) =>
      (Array.isArray(rawBhpList) ? rawBhpList : [])
        .filter((bhp: any) => bhp?.itemId && Number(bhp?.jumlah) > 0)
        .map((bhp: any) => {
          const selectedItem = consumableItemMap.get(Number(bhp.itemId))
          return {
            itemId: Number(bhp.itemId),
            jumlah: Number(bhp.jumlah),
            satuan: bhp.satuan ?? selectedItem?.kodeUnit ?? undefined,
            includedInPaket:
              typeof bhp.includedInPaket === 'boolean'
                ? bhp.includedInPaket
                : defaultIncludedInPaket
          }
        })

    const globalPetugasMap = new Map<string, number>()
    if (Array.isArray(values.paketEntries)) {
      for (const entry of values.paketEntries) {
        if (Array.isArray(entry.petugasList)) {
          for (const p of entry.petugasList) {
            if (p?.roleTenaga && p?.pegawaiId) globalPetugasMap.set(p.roleTenaga, p.pegawaiId)
          }
        }
      }
    }
    if (Array.isArray(values.tindakanList)) {
      for (const item of values.tindakanList) {
        if (Array.isArray(item.petugasList)) {
          for (const p of item.petugasList) {
            if (p?.roleTenaga && p?.pegawaiId) globalPetugasMap.set(p.roleTenaga, p.pegawaiId)
          }
        }
      }
    }
    const petugasList = Array.from(globalPetugasMap.entries()).map(([roleTenaga, pegawaiId]) => ({
      roleTenaga,
      pegawaiId
    }))

    const tindakanPaketList = (
      Array.isArray(values?.paketEntries) ? values.paketEntries : []
    ).flatMap((entry: any) => {
      const entryItems = Array.isArray(entry?.tindakanList) ? entry.tindakanList : []
      return entryItems
        .filter((item: any) => item?.masterTindakanId)
        .map((item: any) => ({
          masterTindakanId: item.masterTindakanId,
          paketId: item.paketId,
          paketDetailId: item.paketDetailId,
          kelas: item?.kelas ?? entry?.kelas ?? null,
          jumlah: item.jumlah ?? 1,
          satuan: item.satuan,
          cyto: item.cyto ?? false
        }))
    })

    const tindakanSatuanList = (Array.isArray(values?.tindakanList) ? values.tindakanList : [])
      .filter((item: any) => item?.masterTindakanId)
      .map((item: any) => ({
        masterTindakanId: item.masterTindakanId,
        kelas: item?.kelas ?? values?.kelas ?? null,
        jumlah: item.jumlah ?? 1,
        satuan: item.satuan,
        cyto: item.cyto ?? false,
        catatanTambahan: item.catatanTambahan || undefined
      }))

    const bhpPaketList = (
      Array.isArray(values?.paketBhpEntries) ? values.paketBhpEntries : []
    ).flatMap((entry: any) => {
      const itemLists = Array.isArray(entry?.bhpList) ? entry.bhpList : []
      const entryJumlah = Number(entry?.jumlah || 1)
      return itemLists
        .filter((item: any) => item?.itemId && Number(item.jumlah) > 0)
        .map((item: any) => ({
          paketBhpId: entry.paketBhpId,
          paketBhpDetailId: item.paketBhpDetailId ?? 0,
          itemId: item.itemId,
          jumlah: Number(item.jumlah) * entryJumlah,
          satuan: item.satuan
        }))
    })

    const aggregatedBhpSatuanMap = new Map<string, any>()
    const pushBhpSatuan = (bhp: any) => {
      const key = `${bhp.itemId}-${bhp.includedInPaket}-${bhp.satuan ?? ''}`
      if (aggregatedBhpSatuanMap.has(key)) {
        aggregatedBhpSatuanMap.get(key).jumlah += bhp.jumlah
      } else {
        aggregatedBhpSatuanMap.set(key, bhp)
      }
    }

    mapBhpList(values?.bhpList, false).forEach(pushBhpSatuan)
    if (Array.isArray(values?.paketEntries)) {
      values.paketEntries.forEach((entry: any) => {
        mapBhpList(entry?.bhpList, true).forEach(pushBhpSatuan)
      })
    }

    return {
      encounterId,
      patientId,
      tanggalTindakan: tanggal,
      cyto: Boolean(values.cytoGlobal),
      catatanTambahan: values.catatanTambahan,
      petugasList,
      tindakanPaketList,
      tindakanSatuanList,
      bhpSatuanList: Array.from(aggregatedBhpSatuanMap.values()),
      bhpPaketList
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const paketEntries = Array.isArray(values?.paketEntries) ? values.paketEntries : []
      const missingKelasIdx = paketEntries.findIndex((entry: any) => {
        const hasEntryTindakan = (
          Array.isArray(entry?.tindakanList) ? entry.tindakanList : []
        ).some((item: any) => item?.masterTindakanId)
        if (!hasEntryTindakan) return false
        return !entry?.kelas
      })
      if (missingKelasIdx >= 0) {
        setActiveInputTab('paket')
        message.error(`Kelas wajib dipilih pada Paket #${missingKelasIdx + 1}`)
        return
      }

      const missingPetugasIdx = paketEntries.findIndex((entry: any) => {
        const hasEntryTindakan = (
          Array.isArray(entry?.tindakanList) ? entry.tindakanList : []
        ).some((item: any) => item?.masterTindakanId)
        if (!hasEntryTindakan) return false
        const entryPetugas = (entry?.petugasList ?? []).filter(
          (p: any) => p?.pegawaiId && p?.roleTenaga
        )
        return entryPetugas.length === 0
      })
      if (missingPetugasIdx >= 0) {
        setActiveInputTab('paket')
        message.error(
          `Role tenaga medis belum tersedia pada Paket #${missingPetugasIdx + 1}. Pastikan tindakan di kelas terpilih memiliki komponen jasa medis, lalu isi nama petugas.`
        )
        return
      }

      const invalidBhpPaketIdx = paketEntries.findIndex((entry: any) =>
        (Array.isArray(entry?.bhpList) ? entry.bhpList : []).some(
          (bhp: any) =>
            bhp?.itemId &&
            (!Number.isFinite(Number(bhp?.jumlah)) ||
              Number(bhp.jumlah) <= 0 ||
              !Number.isInteger(Number(bhp.jumlah)))
        )
      )
      if (invalidBhpPaketIdx >= 0) {
        setActiveInputTab('paket')
        message.error(
          `Jumlah BHP pada Paket #${invalidBhpPaketIdx + 1} harus bilangan bulat (1, 2, 3, ...).`
        )
        return
      }

      const nonPaketItems = Array.isArray(values?.tindakanList) ? values.tindakanList : []
      const hasNonPaketTindakan = nonPaketItems.some((item: any) => item?.masterTindakanId)
      const nonPaketBhp = Array.isArray(values?.bhpList) ? values.bhpList : []
      const hasNonPaketBhp = nonPaketBhp.some((bhp: any) => bhp?.itemId)

      const missingKelasNonPaketIdx = nonPaketItems.findIndex(
        (item: any) => item?.masterTindakanId && !item?.kelas
      )
      if (missingKelasNonPaketIdx >= 0) {
        setActiveInputTab('non-paket')
        message.error(`Kelas wajib dipilih pada Tindakan Non-Paket #${missingKelasNonPaketIdx + 1}`)
        return
      }

      const missingPetugasNonPaketIdx = nonPaketItems.findIndex((item: any) => {
        if (!item?.masterTindakanId) return false
        const itemPetugas = (item?.petugasList ?? []).filter(
          (p: any) => p?.pegawaiId && p?.roleTenaga
        )
        return itemPetugas.length === 0
      })
      if (missingPetugasNonPaketIdx >= 0) {
        setActiveInputTab('non-paket')
        message.error(
          `Role tenaga medis belum tersedia pada Tindakan Non-Paket #${missingPetugasNonPaketIdx + 1}. Pastikan tindakan di kelas terpilih memiliki komponen jasa medis, lalu isi nama petugas.`
        )
        return
      }

      if (hasNonPaketBhp && !hasNonPaketTindakan) {
        setActiveInputTab('bhp-non-paket')
        message.error('BHP non-paket hanya bisa disimpan jika ada minimal 1 tindakan non-paket')
        return
      }

      const invalidBhpQty = nonPaketBhp.some(
        (bhp: any) =>
          bhp?.itemId &&
          (!Number.isFinite(Number(bhp?.jumlah)) ||
            Number(bhp.jumlah) <= 0 ||
            !Number.isInteger(Number(bhp.jumlah)))
      )
      if (invalidBhpQty) {
        setActiveInputTab('bhp-non-paket')
        message.error('Jumlah BHP non-paket harus bilangan bulat (1, 2, 3, ...).')
        return
      }

      const sessionPayload = buildTindakanData(values)
      if (
        sessionPayload.tindakanPaketList.length === 0 &&
        sessionPayload.tindakanSatuanList.length === 0 &&
        sessionPayload.bhpSatuanList.length === 0 &&
        sessionPayload.bhpPaketList.length === 0
      ) {
        message.error('Minimal harus mencatat 1 tindakan atau BHP')
        return
      }

      if (tarifResolutionAudit.missingCount > 0) {
        message.warning(
          `${tarifResolutionAudit.missingCount} item belum memiliki varian tarif aktif dan berpotensi gagal saat simpan.`
        )
      }

      if (tarifResolutionAudit.fallbackCount > 0) {
        const shouldProceed = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: 'Konfirmasi Fallback Tarif',
            content: `${tarifResolutionAudit.fallbackCount} item tidak punya tarif ${selectedPayerCategory.toUpperCase()} dan akan memakai tarif UMUM. Lanjutkan simpan?`,
            okText: 'Ya, Simpan',
            cancelText: 'Batal',
            onOk: () => resolve(true),
            onCancel: () => resolve(false)
          })
        })
        if (!shouldProceed) return
      }

      if (editingId) {
        await updateMutation.mutateAsync({ ...sessionPayload, id: editingId } as any)
      } else {
        await createMutation.mutateAsync(sessionPayload as any)
      }

      const totalTindakan =
        sessionPayload.tindakanSatuanList.length + sessionPayload.tindakanPaketList.length
      const totalBhp = sessionPayload.bhpSatuanList.length + sessionPayload.bhpPaketList.length
      message.success(`${totalTindakan} tindakan dan ${totalBhp} BHP berhasil disimpan`)

      modalForm.resetFields()
      setIsModalOpen(false)
    } catch (err: any) {
      message.error(err?.message ?? 'Gagal menyimpan detail tindakan')
    }
  }

  const resolveInputTabByFieldName = (namePath: (string | number)[]): InputTabKey => {
    const rootName = String(namePath?.[0] ?? '')
    if (rootName === 'paketEntries') return 'paket'
    if (rootName === 'tindakanList') return 'non-paket'
    if (rootName === 'paketBhpEntries') return 'paket-bhp'
    if (rootName === 'bhpList') return 'bhp-non-paket'
    return 'paket'
  }

  const handleFormFinishFailed = (errorInfo: {
    errorFields?: Array<{ name: (string | number)[]; errors?: string[] }>
  }) => {
    const firstFieldWithError = (errorInfo?.errorFields || []).find(
      (field) => Array.isArray(field?.errors) && field.errors.length > 0
    )
    const targetTab = resolveInputTabByFieldName(firstFieldWithError?.name || [])
    setActiveInputTab(targetTab)

    const firstMessage =
      firstFieldWithError?.errors?.[0] || 'Periksa kembali data form yang wajib diisi.'
    message.error(`Validasi Form: ${firstMessage}`)

    if (Array.isArray(firstFieldWithError?.name) && firstFieldWithError.name.length > 0) {
      try {
        modalForm.scrollToField(firstFieldWithError.name)
      } catch {
        // noop
      }
    }
  }

  const handleOpenModal = () => {
    modalForm.resetFields()
    setEditingId(null)
    setInitialPetugas([])
    setInitialPaketPetugas({})
    setActiveInputTab('paket')
    const fallbackKelas = resolveEncounterDefaultKelas()
    const defaultCyto = isIgdEncounter

    modalForm.setFieldsValue({
      assessment_date: dayjs(),
      cytoGlobal: defaultCyto,
      kelas: fallbackKelas,
      petugasList: [],
      tindakanList: [{ jumlah: 1, cyto: defaultCyto, kelas: defaultKelas }],
      bhpList: [],
      paketCytoGlobal: defaultCyto,
      paketIds: [],
      paketEntries: [],
      paketBhpEntries: []
    })
    setIsModalOpen(true)
  }

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    setActiveInputTab('paket')

    const assessment_date = dayjs(record.tanggalTindakan)
    const cytoGlobal = Boolean(record.cyto)

    const fallbackKelas = resolveEncounterDefaultKelas()
    const tindakanNonPaketKelas = normalizeToValidKelas(record?.tindakanNonPaket?.[0]?.kelas)
    const tindakanPaketKelas = normalizeToValidKelas(record?.tindakanPaket?.[0]?.kelas)
    let kelasGlobal = tindakanNonPaketKelas || tindakanPaketKelas || fallbackKelas

    const flatPetugasDB = (record.tindakanPelaksanaList || []).map((p: any) => ({
      roleTenaga: p.roleTenaga,
      pegawaiId: p.pegawaiId
    }))
    setInitialPetugas(flatPetugasDB)

    const newInitialPaket: Record<string, any[]> = {}
    const paketEntriesMap = new Map<number, any>()
    if (Array.isArray(record.tindakanPaket)) {
      record.tindakanPaket.forEach((t: any) => {
        if (!paketEntriesMap.has(t.paketId)) {
          newInitialPaket[t.paketId] = flatPetugasDB // Share db officers to all packages initially
          paketEntriesMap.set(t.paketId, {
            paketId: t.paketId,
            kelas: normalizeToValidKelas(t.kelas) || kelasGlobal,
            tindakanList: [],
            bhpList: [],
            petugasList: flatPetugasDB
          })
        }
        paketEntriesMap.get(t.paketId).tindakanList.push({
          masterTindakanId: t.paketDetail?.masterTindakanId,
          paketId: t.paketId,
          paketDetailId: t.paketDetailId,
          kelas: normalizeToValidKelas(t.kelas) || kelasGlobal,
          jumlah: Number(t.qty),
          satuan: t.satuan,
          cyto: t.cyto,
          checked: true
        })
      })
    }
    const paketEntries = Array.from(paketEntriesMap.values())

    const paketBhpEntriesMap = new Map<number, any>()
    if (Array.isArray(record.paketBhp)) {
      record.paketBhp.forEach((b: any) => {
        if (!paketBhpEntriesMap.has(b.paketBhpId)) {
          paketBhpEntriesMap.set(b.paketBhpId, {
            paketBhpId: b.paketBhpId,
            bhpList: []
          })
        }
        paketBhpEntriesMap.get(b.paketBhpId).bhpList.push({
          itemId: b.itemId,
          paketBhpDetailId: b.paketBhpDetailId,
          jumlah: Number(b.jumlah || b.qty),
          satuan: b.satuan
        })
      })
    }
    const paketBhpEntries = Array.from(paketBhpEntriesMap.values())

    const tindakanList = (record.tindakanNonPaket || []).map((t: any) => ({
      masterTindakanId: t.masterTindakanId,
      kelas: normalizeToValidKelas(t.kelas) || kelasGlobal,
      jumlah: Number(t.qty),
      satuan: t.satuan,
      cyto: t.cyto,
      catatanTambahan: t.catatanTambahan,
      petugasList: flatPetugasDB
    }))

    const bhpList = (record.bhpNonPaket || []).map((b: any) => ({
      itemId: b.itemId,
      jumlah: Number(b.jumlah || b.qty),
      satuan: b.satuan,
      includedInPaket: Boolean(b.includedInPaket)
    }))

    setInitialPaketPetugas(newInitialPaket)

    modalForm.setFieldsValue({
      assessment_date,
      cytoGlobal,
      catatanTambahan: record.catatanTambahan,
      kelas: kelasGlobal,
      petugasList: flatPetugasDB,
      tindakanList,
      bhpList,
      paketEntries,
      paketBhpEntries,
      paketIds: paketEntries.map((e: any) => e.paketId)
    })
    setIsModalOpen(true)
  }

  const handleVoid = async (id: number) => {
    try {
      await voidMutation.mutateAsync(id)
      message.success('Tindakan berhasil dibatalkan')
    } catch (err: any) {
      message.error(err?.message ?? 'Gagal membatalkan tindakan')
    }
  }

  const renderExpandedRecord = (record: any) => {
    const tabItems: any[] = []
    const paketRows: Array<{
      key: string
      namaPaket: string
      item: string
      qty: number
      satuan: string
      cyto: boolean
      catatanTambahan: string | null
    }> = []
    const paketBhpRows: Array<{
      key: string
      namaPaket: string
      item: string
      qty: number
      satuan: string
    }> = []

    const nonPaketColumns = [
      { title: 'Item / Nama', dataIndex: 'item', key: 'item' },
      { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 60, align: 'center' as const },
      { title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 80 },
      {
        title: 'Cyto',
        dataIndex: 'cyto',
        key: 'cyto',
        width: 70,
        align: 'center' as const,
        render: (_: any, rec: any) =>
          rec.cyto === true || String(rec.cyto).toLowerCase() === 'true' ? (
            <Tag color="error" style={{ margin: 0 }}>
              Cyto
            </Tag>
          ) : (
            <span className="text-slate-400">Tidak</span>
          )
      },
      {
        title: 'Catatan Tambahan',
        dataIndex: 'catatanTambahan',
        key: 'catatanTambahan',
        render: (val: string) => val || '-'
      }
    ]

    const pelaksanaColumns = [
      { title: 'Nama Petugas', dataIndex: 'namaLengkap', key: 'namaLengkap' },
      { title: 'Peran', dataIndex: 'peran', key: 'peran' },
      {
        title: 'Nominal Jasa',
        dataIndex: 'nominal',
        key: 'nominal',
        width: 160,
        align: 'right' as const
      }
    ]

    const tarifColumns = [
      { title: 'Komponen Tarif', dataIndex: 'namaKomponen', key: 'namaKomponen' },
      {
        title: 'Nominal',
        dataIndex: 'nominal',
        key: 'nominal',
        width: 160,
        align: 'right' as const
      }
    ]

    const bhpNonPaketColumns = [
      { title: 'Item BHP', dataIndex: 'item', key: 'item' },
      { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80, align: 'center' as const },
      { title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 100 }
    ]

    // 1. Paket Tindakan
    if (record.tindakanPaket && record.tindakanPaket.length > 0) {
      const data = record.tindakanPaket.map((t: any) => ({
        key: `paketTindakan-${t.id}`,
        namaPaket: t.paket?.namaPaket || `Paket ID: ${t.paketId}`,
        item: t.namaTindakan || '-',
        qty: Number(t.jumlah || t.qty || 1),
        satuan: t.satuan || '-',
        cyto: Boolean(t.cyto),
        catatanTambahan: t.catatanTambahan
      }))
      paketRows.push(...data)
    }

    // 2. Tindakan Non Paket
    if (record.tindakanNonPaket && record.tindakanNonPaket.length > 0) {
      const data = record.tindakanNonPaket.map((t: any) => ({
        key: `tindakanNonPaket-${t.id}`,
        item: t.namaTindakan || t.masterTindakan?.namaTindakan || '-',
        qty: Number(t.jumlah || t.qty || 1),
        satuan: t.satuan || '-',
        informasiDetail: t.kelas ? `Kelas ${t.kelas}` : '-',
        cyto: Boolean(t.cyto),
        catatanTambahan: t.catatanTambahan
      }))
      tabItems.push({
        key: 'non-paket',
        label: `Tindakan (${data.length})`,
        children: (
          <Table columns={nonPaketColumns} dataSource={data} pagination={false} size="small" />
        )
      })
    }

    // 3. Pelaksana
    if (record.tindakanPelaksanaList && record.tindakanPelaksanaList.length > 0) {
      const data = record.tindakanPelaksanaList.map((p: any) => ({
        key: `pelaksana-${p.id}`,
        namaLengkap: p.pegawai?.namaLengkap || `ID ${p.pegawaiId}`,
        peran: roleOptions.find((r) => r.value === p.roleTenaga)?.label || p.roleTenaga,
        nominal: `Rp ${Number(p.nominalJasa || p.nominal || 0).toLocaleString('id-ID')}`
      }))
      tabItems.push({
        key: 'pelaksana',
        label: `Pelaksana (${data.length})`,
        children: (
          <Table columns={pelaksanaColumns} dataSource={data} pagination={false} size="small" />
        )
      })
    }

    // 4. Komponen Tarif List
    if (record.komponenTarifList && record.komponenTarifList.length > 0) {
      const data = record.komponenTarifList.map((k: any) => ({
        key: `tarif-${k.id}`,
        namaKomponen: k.komponenTarif?.namaKomponen || k.namaKomponen || '-',
        nominal: `Rp ${Number(k.nominal ?? 0).toLocaleString('id-ID')}`
      }))
      tabItems.push({
        key: 'tarif',
        label: `Tarif (${data.length})`,
        children: <Table columns={tarifColumns} dataSource={data} pagination={false} size="small" />
      })
    }

    // 5. Paket BHP
    if (record.paketBhp && record.paketBhp.length > 0) {
      const data = record.paketBhp.map((t: any) => ({
        key: `paketBhp-${t.id}`,
        namaPaket: t.paketBhp?.namaPaketBhp || `Paket BHP ID: ${t.paketBhpId}`,
        item: t.namaItem || t.item?.nama || '-',
        qty: Number(t.jumlah || t.qty || 1),
        satuan: t.satuan || '-'
      }))
      paketBhpRows.push(...data)
    }

    // 6. BHP Non Paket
    if (record.bhpNonPaket && record.bhpNonPaket.length > 0) {
      const data = record.bhpNonPaket.map((t: any) => ({
        key: `bhpNonPaket-${t.id}`,
        item: t.namaItem || t.item?.nama || '-',
        qty: Number(t.jumlah || t.qty || 1),
        satuan: t.satuan || '-'
      }))
      tabItems.push({
        key: 'bhpNonPaket',
        label: `BHP (${data.length})`,
        children: (
          <Table columns={bhpNonPaketColumns} dataSource={data} pagination={false} size="small" />
        )
      })
    }

    return (
      <PaketOperationBreakdown
        paketRows={paketRows}
        paketBhpRows={paketBhpRows}
        extraTabItems={tabItems}
      />
    )
  }

  const columns: ColumnsType<any> = [
    {
      title: 'No',
      key: 'no',
      width: 48,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggalTindakan',
      key: 'tanggal',
      width: 110,
      render: (val) => dayjs(val).format('DD/MM/YYYY')
    },
    {
      title: 'Tim Pelaksana',
      key: 'tim',
      render: (_, record) => {
        const petugas = record.tindakanPelaksanaList ?? []
        if (petugas.length === 0) return <span style={{ color: token.colorTextTertiary }}>-</span>

        const first = petugas[0]
        const popoverContent = (
          <div className="flex flex-col gap-1 min-w-[200px]">
            {petugas.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                  {roleOptions.find((r) => r.value === p.roleTenaga)?.label ?? p.roleTenaga}
                </Tag>
                <span className="text-sm">{p.pegawai?.namaLengkap ?? `ID: ${p.pegawaiId}`}</span>
              </div>
            ))}
          </div>
        )

        return (
          <Popover title="Tim Pelaksana Tindakan" content={popoverContent} trigger="click">
            <div className="flex flex-col gap-0.5 cursor-pointer">
              <span className="text-sm font-medium">{first.pegawai?.namaLengkap ?? `-`}</span>
              {petugas.length > 1 && (
                <span className="text-xs" style={{ color: token.colorTextTertiary }}>
                  +{petugas.length - 1} petugas lainnya
                </span>
              )}
            </div>
          </Popover>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (val) =>
        val === 'void' ? <Tag color="error">Dibatalkan</Tag> : <Tag color="success">Aktif</Tag>
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 100,
      align: 'center',
      render: (_, record) =>
        record.status !== 'void' ? (
          <Space>
            <Tooltip title="Edit tindakan">
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Batalkan tindakan ini?"
              description="Tindakan akan ditandai sebagai void."
              onConfirm={() => handleVoid(record.id)}
              okText="Ya, batalkan"
              cancelText="Tidak"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Batalkan tindakan">
                <Button
                  size="small"
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  loading={voidMutation.isPending}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ) : null
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={'Detail Tindakan Medis'}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
            Catat Tindakan Baru
          </Button>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Spin spinning={isLoadingList}>
          <Table
            rowKey="id"
            dataSource={tindakanList}
            columns={columns}
            expandable={{
              expandedRowRender: renderExpandedRecord
            }}
            size="small"
            pagination={false}
            className="border-none"
            locale={{ emptyText: 'Belum ada tindakan yang dicatat untuk encounter ini' }}
            rowClassName={(record) => (record.status === 'void' ? 'opacity-40' : '')}
          />
        </Spin>
      </Card>

      {/* Modal form */}
      <Modal
        title={editingId ? `Edit Detail Tindakan (#${editingId})` : 'Catat Detail Tindakan'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          modalForm.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalOpen(false)
              modalForm.resetFields()
            }}
          >
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SaveOutlined />}
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={() => modalForm.submit()}
          >
            {editingId ? 'Update' : 'Simpan'}
          </Button>
        ]}
        width={860}
        destroyOnClose
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleSubmit}
          onFinishFailed={handleFormFinishFailed}
          className="flex! flex-col! gap-4!"
          initialValues={{ assessment_date: dayjs(), petugasList: [] }}
        >
          <Tabs
            activeKey={activeInputTab}
            onChange={(key) => setActiveInputTab(key as InputTabKey)}
            size="small"
            items={[
              {
                key: 'paket',
                label: 'Paket Tindakan',
                forceRender: true,
                children: (
                  <PaketTindakanTab
                    modalForm={modalForm}
                    token={token}
                    setSearchPaket={handlePaketSearchChange}
                    searchPaket={searchPaket}
                    isLoadingPaket={isLoadingPaket}
                    paketPagination={paketPagination}
                    onPaketPageChange={handlePaketPageChange}
                    paketKategoriOptions={paketKategoriOptions}
                    selectedPaketKategori={paketQuery.kategoriPaket}
                    onPaketKategoriChange={handlePaketKategoriChange}
                    paketKategoriBpjsOptions={paketKategoriBpjsOptions}
                    selectedPaketKategoriBpjs={paketQuery.kategoriBpjs}
                    onPaketKategoriBpjsChange={handlePaketKategoriBpjsChange}
                    selectedPaketStatus={paketQuery.status}
                    onPaketStatusChange={handlePaketStatusChange}
                    paketOptions={filteredPaketOptions}
                    handlePaketEntryChange={handlePaketEntryChange}
                    kelasOptions={resolvedKelasOptions}
                    tindakanOptions={tindakanOptions}
                    consumableItemOptions={consumableItemOptions}
                    isLoadingConsumableItems={isLoadingConsumableItems}
                    consumableItemMap={consumableItemMap}
                    isLoadingPerformers={isLoadingPerformers}
                    performers={performers}
                    roleLabelByCode={roleLabelByCode}
                    setItemSelectorState={setItemSelectorState}
                    masterTindakanList={masterTindakanDisplayList}
                  />
                )
              },
              {
                key: 'non-paket',
                label: 'Tindakan Non-Paket',
                forceRender: true,
                children: (
                  <TindakanNonPaketTab
                    modalForm={modalForm}
                    token={token}
                    kelasOptions={resolvedKelasOptions}
                    setSearchTindakan={setSearchTindakan}
                    isLoadingMaster={isLoadingMaster}
                    tindakanOptions={tindakanOptions}
                    isLoadingPerformers={isLoadingPerformers}
                    performers={performers}
                    roleLabelByCode={roleLabelByCode}
                    setProcedureSelectorState={setProcedureSelectorState}
                    masterTindakanList={masterTindakanList}
                    defaultKelas={defaultKelas}
                  />
                )
              },
              {
                key: 'paket-bhp',
                label: 'Paket BHP',
                forceRender: true,
                children: (
                  <PaketBhpTab
                    modalForm={modalForm}
                    isLoadingPaketBhp={isLoadingPaketBhp}
                    paketBhpOptions={filteredPaketBhpOptions}
                    setSearchPaketBhp={setSearchPaketBhp}
                    paketBhpCache={paketBhpCache}
                    isLoadingConsumableItems={isLoadingConsumableItems}
                    consumableItemOptions={consumableItemOptions}
                    consumableItemMap={consumableItemMap}
                    stockByItemMap={stockByItemMap}
                  />
                )
              },
              {
                key: 'bhp-non-paket',
                label: 'BHP Non-Paket',
                forceRender: true,
                children: (
                  <BhpNonPaketTab
                    modalForm={modalForm}
                    isLoadingConsumableItems={isLoadingConsumableItems}
                    consumableItemOptions={consumableItemOptions}
                    consumableItemMap={consumableItemMap}
                    stockByItemMap={stockByItemMap}
                    setItemSelectorState={setItemSelectorState}
                  />
                )
              }
            ]}
          />
        </Form>
      </Modal>

      <ItemSelectorModal
        open={itemSelectorState.open}
        onCancel={() => setItemSelectorState({ open: false })}
        onSelect={(item) => {
          if (itemSelectorState.onSelect) itemSelectorState.onSelect(item)
          setItemSelectorState({ open: false })
        }}
        itemOptions={consumableItemOptions}
        loading={isLoadingConsumableItems}
      />

      <ProcedureSelectorModal
        open={procedureSelectorState.open}
        mode={procedureSelectorState.mode}
        title={procedureSelectorState.title}
        onCancel={() =>
          setProcedureSelectorState({
            open: false,
            mode: 'select'
          })
        }
        onSelect={(proc) => {
          setMasterTindakanCache((prev) => ({
            ...prev,
            [proc.id]: proc
          }))
          if (procedureSelectorState.onSelect) procedureSelectorState.onSelect(proc)
          setProcedureSelectorState({
            open: false,
            mode: 'select'
          })
        }}
        procedures={
          (procedureSelectorState.mode ?? 'select') === 'readonly'
            ? procedureSelectorState.procedures || []
            : masterTindakanList
        }
        loading={(procedureSelectorState.mode ?? 'select') === 'readonly' ? false : isLoadingMaster}
        pagination={
          (procedureSelectorState.mode ?? 'select') === 'readonly'
            ? undefined
            : masterTindakanPagination
        }
        pageSize={procedureQuery.items}
        searchValue={procedureQuery.q || ''}
        selectedCategory={
          (procedureSelectorState.mode ?? 'select') === 'readonly'
            ? undefined
            : procedureQuery.kategori
        }
        selectedBpjsCategory={
          (procedureSelectorState.mode ?? 'select') === 'readonly'
            ? undefined
            : procedureQuery.categoryBpjs
        }
        categoryOptions={
          (procedureSelectorState.mode ?? 'select') === 'readonly'
            ? undefined
            : procedureCategoryOptions
        }
        onSearchChange={handleProcedureSearchChange}
        onCategoryChange={handleProcedureCategoryChange}
        onBpjsCategoryChange={handleProcedureBpjsCategoryChange}
        onPageChange={handleProcedurePageChange}
      />
    </div>
  )
}

export default DetailTindakanForm
