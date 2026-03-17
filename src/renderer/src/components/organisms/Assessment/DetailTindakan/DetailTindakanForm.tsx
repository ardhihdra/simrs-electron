import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Form, Button, Card, App, Modal, Table, Space, Tooltip, Popconfirm, Popover, Spin, Tag, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SaveOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useMasterTindakanList } from '@renderer/hooks/query/use-master-tindakan'
import {
  useMasterPaketTindakanList,
  type PaketDetailItem,
  type PaketBhpItem
} from '@renderer/hooks/query/use-master-paket-tindakan'
import {
  useDetailTindakanByEncounter,
  useCreateDetailTindakan,
  useVoidDetailTindakan,
  type DetailTindakanPasienItem
} from '@renderer/hooks/query/use-detail-tindakan-pasien'
import { useMasterJenisKomponenList } from '@renderer/hooks/query/use-master-jenis-komponen'
import { theme } from 'antd'
import PaketTindakanTab from './PaketTindakanTab'
import TindakanNonPaketTab from './TindakanNonPaketTab'
import PaketBhpTab from './PaketBhpTab'

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
  const [activeInputTab, setActiveInputTab] = useState<'paket' | 'non-paket' | 'paket-bhp'>(
    'paket'
  )
  const [searchTindakan, setSearchTindakan] = useState('')
  const [searchPaket, setSearchPaket] = useState('')
  const [paketCache, setPaketCache] = useState<Record<number, any>>({})
  const [masterTindakanDetailCache, setMasterTindakanDetailCache] = useState<
    Record<number, MasterTindakanDetailRef | null>
  >({})

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

  const { data: consumableItems = [], isLoading: isLoadingConsumableItems } = useQuery({
    queryKey: ['item', 'consumable-list'],
    queryFn: async (): Promise<ConsumableItem[]> => {
      const fn = window.api?.query?.item?.list as (() => Promise<ItemListResponse>) | undefined
      if (!fn) throw new Error('API master item tidak tersedia')

      const res = await fn()
      if (!res.success) {
        throw new Error(res.message || res.error || 'Gagal mengambil data item')
      }

      const list = Array.isArray(res.result) ? res.result : []
      return list.filter((item) => item?.kind === 'CONSUMABLE')
    },
    staleTime: 5 * 60 * 1000
  })

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
  const nonPaketKelasWatcher = Form.useWatch('kelas', modalForm)
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

  const consumableItemOptions = useMemo(
    () =>
      consumableItems.map((item) => ({
        value: item.id,
        label: `[${item.kode}] ${item.nama}`,
        searchLabel: `${item.kode} ${item.nama}`.toLowerCase()
      })),
    [consumableItems]
  )

  const roleByKomponenId = useMemo(
    () => new Map((listJenisKomponen || []).map((item) => [Number(item.id), item.kode])),
    [listJenisKomponen]
  )

  const roleLabelByCode = useMemo(
    () => new Map((listJenisKomponen || []).map((item) => [item.kode, item.label])),
    [listJenisKomponen]
  )

  const normalizeKelas = (value: unknown) =>
    String(value ?? '')
      .trim()
      .toLowerCase()

  const isDateWithinPeriod = (tanggal: string, from?: string | null, to?: string | null) => {
    const start = String(from || '')
    const end = to ? String(to) : null
    if (!start) return false
    if (start > tanggal) return false
    if (end && end < tanggal) return false
    return true
  }

  const pickTarifForKelasAndDate = (
    tarifList: MasterTarifTindakanRef[],
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

  const resolveRolesFromTindakanItems = (items: any[], kelas?: string | null, tanggal?: string) => {
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
          const fallbackKode = String(komponen?.kode || komponen?.jenisKomponen?.kode || '').trim()
          const roleKode = roleByKomponenId.get(komponenId) || (isUntukMedis ? fallbackKode : '')
          if (roleKode) roleSet.add(roleKode)
        })
      })

    return Array.from(roleSet)
  }

  const resolveRolesFromPaketEntry = (entry: any, tanggal?: string) => {
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
  }

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
    const roles = resolveRolesFromTindakanItems(
      Array.isArray(currentTindakanList) ? currentTindakanList : [],
      nonPaketKelasWatcher,
      tanggal
    )
    const existingPetugas = (modalForm.getFieldValue('petugasList') || []) as any[]

    const nextPetugas = roles.map((roleKode) => ({
      roleTenaga: roleKode,
      pegawaiId: existingPetugas.find((p) => p?.roleTenaga === roleKode)?.pegawaiId
    }))

    const currentSignature = JSON.stringify(
      existingPetugas.map((item) => ({ roleTenaga: item?.roleTenaga, pegawaiId: item?.pegawaiId }))
    )
    const nextSignature = JSON.stringify(
      nextPetugas.map((item) => ({ roleTenaga: item?.roleTenaga, pegawaiId: item?.pegawaiId }))
    )
    if (currentSignature !== nextSignature) {
      modalForm.setFieldValue('petugasList', nextPetugas)
    }
  }, [
    assessmentDateWatcher,
    currentTindakanList,
    masterTindakanDetailCache,
    modalForm,
    nonPaketKelasWatcher,
    roleByKomponenId
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

      const nextPetugas = roles.map((roleKode) => ({
        roleTenaga: roleKode,
        pegawaiId: existingPetugas.find((p: any) => p?.roleTenaga === roleKode)?.pegawaiId
      }))

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
    roleByKomponenId
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

    const paketTindakanData = (
      Array.isArray(values?.paketEntries) ? values.paketEntries : []
    ).flatMap((entry: any) => {
      const entryPetugasList = (entry?.petugasList ?? []).filter(
        (p: any) => p?.pegawaiId && p?.roleTenaga
      )
      const entryItems = Array.isArray(entry?.tindakanList) ? entry.tindakanList : []
      const entryBhpList = mapBhpList(entry?.bhpList, true)

      const entryTindakanData = entryItems
        .filter((item: any) => item?.masterTindakanId)
        .map((item: any) => ({
          bhpList: [] as {
            itemId: number
            jumlah: number
            satuan?: string | null
            includedInPaket: boolean
          }[],
          masterTindakanId: item.masterTindakanId,
          kelas: item?.kelas ?? entry?.kelas ?? null,
          paketId: item.paketId,
          paketDetailId: item.paketDetailId,
          encounterId,
          patientId,
          tanggalTindakan: tanggal,
          jumlah: item.jumlah ?? 1,
          satuan: item.satuan,
          cyto: item.cyto ?? false,
          catatanTambahan: entry?.catatanTambahan,
          petugasList: entryPetugasList
        }))

      if (entryBhpList.length > 0 && entryTindakanData.length > 0) {
        entryTindakanData[0].bhpList = entryBhpList
      }

      return entryTindakanData
    })

    const nonPaketPetugasList = (values.petugasList ?? []).filter(
      (p: any) => p?.pegawaiId && p?.roleTenaga
    )

    const nonPaketItems = Array.isArray(values?.tindakanList) ? values.tindakanList : []
    const nonPaketBhpList = mapBhpList(values?.bhpList, false)
    const nonPaketTindakanData = nonPaketItems
      .filter((item: any) => item?.masterTindakanId)
      .map((item: any) => ({
        bhpList: [] as {
          itemId: number
          jumlah: number
          satuan?: string | null
          includedInPaket: boolean
        }[],
        masterTindakanId: item.masterTindakanId,
        kelas: item?.kelas ?? values?.kelas ?? null,
        paketId: undefined,
        paketDetailId: undefined,
        encounterId,
        patientId,
        tanggalTindakan: tanggal,
        jumlah: item.jumlah ?? 1,
        satuan: item.satuan,
        cyto: item.cyto ?? false,
        catatanTambahan: values.catatanTambahan,
        petugasList: nonPaketPetugasList
      }))

    if (nonPaketBhpList.length > 0 && nonPaketTindakanData.length > 0) {
      nonPaketTindakanData[0].bhpList = nonPaketBhpList
    }

    return [...paketTindakanData, ...nonPaketTindakanData]
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

      if ((hasNonPaketTindakan || hasNonPaketBhp) && !values?.kelas) {
        message.error('Kelas tindakan non-paket wajib dipilih')
        return
      }

      if (hasNonPaketTindakan) {
        const petugasList = (values.petugasList ?? []).filter(
          (p: any) => p?.pegawaiId && p?.roleTenaga
        )
        if (petugasList.length === 0) {
          message.error(
            'Role tenaga medis non-paket belum tersedia. Pastikan tindakan di kelas terpilih memiliki komponen jasa medis, lalu isi nama petugas.'
          )
          return
        }
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

      const tindakanData = buildTindakanData(values)
      if (tindakanData.length === 0) {
        message.error('Minimal harus mencatat 1 tindakan')
        return
      }

      await createMutation.mutateAsync({ tindakanData })
      message.success(`${tindakanData.length} tindakan berhasil disimpan`)
      modalForm.resetFields()
      setIsModalOpen(false)
    } catch (err: any) {
      message.error(err?.message ?? 'Gagal menyimpan detail tindakan')
    }
  }

  const handleOpenModal = () => {
    modalForm.resetFields()
    setActiveInputTab('paket')
    modalForm.setFieldsValue({
      assessment_date: dayjs(),
      kelas: undefined,
      petugasList: [],
      tindakanList: [{ jumlah: 1, cyto: false }],
      bhpList: [],
      paketCytoGlobal: false,
      paketIds: [],
      paketEntries: []
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

  const toNumber = (value: unknown) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatCurrency = (value: unknown) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(toNumber(value))

  const renderExpandedBhp = (record: DetailTindakanPasienItem) => {
    const bhpList = Array.isArray(record.bhpList) ? record.bhpList : []

    if (bhpList.length === 0) {
      return (
        <div className="px-3 py-2 text-xs" style={{ color: token.colorTextTertiary }}>
          Tidak ada data BHP pada tindakan ini.
        </div>
      )
    }

    const totalIncluded = bhpList
      .filter((bhp) => Boolean(bhp?.includedInPaket))
      .reduce((sum, bhp) => sum + toNumber(bhp?.subtotal), 0)
    const totalNonIncluded = bhpList
      .filter((bhp) => !Boolean(bhp?.includedInPaket))
      .reduce((sum, bhp) => sum + toNumber(bhp?.subtotal), 0)
    const totalAll = totalIncluded + totalNonIncluded

    const bhpColumns: ColumnsType<(typeof bhpList)[number]> = [
      {
        title: 'Item BHP',
        key: 'item',
        render: (_, row) => {
          const itemCode = row.item?.kode ? `[${row.item.kode}] ` : ''
          const itemName = row.namaItem ?? row.item?.nama ?? `Item #${row.itemId}`
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {itemCode}
                {itemName}
              </span>
            </div>
          )
        }
      },
      {
        title: 'Qty',
        key: 'qty',
        width: 110,
        render: (_, row) => `${toNumber(row.jumlah)} ${row.satuan ?? ''}`.trim()
      },
      {
        title: 'Asal BHP',
        key: 'asalBhp',
        width: 120,
        render: (_, row) =>
          Boolean(row?.includedInPaket) ? (
            <Tag color="green">Dari Paket</Tag>
          ) : (
            <Tag color="default">Non-Paket</Tag>
          )
      },
      {
        title: 'Harga Satuan',
        key: 'hargaSatuan',
        width: 130,
        align: 'right',
        render: (_, row) => formatCurrency(row?.hargaSatuan)
      },
      {
        title: 'Subtotal',
        key: 'subtotal',
        width: 130,
        align: 'right',
        render: (_, row) => formatCurrency(row?.subtotal)
      },
      {
        title: 'Status Dispense',
        key: 'dispense',
        width: 160,
        render: (_, row) => {
          const status = String(row?.medicationDispense?.status ?? '').toLowerCase()
          if (!status) return <span style={{ color: token.colorTextTertiary }}>-</span>

          const colorMap: Record<string, string> = {
            completed: 'success',
            preparation: 'processing',
            cancelled: 'error',
            declined: 'error',
            in_progress: 'processing',
            on_hold: 'warning'
          }

          return <Tag color={colorMap[status] ?? 'default'}>{status.replaceAll('_', ' ')}</Tag>
        }
      }
    ]

    return (
      <div className="px-3 py-2">
        <Table
          size="small"
          rowKey={(row, idx) => String(row.id ?? `${record.id}-${row.itemId}-${idx}`)}
          dataSource={bhpList}
          columns={bhpColumns}
          pagination={false}
          className="border border-slate-100 rounded"
        />
        <div className="mt-2 flex flex-wrap justify-end gap-2 text-xs">
          <Tag color="green">Total Included: {formatCurrency(totalIncluded)}</Tag>
          <Tag color="orange">Total Non-Included: {formatCurrency(totalNonIncluded)}</Tag>
          <Tag color="blue">Total BHP: {formatCurrency(totalAll)}</Tag>
        </div>
      </div>
    )
  }

  // --- Kolom tabel riwayat ---
  const columns: ColumnsType<DetailTindakanPasienItem> = [
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
      title: 'Tindakan',
      key: 'tindakan',
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">
            {record.masterTindakan?.namaTindakan ?? '-'}
          </span>
          <span className="text-xs" style={{ color: token.colorTextTertiary }}>
            [{record.masterTindakan?.kodeTindakan}]
            {record.masterTindakan?.kategoriTindakan
              ? ` · ${record.masterTindakan.kategoriTindakan}`
              : ''}
          </span>
        </div>
      )
    },
    {
      title: 'Asal Tindakan',
      key: 'asalTindakan',
      width: 120,
      render: (_, record) =>
        Number(record?.paketId) > 0 ? (
          <Tag color="geekblue">Paket</Tag>
        ) : (
          <Tag color="default">Non-Paket</Tag>
        )
    },
    {
      title: 'Jumlah',
      key: 'jumlah',
      width: 80,
      render: (_, record) => `${Number(record.jumlah)} ${record.satuan ?? ''}`
    },
    {
      title: 'Cyto',
      dataIndex: 'cyto',
      key: 'cyto',
      width: 72,
      align: 'center',
      render: (val) =>
        val ? (
          <Tag color="error" icon={<ThunderboltOutlined />}>
            Cyto
          </Tag>
        ) : (
          <Tag color="default" icon={<CheckCircleOutlined />}>
            Tidak
          </Tag>
        )
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
      title: 'Tarif',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (val) => formatCurrency(val)
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 70,
      align: 'center',
      render: (_, record) =>
        record.status !== 'void' ? (
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
        ) : null
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* History table card */}
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
              expandedRowRender: renderExpandedBhp
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
        title="Catat Detail Tindakan"
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
            loading={createMutation.isPending}
            onClick={() => modalForm.submit()}
          >
            Simpan
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
          <AssessmentHeader performers={performers || []} loading={isLoadingPerformers} />
          <Tabs
            activeKey={activeInputTab}
            onChange={(key) => setActiveInputTab(key as 'paket' | 'non-paket' | 'paket-bhp')}
            size="small"
            items={[
              { key: 'paket', label: 'Paket Tindakan' },
              { key: 'non-paket', label: 'Tindakan Non-Paket' },
              { key: 'paket-bhp', label: 'Paket BHP' }
            ]}
          />
          {activeInputTab === 'paket' && (
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
          )}

          {activeInputTab === 'non-paket' && (
            <TindakanNonPaketTab
              modalForm={modalForm}
              token={token}
              kelasOptions={kelasOptions}
              setSearchTindakan={setSearchTindakan}
              isLoadingMaster={isLoadingMaster}
              tindakanOptions={tindakanOptions}
              isLoadingConsumableItems={isLoadingConsumableItems}
              consumableItemOptions={consumableItemOptions}
              consumableItemMap={consumableItemMap}
              isLoadingPerformers={isLoadingPerformers}
              performers={performers}
              roleLabelByCode={roleLabelByCode}
            />
          )}

          {activeInputTab === 'paket-bhp' && <PaketBhpTab token={token} />}
        </Form>
      </Modal>
    </div>
  )
}

export default DetailTindakanForm
