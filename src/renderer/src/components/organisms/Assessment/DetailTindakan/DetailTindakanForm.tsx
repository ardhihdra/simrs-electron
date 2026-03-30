import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { useMasterTindakanList } from '@renderer/hooks/query/use-master-tindakan'
import {
  useMasterPaketTindakanList,
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

interface DetailTindakanFormProps {
  encounterId: string
  patientData: any
}

interface ItemListResponse {
  success: boolean
  result?: ConsumableItem[]
  message?: string
  error?: string
}

interface ConsumableItem {
  id: number
  kode: string
  nama: string
  kodeUnit?: string | null
  kind?: 'DEVICE' | 'CONSUMABLE' | 'NUTRITION' | 'GENERAL' | null
  sellingPrice?: number | null
  category?: {
    id?: number
    name?: string | null
    categoryType?: string | null
  } | null
}

const kelasOptions = [
  { value: 'kelas_1', label: 'Kelas 1' },
  { value: 'kelas_2', label: 'Kelas 2' },
  { value: 'kelas_3', label: 'Kelas 3' },
  { value: 'vip', label: 'VIP' },
  { value: 'vvip', label: 'VVIP' },
  { value: 'umum', label: 'Umum / Non Kelas' }
]

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
  kelas?: string | null
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
  kelas?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  rincianTarif?: PaketTarifRincianRef[] | null
}

