import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  InputNumber,
  App,
  Modal,
  Table,
  Space,
  Tooltip,
  Popconfirm,
  Popover,
  Spin,
  Tag,
  Switch,
  Row,
  Col,
  Radio,
  Divider
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  SaveOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
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

const { TextArea } = Input

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

export const DetailTindakanForm = ({ encounterId, patientData }: DetailTindakanFormProps) => {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [modalForm] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'non-paket' | 'paket'>('non-paket')
  const [searchTindakan, setSearchTindakan] = useState('')
  const [searchPaket, setSearchPaket] = useState('')
  const [paketCache, setPaketCache] = useState<Record<number, any>>({})

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

  // Ambil rujukan jenis komponen untuk role nakes (Filter: isUntukMedis = true)
  const { data: listJenisKomponen = [], isLoading: isLoadingRoles } = useMasterJenisKomponenList({
    isUntukMedis: true,
    status: 'active'
  })

  const roleOptions = useMemo(() => {
    return listJenisKomponen.map((j) => ({
      label: j.label,
      value: j.kode
    }))
  }, [listJenisKomponen])

  const currentTindakanList = Form.useWatch('tindakanList', modalForm)
  const paketEntriesWatcher = Form.useWatch('paketEntries', modalForm)
  const getDetailMasterTindakan = (detail: any) => detail?.masterTindakan ?? detail?.tindakan ?? null
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
    const paketId = Number(rawPaketId)
    if (!Number.isFinite(paketId) || paketId <= 0) {
      modalForm.setFieldsValue({
        paketEntries: (modalForm.getFieldValue('paketEntries') || []).map((entry: any, idx: number) =>
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

    const currentEntries = modalForm.getFieldValue('paketEntries') || []
    currentEntries[entryIndex] = {
      ...(currentEntries[entryIndex] || {}),
      paketId: Number(selected.id),
      tindakanList: mappedTindakan,
      bhpList: mappedBhp
    }
    modalForm.setFieldValue('paketEntries', [...currentEntries])
    message.success(
      `Paket dimuat: ${mappedTindakan.length} tindakan dan ${mappedBhp.length} BHP`
    )
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

    if (Array.isArray(values?.paketEntries) && values.paketEntries.length > 0) {
      return values.paketEntries.flatMap((entry: any) => {
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
    }

    const petugasList = (values.petugasList ?? []).filter((p: any) => p?.pegawaiId && p?.roleTenaga)
    const hasSelectedPaket =
      Boolean(values?.paketId) ||
      (Array.isArray(values?.paketIds) && values.paketIds.length > 0)

    const items = values.tindakanList || []
    const globalBhpList = mapBhpList(values?.bhpList, hasSelectedPaket)
    const tindakanData = items
      .filter((item: any) => item?.masterTindakanId)
      .map((item: any) => ({
        bhpList: [] as {
          itemId: number
          jumlah: number
          satuan?: string | null
          includedInPaket: boolean
        }[],
        masterTindakanId: item.masterTindakanId,
        paketId: item.paketId,
        paketDetailId: item.paketDetailId,
        encounterId,
        patientId,
        tanggalTindakan: tanggal,
        jumlah: item.jumlah ?? 1,
        satuan: item.satuan,
        cyto: item.cyto ?? false,
        catatanTambahan: values.catatanTambahan,
        petugasList
      }))

    if (globalBhpList.length > 0 && tindakanData.length > 0) {
      tindakanData[0].bhpList = globalBhpList
    }

    return tindakanData
  }

  const handleSubmit = async (values: any) => {
    try {
      if (Array.isArray(values?.paketEntries) && values.paketEntries.length > 0) {
        const missingPetugasIdx = values.paketEntries.findIndex((entry: any) => {
          const hasEntryTindakan = (Array.isArray(entry?.tindakanList) ? entry.tindakanList : []).some(
            (item: any) => item?.masterTindakanId
          )
          if (!hasEntryTindakan) return false
          const entryPetugas = (entry?.petugasList ?? []).filter(
            (p: any) => p?.pegawaiId && p?.roleTenaga
          )
          return entryPetugas.length === 0
        })
        if (missingPetugasIdx >= 0) {
          message.error(`Minimal 1 tenaga medis pelaksana wajib diisi pada Paket #${missingPetugasIdx + 1}`)
          return
        }

        const invalidBhpIdx = values.paketEntries.findIndex((entry: any) =>
          (Array.isArray(entry?.bhpList) ? entry.bhpList : []).some(
            (bhp: any) =>
              bhp?.itemId &&
              (!Number.isFinite(Number(bhp?.jumlah)) ||
                Number(bhp.jumlah) <= 0 ||
                !Number.isInteger(Number(bhp.jumlah)))
          )
        )
        if (invalidBhpIdx >= 0) {
          message.error(`Jumlah BHP pada Paket #${invalidBhpIdx + 1} harus bilangan bulat (1, 2, 3, ...).`)
          return
        }
      } else {
        const petugasList = (values.petugasList ?? []).filter(
          (p: any) => p?.pegawaiId && p?.roleTenaga
        )
        if (petugasList.length === 0) {
          message.error('Minimal harus ada 1 tenaga medis pelaksana')
          return
        }

        const invalidBhpQty = (Array.isArray(values?.bhpList) ? values.bhpList : []).some(
          (bhp: any) =>
            bhp?.itemId &&
            (!Number.isFinite(Number(bhp?.jumlah)) ||
              Number(bhp.jumlah) <= 0 ||
              !Number.isInteger(Number(bhp.jumlah)))
        )
        if (invalidBhpQty) {
          message.error('Jumlah BHP harus bilangan bulat (1, 2, 3, ...).')
          return
        }
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
    setMode('non-paket')
    modalForm.setFieldsValue({
      assessment_date: dayjs(),
      petugasList: [{}],
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
      render: (val) =>
        new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0
        }).format(Number(val || 0))
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
          initialValues={{ assessment_date: dayjs(), petugasList: [{}] }}
        >
          <AssessmentHeader performers={performers || []} loading={isLoadingPerformers} />
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-sm">Mode Input:</span>
            <Radio.Group
              value={mode}
              onChange={(e) => {
                const nextMode = e.target.value as 'non-paket' | 'paket'
                setMode(nextMode)
                modalForm.setFieldsValue({
                  paketIds: [],
                  tindakanList: nextMode === 'non-paket' ? [{ jumlah: 1, cyto: false }] : [],
                  bhpList: [],
                  paketCytoGlobal: false,
                  paketEntries:
                    nextMode === 'paket'
                      ? [{ paketCytoGlobal: false, tindakanList: [], bhpList: [], petugasList: [{}] }]
                      : []
                })
              }}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="non-paket">
                <Space size={4}>
                  <UnorderedListOutlined />
                  Non-Paket
                </Space>
              </Radio.Button>
              <Radio.Button value="paket">
                <Space size={4}>
                  <AppstoreOutlined />
                  Paket Tindakan
                </Space>
              </Radio.Button>
            </Radio.Group>
          </div>

          <Divider style={{ margin: '0' }} />

          {mode === 'paket' && (
            <Card
              size="small"
              title={<span className="font-semibold">List Tindakan Paket</span>}
              extra={
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusCircleOutlined />}
                  onClick={() =>
                    (modalForm.getFieldValue('paketEntries') || []).length === 0
                      ? modalForm.setFieldValue('paketEntries', [
                          { paketCytoGlobal: false, tindakanList: [], bhpList: [], petugasList: [{}] }
                        ])
                      : modalForm.setFieldValue('paketEntries', [
                          ...(modalForm.getFieldValue('paketEntries') || []),
                          { paketCytoGlobal: false, tindakanList: [], bhpList: [], petugasList: [{}] }
                        ])
                  }
                >
                  Tambah Tindakan Paket
                </Button>
              }
            >
              <Form.List name="paketEntries">
                {(paketFields, { remove: removePaket }) => (
                  <div className="flex flex-col gap-4">
                    {paketFields.map((paketField, paketIndex) => (
                      <Card
                        key={paketField.key}
                        size="small"
                        className="border border-slate-200"
                        title={<span className="font-semibold">Paket #{paketIndex + 1}</span>}
                        extra={
                          paketFields.length > 1 ? (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<MinusCircleOutlined />}
                              onClick={() => removePaket(paketField.name)}
                            >
                              Hapus Paket
                            </Button>
                          ) : null
                        }
                      >
                        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[2fr_1fr] md:items-end">
                          <Form.Item
                            {...paketField}
                            name={[paketField.name, 'paketId']}
                            label={<span className="font-bold">Pilih Paket Tindakan</span>}
                            rules={[{ required: true, message: 'Pilih paket tindakan' }]}
                          >
                            <Select
                              showSearch
                              allowClear
                              placeholder="Pilih paket tindakan..."
                              filterOption={false}
                              onSearch={(val) => setSearchPaket(val)}
                              loading={isLoadingPaket}
                              options={paketOptions}
                              onChange={(val) => handlePaketEntryChange(paketField.name, Number(val))}
                              notFoundContent={isLoadingPaket ? <Spin size="small" /> : 'Paket tidak ditemukan'}
                            />
                          </Form.Item>
                          <Form.Item
                            {...paketField}
                            name={[paketField.name, 'paketCytoGlobal']}
                            label={<span className="font-bold">Cyto Global</span>}
                            valuePropName="checked"
                          >
                            <Switch
                              checkedChildren="Cyto"
                              unCheckedChildren="Tidak"
                              onChange={(checked) => {
                                const currentList =
                                  modalForm.getFieldValue([
                                    'paketEntries',
                                    paketField.name,
                                    'tindakanList'
                                  ]) || []
                                modalForm.setFieldValue(
                                  ['paketEntries', paketField.name, 'tindakanList'],
                                  currentList.map((item: any) => ({
                                    ...item,
                                    cyto: checked
                                  }))
                                )
                              }}
                            />
                          </Form.Item>
                        </div>

                        <Card
                          size="small"
                          className="mt-3"
                          title={<span className="font-semibold">Daftar Tindakan Paket</span>}
                        >
                          <Form.List name={[paketField.name, 'tindakanList']}>
                            {(tindakanFields) => (
                              <div className="flex flex-col gap-2">
                                {tindakanFields.length === 0 && (
                                  <div className="text-xs" style={{ color: token.colorTextSecondary }}>
                                    Pilih paket untuk memuat daftar tindakan paket.
                                  </div>
                                )}
                                {tindakanFields.map(({ key, name, ...restField }) => (
                                  <Row key={key} gutter={8} align="middle">
                                    <Col span={12}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'masterTindakanId']}
                                        label={name === 0 ? <span className="font-bold">Tindakan</span> : undefined}
                                        rules={[{ required: true, message: 'Pilih tindakan' }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Select
                                          showSearch
                                          disabled
                                          options={tindakanOptions}
                                          placeholder="Tindakan paket"
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'jumlah']}
                                        label={name === 0 ? <span className="font-bold">Jml</span> : undefined}
                                        rules={[{ required: true, message: 'Wajib' }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <InputNumber min={0.01} step={1} className="w-full" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'satuan']}
                                        label={name === 0 ? <span className="font-bold">Satuan</span> : undefined}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Input placeholder="cth: kali" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={2} className="flex items-end pb-0.5 justify-center">
                                      {name === 0 && <div className="h-[22px]" />}
                                    </Col>
                                  </Row>
                                ))}
                              </div>
                            )}
                          </Form.List>
                        </Card>

                        <Card size="small" className="mt-3" title={<span className="font-semibold">BHP</span>}>
                          <Form.List name={[paketField.name, 'bhpList']}>
                            {(fields, { add }) => (
                              <div className="flex flex-col gap-2">
                                {fields.length === 0 && (
                                  <div className="text-xs" style={{ color: token.colorTextTertiary }}>
                                    Belum ada BHP. Isi jika tindakan paket membutuhkan barang habis pakai.
                                  </div>
                                )}

                                {fields.map(({ key, name, ...restField }) => (
                                  <Row key={key} gutter={8} align="middle">
                                    <Col span={13}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'itemId']}
                                        rules={[{ required: true, message: 'Pilih item BHP' }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Select
                                          showSearch
                                          allowClear
                                          placeholder="Pilih item BHP"
                                          loading={isLoadingConsumableItems}
                                          options={consumableItemOptions}
                                          optionFilterProp="searchLabel"
                                          filterOption={(input, option) =>
                                            String(option?.searchLabel ?? '')
                                              .toLowerCase()
                                              .includes(input.toLowerCase())
                                          }
                                          notFoundContent={
                                            isLoadingConsumableItems ? (
                                              <Spin size="small" />
                                            ) : (
                                              'Item consumable tidak ditemukan'
                                            )
                                          }
                                          onChange={(value) => {
                                            if (!value) return
                                            const selectedItem = consumableItemMap.get(Number(value))
                                            if (!selectedItem) return

                                            const currentSatuan = modalForm.getFieldValue([
                                              'paketEntries',
                                              paketField.name,
                                              'bhpList',
                                              name,
                                              'satuan'
                                            ])
                                            if (!currentSatuan && selectedItem.kodeUnit) {
                                              modalForm.setFieldValue(
                                                ['paketEntries', paketField.name, 'bhpList', name, 'satuan'],
                                                selectedItem.kodeUnit
                                              )
                                            }
                                          }}
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={3}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'jumlah']}
                                        rules={[
                                          { required: true, message: 'Wajib' },
                                          {
                                            validator: async (_rule, value) => {
                                              if (value === undefined || value === null) return
                                              if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
                                                throw new Error('Harus bilangan bulat')
                                              }
                                            }
                                          }
                                        ]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <InputNumber min={1} step={1} precision={0} className="w-full" />
                                      </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                      <Form.Item {...restField} name={[name, 'satuan']} style={{ marginBottom: 0 }}>
                                        <Input placeholder="Satuan" />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                ))}

                                <Button
                                  type="dashed"
                                  size="small"
                                  icon={<PlusCircleOutlined />}
                                  onClick={() => add({ jumlah: 1, includedInPaket: true })}
                                  className="mt-1"
                                >
                                  Tambah BHP
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </Card>

                        <Card
                          size="small"
                          className="mt-3"
                          title={<span className="font-semibold">Tenaga Medis Pelaksana</span>}
                        >
                          <Form.List name={[paketField.name, 'petugasList']}>
                            {(fields, { add, remove }) => (
                              <div className="flex flex-col gap-2">
                                {fields.map(({ key, name, ...restField }) => (
                                  <Row key={key} gutter={8} align="middle">
                                    <Col span={12}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'pegawaiId']}
                                        label={name === 0 ? <span className="font-bold">Nama Petugas</span> : undefined}
                                        rules={[{ required: true, message: 'Pilih petugas' }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Select
                                          showSearch
                                          allowClear
                                          placeholder="Pilih tenaga medis..."
                                          loading={isLoadingPerformers}
                                          optionFilterProp="children"
                                          filterOption={(input, option) =>
                                            (option?.children as unknown as string)
                                              .toLowerCase()
                                              .includes(input.toLowerCase())
                                          }
                                        >
                                          {performers.map((p) => (
                                            <Select.Option key={p.id} value={p.id}>
                                              {p.name}
                                            </Select.Option>
                                          ))}
                                        </Select>
                                      </Form.Item>
                                    </Col>
                                    <Col span={9}>
                                      <Form.Item
                                        {...restField}
                                        name={[name, 'roleTenaga']}
                                        label={name === 0 ? <span className="font-bold">Role / Peran</span> : undefined}
                                        rules={[{ required: true, message: 'Pilih role' }]}
                                        style={{ marginBottom: 0 }}
                                      >
                                        <Select
                                          placeholder="Pilih role..."
                                          options={roleOptions}
                                          loading={isLoadingRoles}
                                          allowClear
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={3} className="flex items-end pb-0.5">
                                      {name === 0 && <div className="h-[22px]" />}
                                      {fields.length > 1 && (
                                        <Tooltip title="Hapus petugas">
                                          <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<MinusCircleOutlined />}
                                            onClick={() => remove(name)}
                                          />
                                        </Tooltip>
                                      )}
                                    </Col>
                                  </Row>
                                ))}
                                <Button
                                  type="dashed"
                                  size="small"
                                  icon={<PlusCircleOutlined />}
                                  onClick={() => add()}
                                  className="mt-1"
                                >
                                  Tambah Petugas
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </Card>

                        <Form.Item
                          {...paketField}
                          name={[paketField.name, 'catatanTambahan']}
                          label={<span className="font-bold">Catatan</span>}
                          className="mt-3 mb-0"
                        >
                          <TextArea rows={3} placeholder="Catatan tambahan tindakan paket..." />
                        </Form.Item>
                      </Card>
                    ))}
                  </div>
                )}
              </Form.List>
            </Card>
          )}

          {mode !== 'paket' && (
            <>
              {/* Dynamic Form List untuk Tindakan */}
              <Card
                size="small"
                title={
                  <span className="font-semibold">Tindakan Non-Paket</span>
                }
              >
                <Form.List name="tindakanList">
                  {(fields, { add, remove }) => (
                    <div className="flex flex-col gap-2">
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} align="middle">
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'masterTindakanId']}
                          label={
                            name === 0 ? <span className="font-bold">Tindakan</span> : undefined
                          }
                          rules={[{ required: true, message: 'Pilih tindakan' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            showSearch
                            allowClear
                            placeholder="Cari tindakan..."
                            filterOption={false}
                            onSearch={(val) => setSearchTindakan(val)}
                            loading={isLoadingMaster}
                            options={tindakanOptions}
                            onChange={() => {
                              // Jika user ganti tindakan manual, hapus referensi paket agar tidak salah harga
                              const currentList = modalForm.getFieldValue('tindakanList') || []
                              if (currentList[name]) {
                                currentList[name].paketId = undefined
                                currentList[name].paketDetailId = undefined
                                modalForm.setFieldValue('tindakanList', [...currentList])
                              }
                            }}
                            notFoundContent={
                              isLoadingMaster ? <Spin size="small" /> : 'Tindakan tidak ditemukan'
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'jumlah']}
                          label={name === 0 ? <span className="font-bold">Jml</span> : undefined}
                          rules={[{ required: true, message: 'Wajib' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0.01} step={1} className="w-full" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'satuan']}
                          label={name === 0 ? <span className="font-bold">Satuan</span> : undefined}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="cth: kali" />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'cyto']}
                          valuePropName="checked"
                          label={
                            name === 0 ? (
                              <span className="font-bold flex justify-center">Cyto</span>
                            ) : undefined
                          }
                          style={{ marginBottom: 0 }}
                          className="flex items-center justify-center w-full"
                        >
                          <Switch size="small" checkedChildren="Cyto" unCheckedChildren="Tidak" />
                        </Form.Item>
                      </Col>
                      <Col span={2} className="flex items-end pb-0.5 justify-center">
                        {name === 0 && <div className="h-[22px]" />}
                        {fields.length > 1 && (
                          <Tooltip title="Hapus tindakan">
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(name)}
                            />
                          </Tooltip>
                        )}
                      </Col>
                    </Row>
                  ))}
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusCircleOutlined />}
                    onClick={() => add({ jumlah: 1 })}
                    className="mt-2"
                  >
                    Tambah Tindakan
                  </Button>
                </div>
              )}
            </Form.List>
              </Card>

              <Card
                size="small"
                title={<span className="font-semibold">BHP</span>}
              >
            <Form.List name="bhpList">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-2">
                  {fields.length === 0 && (
                    <div className="text-xs" style={{ color: token.colorTextTertiary }}>
                      Belum ada BHP. Isi jika tindakan membutuhkan barang habis pakai.
                    </div>
                  )}

                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} align="middle">
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'itemId']}
                          rules={[{ required: true, message: 'Pilih item BHP' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            showSearch
                            allowClear
                            placeholder="Pilih item BHP"
                            loading={isLoadingConsumableItems}
                            options={consumableItemOptions}
                            optionFilterProp="searchLabel"
                            filterOption={(input, option) =>
                              String(option?.searchLabel ?? '')
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            notFoundContent={
                              isLoadingConsumableItems ? (
                                <Spin size="small" />
                              ) : (
                                'Item consumable tidak ditemukan'
                              )
                            }
                            onChange={(value) => {
                              if (!value) return
                              const selectedItem = consumableItemMap.get(Number(value))
                              if (!selectedItem) return

                              const currentSatuan = modalForm.getFieldValue(['bhpList', name, 'satuan'])
                              if (!currentSatuan && selectedItem.kodeUnit) {
                                modalForm.setFieldValue(['bhpList', name, 'satuan'], selectedItem.kodeUnit)
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3}>
                        <Form.Item
                          {...restField}
                          name={[name, 'jumlah']}
                          rules={[
                            { required: true, message: 'Wajib' },
                            {
                              validator: async (_rule, value) => {
                                if (value === undefined || value === null) return
                                if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
                                  throw new Error('Harus bilangan bulat')
                                }
                              }
                            }
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            min={1}
                            step={1}
                            precision={0}
                            className="w-full"
                            placeholder="Qty"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item {...restField} name={[name, 'satuan']} style={{ marginBottom: 0 }}>
                          <Input placeholder="Satuan" />
                        </Form.Item>
                      </Col>
                      <>
                        <Col span={5}>
                          <Tooltip
                            title="Included = BHP sudah termasuk tarif paket, Terpisah = ditagih terpisah."
                          >
                            <Form.Item
                              {...restField}
                              name={[name, 'includedInPaket']}
                              valuePropName="checked"
                              style={{ marginBottom: 0 }}
                            >
                              <Switch
                                size="small"
                                checkedChildren="Included"
                                unCheckedChildren="Terpisah"
                              />
                            </Form.Item>
                          </Tooltip>
                        </Col>
                        <Col span={2} className="text-center">
                          <Tooltip title="Hapus BHP">
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(name)}
                            />
                          </Tooltip>
                        </Col>
                      </>
                    </Row>
                  ))}

                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusCircleOutlined />}
                    onClick={() => add({ jumlah: 1, includedInPaket: false })}
                    className="mt-1"
                  >
                    Tambah BHP
                  </Button>

                </div>
              )}
            </Form.List>
              </Card>

              {/* Tenaga Medis Pelaksana — Form.List */}
              <Card size="small" title={<span className="font-semibold">Tenaga Medis Pelaksana</span>}>
            <Form.List name="petugasList">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-2">
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={8} align="middle">
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'pegawaiId']}
                          label={
                            name === 0 ? <span className="font-bold">Nama Petugas</span> : undefined
                          }
                          rules={[{ required: true, message: 'Pilih petugas' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            showSearch
                            allowClear
                            placeholder="Pilih tenaga medis..."
                            loading={isLoadingPerformers}
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              (option?.children as unknown as string)
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                          >
                            {performers.map((p) => (
                              <Select.Option key={p.id} value={p.id}>
                                {p.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={9}>
                        <Form.Item
                          {...restField}
                          name={[name, 'roleTenaga']}
                          label={
                            name === 0 ? <span className="font-bold">Role / Peran</span> : undefined
                          }
                          rules={[{ required: true, message: 'Pilih role' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder="Pilih role..."
                            options={roleOptions}
                            loading={isLoadingRoles}
                            allowClear
                          />
                        </Form.Item>
                      </Col>
                      <Col span={3} className="flex items-end pb-0.5">
                        {name === 0 && <div className="h-[22px]" />}
                        {fields.length > 1 && (
                          <Tooltip title="Hapus petugas">
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<MinusCircleOutlined />}
                              onClick={() => remove(name)}
                            />
                          </Tooltip>
                        )}
                      </Col>
                    </Row>
                  ))}
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusCircleOutlined />}
                    onClick={() => add()}
                    className="mt-1"
                  >
                    Tambah Petugas
                  </Button>
                </div>
              )}
            </Form.List>
              </Card>

              <Form.Item name="catatanTambahan" label={<span className="font-bold">Catatan</span>}>
                <TextArea rows={3} placeholder="Catatan tambahan tindakan..." />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default DetailTindakanForm