export const DetailTindakanForm = ({ encounterId, patientData }: DetailTindakanFormProps) => {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [modalForm] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeInputTab, setActiveInputTab] = useState<
    'paket' | 'non-paket' | 'paket-bhp' | 'bhp-non-paket'
  >('paket')
  const [searchTindakan, setSearchTindakan] = useState('')
  const [searchPaket, setSearchPaket] = useState('')
  const [searchPaketBhp, setSearchPaketBhp] = useState('')
  const [paketCache, setPaketCache] = useState<Record<number, any>>({})
  const [paketBhpCache, setPaketBhpCache] = useState<Record<number, any>>({})
  const [masterTindakanDetailCache, setMasterTindakanDetailCache] = useState<
    Record<number, MasterTindakanDetailRef | null>
  >({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [initialPetugas, setInitialPetugas] = useState<any[]>([])
  const [initialPaketPetugas, setInitialPaketPetugas] = useState<Record<string, any[]>>({})
  const { profile } = useMyProfile()

  const patientId = patientData?.patient?.id || patientData?.id || ''

  const { data: performers = [], isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse',
    'bidan'
  ])

  const { data: masterTindakanList = [], isLoading: isLoadingMaster } = useMasterTindakanList({
    q: searchTindakan || undefined,
    items: 10,
    status: 'active'
  })

  const { data: paketList = [], isLoading: isLoadingPaket } = useMasterPaketTindakanList({
    q: searchPaket || undefined,
    items: 10
  })

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
    items: 10
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
    queryKey: ['item', 'bhp-list'],
    queryFn: async (): Promise<ConsumableItem[]> => {
      const fn = window.api?.query?.item?.list as any
      if (!fn) throw new Error('API master item tidak tersedia')

      const res = await fn({ items: 1000, depth: 1 })
      if (!res.success) {
        throw new Error(res.message || res.error || 'Gagal mengambil data item')
      }

      const list = (Array.isArray(res.result) ? res.result : []) as ConsumableItem[]
      
      return list.filter((item) => {
        const categoryType = typeof item?.category?.categoryType === 'string' 
          ? item.category.categoryType.toLowerCase() 
          : ''
        return categoryType === 'bhp'
      })
    },
    staleTime: 5 * 60 * 1000
  })

  // Resolve Doctor Location
  const { data: myEmployeeData } = useQuery({
    queryKey: ['kepegawaian', 'profile-detail', profile?.id],
    queryFn: async () => {
      const fn = (window.api?.query as any)?.kepegawaian?.list
      if (!fn || !profile?.username) return null
      const res = await fn({ nik: profile.username, depth: 1 })
      return (Array.isArray(res?.result) ? res.result[0] : null) as any
    },
    enabled: !!profile?.username
  })

  const currentWorkLocation = useMemo(() => {
    try {
      if (myEmployeeData) {
        const contracts = Array.isArray(myEmployeeData.kontrakPegawai) ? myEmployeeData.kontrakPegawai : []
        const active = contracts[0] // list.ts sorts by date desc
        if (active?.kodeLokasiKerja) return active.kodeLokasiKerja
      }
    } catch {}
    return 'GUDANG' // fallback
  }, [myEmployeeData])

  // Fetch Stock for Doctor Location
  const { data: locationStockData } = useQuery({
    queryKey: ['inventoryStock', 'by-location', currentWorkLocation],
    queryFn: async () => {
      const fn = (window.api?.query as any)?.inventoryStock?.listByLocation
      if (!fn) return null
      const res = await fn({ kodeLokasi: currentWorkLocation, items: 1000 })
      return res?.success ? res.result : null
    },
    enabled: !!currentWorkLocation
  })

  const stockByItemMap = useMemo(() => {
    const map = new Map<string, number>()
    try {
      const locs = Array.isArray(locationStockData) ? locationStockData : []
      const current = locs.find((l: any) => l.kodeLokasi === currentWorkLocation)
      const items = Array.isArray(current?.items) ? current.items : []
      items.forEach((it: any) => {
        const kode = String(it.kodeItem || '').trim().toUpperCase()
        if (kode) map.set(kode, Number(it.availableStock || 0))
      })
    } catch (err) {
      console.error('[BHP][Debug] Error build map:', err)
    }
    return map
  }, [locationStockData, currentWorkLocation])

  useEffect(() => {
    console.log('[BHP][Debug] profile:', profile)
    console.log('[BHP][Debug] myEmployeeData:', myEmployeeData)
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

  const consumableItemOptions = useMemo(() => {
    return consumableItems.map((item) => {
      const stock = stockByItemMap.get(item.kode.trim().toUpperCase()) || 0
      const isOutOfStock = stock <= 0
      const stockText = isOutOfStock ? ' (Stok Kosong)' : ` (Stok: ${stock})`
      
      return {
        value: item.id,
        label: `[${item.kode}] ${item.nama}${stockText}`,
        searchLabel: `${item.kode} ${item.nama}`.toLowerCase(),
        disabled: isOutOfStock
      }
    })
  }, [consumableItems, stockByItemMap])

  const roleByKomponenId = useMemo(
    () => new Map((listJenisKomponen || []).map((item) => [Number(item.id), item.kode])),
    [listJenisKomponen]
  )

  const roleLabelByCode = useMemo(
    () => new Map((listJenisKomponen || []).map((item) => [item.kode, item.label])),
    [listJenisKomponen]
  )

  const normalizeKelas = useCallback(
    (value: unknown) =>
      String(value ?? '')
        .trim()
        .toLowerCase(),
    []
  )

  const isDateWithinPeriod = useCallback(
    (tanggal: string, from?: string | null, to?: string | null) => {
      const start = String(from || '')
      const end = to ? String(to) : null
      if (!start) return false
      if (start > tanggal) return false
      if (end && end < tanggal) return false
      return true
    },
    []
  )

  const pickTarifForKelasAndDate = useCallback(
    (tarifList: MasterTarifTindakanRef[], kelas: string, tanggal: string) => {
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
    },
    [isDateWithinPeriod, normalizeKelas]
  )

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

          const pickedTarif = pickTarifForKelasAndDate(detail.tarifList, kelas, tanggal)
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

      const selectedPaket = paketCache[paketId] ?? paketList.find((p) => Number(p?.id) === paketId)
      const tarifList = Array.isArray(selectedPaket?.tarifList)
        ? (selectedPaket.tarifList as PaketTarifHeaderRef[])
        : []
      if (tarifList.length === 0) return []

      const kelasTarget = normalizeKelas(entry?.kelas)
      const kelasPriority = Array.from(new Set([kelasTarget, 'umum'].filter(Boolean)))
      const pickedTarif = [...tarifList]
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
        })[0]

      if (!pickedTarif) return []

      const entryDetailIds = new Set<number>(
        (Array.isArray(entry?.tindakanList) ? entry.tindakanList : [])
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
    [paketCache, paketList, roleByKomponenId]
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
    const list = masterTindakanList.map((t) => ({
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
  }, [masterTindakanList, paketList, currentTindakanList])

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
    const entryKelas = currentEntries?.[entryIndex]?.kelas
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
        kelas: entryKelas ?? (d as any)?.kelas ?? undefined,
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
      return itemLists
        .filter((item: any) => item?.itemId && Number(item.jumlah) > 0)
        .map((item: any) => ({
          paketBhpId: entry.paketBhpId,
          paketBhpDetailId: item.paketBhpDetailId ?? 0,
          itemId: item.itemId,
          jumlah: Number(item.jumlah),
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
        message.error(
          `Role tenaga medis belum tersedia pada Tindakan Non-Paket #${missingPetugasNonPaketIdx + 1}. Pastikan tindakan di kelas terpilih memiliki komponen jasa medis, lalu isi nama petugas.`
        )
        return
      }

      if (hasNonPaketBhp && !hasNonPaketTindakan) {
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

  const handleOpenModal = () => {
    modalForm.resetFields()
    setEditingId(null)
    setInitialPetugas([])
    setInitialPaketPetugas({})
    setActiveInputTab('paket')
    const fallbackKelas = patientData?.encounter?.kelasId || patientData?.kelas?.id || undefined
    const matchedKelas = kelasOptions.find(
      (opt) =>
        opt.value === fallbackKelas ||
        opt.value === `kelas_${fallbackKelas}` ||
        opt.label.toLowerCase().includes(String(fallbackKelas).toLowerCase())
    )

    modalForm.setFieldsValue({
      assessment_date: dayjs(),
      kelas: matchedKelas?.value || fallbackKelas,
      petugasList: [],
      tindakanList: [{ jumlah: 1, cyto: false }],
      bhpList: [],
      paketCytoGlobal: false,
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

    const fallbackKelas = patientData?.encounter?.kelasId || patientData?.kelas?.id || undefined
    const matchedKelas = kelasOptions.find(
      (opt) =>
        opt.value === fallbackKelas ||
        opt.value === `kelas_${fallbackKelas}` ||
        opt.label.toLowerCase().includes(String(fallbackKelas).toLowerCase())
    )

    let kelasGlobal = matchedKelas?.value || fallbackKelas
    if (record.tindakanNonPaket?.length > 0 && record.tindakanNonPaket[0].kelas) {
      kelasGlobal = record.tindakanNonPaket[0].kelas
    } else if (record.tindakanPaket?.length > 0 && record.tindakanPaket[0].kelas) {
      kelasGlobal = record.tindakanPaket[0].kelas
    }

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
            kelas: t.kelas || kelasGlobal,
            tindakanList: [],
            bhpList: [],
            petugasList: flatPetugasDB
          })
        }
        paketEntriesMap.get(t.paketId).tindakanList.push({
          masterTindakanId: t.paketDetail?.masterTindakanId,
          paketId: t.paketId,
          paketDetailId: t.paketDetailId,
          kelas: t.kelas || kelasGlobal,
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
      kelas: t.kelas || kelasGlobal,
      jumlah: Number(t.qty),
      satuan: t.satuan,
      cyto: t.cyto,
      catatanTambahan: t.catatanTambahan,
      petugasList: flatPetugasDB
    }))
    if (tindakanList.length === 0) tindakanList.push({ jumlah: 1, cyto: false, petugasList: [] })

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

    const paketColumns = [
      { title: 'Dari Paket', dataIndex: 'namaPaket', key: 'namaPaket' },
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

    const paketBhpColumns = [
      { title: 'Dari Paket', dataIndex: 'namaPaket', key: 'namaPaket' },
      { title: 'Item / Nama', dataIndex: 'item', key: 'item' },
      { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 60, align: 'center' as const },
      { title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 80 }
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
        informasiDetail: t.kelas ? `Kelas ${t.kelas}` : '-',
        cyto: Boolean(t.cyto),
        catatanTambahan: t.catatanTambahan
      }))
      tabItems.push({
        key: 'paket',
        label: `Paket (${data.length})`,
        children: <Table columns={paketColumns} dataSource={data} pagination={false} size="small" />
      })
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
      tabItems.push({
        key: 'paketBhp',
        label: `Pkt. BHP (${data.length})`,
        children: (
          <Table columns={paketBhpColumns} dataSource={data} pagination={false} size="small" />
        )
      })
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

    if (tabItems.length === 0) {
      return (
        <div className="py-6 px-4 text-center text-slate-400 bg-slate-50/50 italic text-sm border-t border-slate-200">
          - Belum ada detail data -
        </div>
      )
    }

    return (
      <div className="p-4 sm:p-5 bg-slate-50 shadow-inner border-y border-slate-200">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <Tabs items={tabItems} size="small" />
        </div>
      </div>
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
        title={
          <Space>
            <HistoryOutlined />
            Detail Tindakan Medis
          </Space>
        }
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
          className="flex! flex-col! gap-4!"
          initialValues={{ assessment_date: dayjs(), petugasList: [] }}
        >
          <Tabs
            activeKey={activeInputTab}
            onChange={(key) =>
              setActiveInputTab(key as 'paket' | 'non-paket' | 'paket-bhp' | 'bhp-non-paket')
            }
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
                    setSearchPaket={setSearchPaket}
                    isLoadingPaket={isLoadingPaket}
                    paketOptions={paketOptions}
                    handlePaketEntryChange={handlePaketEntryChange}
                    kelasOptions={kelasOptions}
                    tindakanOptions={tindakanOptions}
                    consumableItemOptions={consumableItemOptions}
                    isLoadingConsumableItems={isLoadingConsumableItems}
                    consumableItemMap={consumableItemMap}
                    isLoadingPerformers={isLoadingPerformers}
                    performers={performers}
                    roleLabelByCode={roleLabelByCode}
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
                    kelasOptions={kelasOptions}
                    setSearchTindakan={setSearchTindakan}
                    isLoadingMaster={isLoadingMaster}
                    tindakanOptions={tindakanOptions}
                    isLoadingPerformers={isLoadingPerformers}
                    performers={performers}
                    roleLabelByCode={roleLabelByCode}
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
                    paketBhpOptions={paketBhpList.map((p: any) => ({
                      value: p.id,
                      label: `[${p.kodePaketBhp}] ${p.namaPaketBhp}`
                    }))}
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
                  />
                )
              }
            ]}
          />
        </Form>
      </Modal>
    </div>
  )
}

export default DetailTindakanForm
