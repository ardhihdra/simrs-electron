import { FileSearchOutlined, ImportOutlined } from '@ant-design/icons'
import { Button, InputNumber, Modal, Select, Table, Tag, Tooltip, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { formatRupiah, type PurchaseItemRow } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PriceRule {
    unitCode: string
    qty: number
    price: number
}

interface ItemFull {
    kode: string
    nama?: string
    sellingPrice?: number | null
    sellPriceRules?: PriceRule[] | null
}

interface MRItem {
    id: number
    itemId?: number | null
    status: string
    patientId?: string
    authoredOn?: string
    note?: string | null
    groupIdentifier?: { system?: string; value?: string } | null
    dispenseRequest?: { quantity?: { value?: number; unit?: string } } | null
    item?: {
        id?: number
        kode?: string
        nama?: string
        sellingPrice?: number | null
        sellPriceRules?: PriceRule[] | null
    } | null
    medication?: { id?: number; name?: string } | null
    patient?: { name?: string | Array<{ text?: string }> } | null
    supportingInformation?: Array<{
        itemId?: number
        quantity?: number
        unitCode?: string | null
        instruction?: string
    }> | null
}

interface GroupRow {
    groupKey: string
    label: string
    patientName: string
    items: MRItem[]
}

interface MRChoice {
    priceRule: PriceRule | null
    qty: number
    satuan: string
}


const getPatientName = (patient: MRItem['patient']): string => {
    if (!patient) return '—'
    if (typeof patient.name === 'string') return patient.name
    if (Array.isArray(patient.name) && patient.name.length > 0)
        return patient.name[0].text ?? '—'
    return '—'
}

const statusColor = (s: string) =>
    s === 'active' ? 'green' : s === 'completed' ? 'blue' : 'red'

const getBasePrice = (item: ItemFull | null): number => {
    if (!item) return 0
    if (item.sellingPrice != null && item.sellingPrice > 0) return item.sellingPrice
    if (Array.isArray(item.sellPriceRules) && item.sellPriceRules.length > 0)
        return item.sellPriceRules[0].price
    return 0
}

const resolveItem = (mr: MRItem, byKode: Map<string, ItemFull>, byId: Map<string, ItemFull>): ItemFull | null => {
    if (mr.itemId != null) {
        const fromId = byId.get(String(mr.itemId))
        if (fromId) return fromId
    }
    const kode = mr.item?.kode ?? ''
    if (kode) {
        const fromMap = byKode.get(kode)
        if (fromMap) return {
            ...fromMap,
            sellPriceRules: (Array.isArray(mr.item?.sellPriceRules) && mr.item!.sellPriceRules!.length > 0)
                ? mr.item!.sellPriceRules!
                : (fromMap.sellPriceRules ?? null)
        }
    }
    return null
}

const getDefaultRule = (item: ItemFull | null): PriceRule | null => {
    if (!item) return null
    if (Array.isArray(item.sellPriceRules) && item.sellPriceRules.length > 0)
        return item.sellPriceRules[0]
    return null
}

const getEffectiveHarga = (choice: MRChoice | undefined, item: ItemFull | null): number => {
    if (choice?.priceRule) return choice.priceRule.price
    return getBasePrice(item)
}

const getEffectiveSatuan = (choice: MRChoice | undefined, mr: MRItem): string => {
    if (choice?.priceRule) return choice.priceRule.unitCode.toUpperCase()
    return mr.dispenseRequest?.quantity?.unit?.toUpperCase() ?? 'PCS'
}

interface Props {
    open: boolean
    onClose: () => void
    onImport: (rows: PurchaseItemRow[]) => void
}

export function ImportFromMRModal({ open, onClose, onImport }: Props) {
    const [loading, setLoading] = useState(false)
    const [groups, setGroups] = useState<GroupRow[]>([])
    const [fullItemMap, setFullItemMap] = useState<Map<string, ItemFull>>(new Map())     // key: kode
    const [fullItemMapById, setFullItemMapById] = useState<Map<string, ItemFull>>(new Map()) // key: id string
    const [choices, setChoices] = useState<Map<number, MRChoice>>(new Map())
    const [compChoices, setCompChoices] = useState<Map<string, MRChoice>>(new Map())
    const [selectedMRIds, setSelectedMRIds] = useState<number[]>([])

    const handleFetch = async () => {
        setLoading(true)
        setGroups([])
        setSelectedMRIds([])
        setChoices(new Map())
        setCompChoices(new Map())
        setFullItemMap(new Map())
        setFullItemMapById(new Map())
        try {
            const api = window.api?.query as {
                medicationRequest?: {
                    list: (a: { items?: number }) => Promise<{ success: boolean; data?: MRItem[]; error?: string }>
                }
                item?: {
                    list: () => Promise<{ success: boolean; result?: ItemFull[]; message?: string }>
                }
            }

            const [mrRes, itemRes] = await Promise.allSettled([
                api.medicationRequest?.list({ items: 200 }),
                api.item?.list()
            ])
            const builtMap = new Map<string, ItemFull>()       // kode → item
            const builtMapById = new Map<string, ItemFull>()   // id   → item
            if (itemRes.status === 'fulfilled' && itemRes.value?.result) {
                for (const it of itemRes.value.result as any[]) {
                    const entry: ItemFull = {
                        kode: it.kode ?? '',
                        nama: it.nama,
                        sellingPrice: it.sellingPrice ?? null,
                        sellPriceRules: Array.isArray(it.sellPriceRules) ? it.sellPriceRules : null
                    }
                    if (it.kode) builtMap.set(it.kode, entry)
                    if (it.id != null) builtMapById.set(String(it.id), entry)
                }
            }
            setFullItemMap(builtMap)
            setFullItemMapById(builtMapById)

            if (mrRes.status === 'rejected' || !mrRes.value?.success) {
                message.error(mrRes.status === 'fulfilled' ? (mrRes.value?.error ?? 'Gagal memuat MR') : 'Gagal memuat MR')
                return
            }
            const source = (mrRes.value?.data ?? []).filter(r => r.status === 'active')
            const initChoices = new Map<number, MRChoice>()
            const initCompChoices = new Map<string, MRChoice>()

            for (const mr of source) {
                const merged = resolveItem(mr, builtMap, builtMapById)
                const preRules = merged?.sellPriceRules ?? []
                initChoices.set(mr.id, {
                    priceRule: preRules.length > 0 ? preRules[0] : null,
                    qty: mr.dispenseRequest?.quantity?.value ?? 1,
                    satuan: preRules.length > 0 ? preRules[0].unitCode.toUpperCase() : (mr.dispenseRequest?.quantity?.unit?.toUpperCase() ?? 'PCS')
                })

                // Populate compChoices untuk racikan
                if ((mr.supportingInformation ?? []).length > 0) {
                    for (const comp of mr.supportingInformation!) {
                        const idStr = String(comp.itemId ?? '')
                        const compItem = builtMapById.get(idStr)
                        const rules = compItem?.sellPriceRules ?? []
                        const key = `${mr.id}__${idStr}`
                        initCompChoices.set(key, {
                            priceRule: rules.length > 0 ? rules[0] : null,
                            qty: comp.quantity ?? 1,
                            satuan: rules.length > 0 ? rules[0].unitCode.toUpperCase() : (comp.unitCode?.toUpperCase() ?? 'PCS')
                        })
                    }
                }
            }
            setChoices(initChoices)
            setCompChoices(initCompChoices)

            if (source.length > 0) {
                console.log('[ImportFromMRModal] FIRST MR FULL:', JSON.stringify(source[0], null, 2))
                const firstResolved = resolveItem(source[0], builtMap, builtMapById)
                console.log('[ImportFromMRModal] FIRST MR RESOLVED:', JSON.stringify(firstResolved, null, 2))
                console.log('[ImportFromMRModal] FIRST MR BASE PRICE:', getBasePrice(firstResolved))
            }
            console.log('[ImportFromMRModal] builtMapById size:', builtMapById.size)

            const groupMap = new Map<string, GroupRow>()
            for (const mr of source) {
                const gVal = mr.groupIdentifier?.value?.trim()
                const gKey = gVal || `__TANPA-${mr.patientId ?? mr.id}`
                const label = gVal ?? 'Tanpa Grup Resep'
                if (!groupMap.has(gKey)) {
                    groupMap.set(gKey, { groupKey: gKey, label, patientName: getPatientName(mr.patient), items: [] })
                }
                groupMap.get(gKey)!.items.push(mr)
            }
            setGroups(Array.from(groupMap.values()))
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    const updateChoice = (mrId: number, ruleKey: string, mr: MRItem) => {
        setChoices(prev => {
            const next = new Map(prev)
            const cur = next.get(mrId)
            const curQty = cur?.qty ?? mr.dispenseRequest?.quantity?.value ?? 1
            if (ruleKey === 'DEFAULT') {
                next.set(mrId, {
                    priceRule: null,
                    qty: curQty,
                    satuan: mr.dispenseRequest?.quantity?.unit?.toUpperCase() ?? 'PCS'
                })
            } else {
                const item = resolveItem(mr, fullItemMap, fullItemMapById)
                const rules = item?.sellPriceRules ?? []
                const found = rules.find(r => `${r.unitCode}|${r.qty}|${r.price}` === ruleKey) ?? null
                next.set(mrId, {
                    priceRule: found,
                    qty: curQty,
                    satuan: found?.unitCode.toUpperCase() ?? 'PCS'
                })
            }
            return next
        })
    }

    const toggleMR = (mrId: number) =>
        setSelectedMRIds(prev => prev.includes(mrId) ? prev.filter(id => id !== mrId) : [...prev, mrId])

    const updateQty = (mrId: number, val: number) => {
        setChoices(prev => {
            const next = new Map(prev)
            const cur = next.get(mrId)
            if (cur) next.set(mrId, { ...cur, qty: val > 0 ? val : 1 })
            return next
        })
    }

    const updateCompChoice = (mrId: number, compItemId: string | number, ruleKey: string) => {
        setCompChoices(prev => {
            const next = new Map(prev)
            const key = `${mrId}__${compItemId}`
            const cur = next.get(key)
            const curQty = cur?.qty ?? 1
            if (ruleKey === 'DEFAULT') {
                next.set(key, { priceRule: null, qty: curQty, satuan: 'PCS' })
            } else {
                const compItem = fullItemMapById.get(String(compItemId))
                const rules = compItem?.sellPriceRules ?? []
                const found = rules.find(r => `${r.unitCode}|${r.qty}|${r.price}` === ruleKey) ?? null
                next.set(key, {
                    priceRule: found,
                    qty: curQty,
                    satuan: found?.unitCode.toUpperCase() ?? 'PCS'
                })
            }
            return next
        })
    }

    const updateCompQty = (mrId: number, compItemId: string | number, val: number) => {
        setCompChoices(prev => {
            const next = new Map(prev)
            const key = `${mrId}__${compItemId}`
            const cur = next.get(key)
            if (cur) next.set(key, { ...cur, qty: val > 0 ? val : 1 })
            return next
        })
    }

    const toggleGroup = (g: GroupRow) => {
        const ids = g.items.map(m => m.id)
        const allSel = ids.every(id => selectedMRIds.includes(id))
        setSelectedMRIds(prev => allSel
            ? prev.filter(id => !ids.includes(id))
            : [...new Set([...prev, ...ids])]
        )
    }

    const handleImport = () => {
        if (selectedMRIds.length === 0) { message.warning('Pilih minimal satu MR.'); return }
        const allMRs = groups.flatMap(g => g.items)
        const selected = allMRs.filter(mr => selectedMRIds.includes(mr.id))
        const result: PurchaseItemRow[] = []
        const seen = new Map<string, number>()

        for (const mr of selected) {
            const choice = choices.get(mr.id)
            const si = mr.supportingInformation ?? []

            if (si.length > 0) {
                // Racikan → 1 baris per MR (unik per mrId)
                const totalHarga = si.reduce((s, comp) => {
                    const idStr = String(comp.itemId ?? '')
                    const compKey = `${mr.id}__${idStr}`
                    const cChoice = compChoices.get(compKey)
                    const compItem = fullItemMapById.get(idStr)
                    const p = getEffectiveHarga(cChoice, compItem ?? null)
                    const q = cChoice?.qty ?? comp.quantity ?? 1
                    return s + (p * q)
                }, 0)
                const kode = mr.item?.kode ?? `MR${mr.id}`
                const satuan = choice?.satuan ?? 'RESEP'
                const qty = choice?.qty ?? 1
                const rowKey = `mr${mr.id}__racikan`  // unik per MR, tidak di-merge
                mergeRow(result, seen, rowKey, {
                    key: rowKey, kode,
                    nama: `Racikan — ${mr.item?.nama ?? kode}`,
                    harga: totalHarga, qty, satuan, subTotal: totalHarga * qty,
                    mrId: mr.id,
                    sellPriceRules: null, // racikan tidak ada pihan harga luar rules item
                    basePrice: totalHarga
                })
            } else {
                const item = resolveItem(mr, fullItemMap, fullItemMapById)
                const kode = item?.kode ?? String(mr.itemId ?? '')
                if (!kode) continue
                const harga = getEffectiveHarga(choice, item)
                const satuan = getEffectiveSatuan(choice, mr)
                const qty = choice?.qty ?? 1
                const rowKey = `mr${mr.id}__${kode}__${satuan}`  // unik per MR
                mergeRow(result, seen, rowKey, {
                    key: rowKey, kode,
                    nama: item?.nama ?? kode,
                    harga, qty, satuan, subTotal: harga * qty,
                    mrId: mr.id,
                    sellPriceRules: item?.sellPriceRules ?? null,
                    basePrice: item?.sellingPrice ?? null
                })
            }
        }
        if (result.length === 0) { message.warning('Tidak ada item yang bisa diimport.'); return }
        onImport(result)
        onClose()
        setSelectedMRIds([])
        message.success(`${result.length} item berhasil diimport ke keranjang!`)
    }

    const mrColumns: ColumnsType<MRItem> = [
        {
            title: '', key: 'cb', width: 40,
            render: (_: unknown, mr: MRItem) => (
                <input type="checkbox" checked={selectedMRIds.includes(mr.id)} onChange={() => toggleMR(mr.id)} />
            )
        },
        {
            title: 'Status', dataIndex: 'status', width: 80,
            render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag>
        },
        {
            title: 'Item / Obat', key: 'item',
            render: (_: unknown, mr: MRItem) => {
                const si = mr.supportingInformation ?? []
                const item = resolveItem(mr, fullItemMap, fullItemMapById)
                const nama = item?.nama ?? mr.medication?.name ?? '—'
                return (
                    <div>
                        <div className="font-medium">{nama}</div>
                        {si.length > 0 && <Tag color="purple" className="text-xs mt-0.5">Racikan {si.length} komp.</Tag>}
                        {mr.note && <div className="text-xs text-gray-400">{mr.note}</div>}
                    </div>
                )
            }
        },
        {
            title: (
                <Tooltip title="Pilih satuan dan harga dari sellPriceRules. Harga bisa berbeda per satuan.">
                    Satuan &amp; Harga <span className="text-blue-400">▾</span>
                </Tooltip>
            ),
            key: 'price', width: 300,
            render: (_: unknown, mr: MRItem) => {
                const si = mr.supportingInformation ?? []
                if (si.length > 0) {
                    const totalHarga = si.reduce((s, comp) => {
                        const fromId = fullItemMapById.get(String(comp.itemId ?? ''))
                        const price = getBasePrice(fromId ?? null)
                        return s + price * (comp.quantity ?? 1)
                    }, 0)
                    return (
                        <div className="text-xs text-purple-600">
                            Total komp: <span className="font-semibold">{formatRupiah(totalHarga)}</span>
                            <div className="text-gray-400 text-xs">+ biaya racikan diisi di pembayaran</div>
                        </div>
                    )
                }

                const item = resolveItem(mr, fullItemMap, fullItemMapById)
                const rules = item?.sellPriceRules ?? []
                const choice = choices.get(mr.id)
                const currentKey = choice?.priceRule
                    ? `${choice.priceRule.unitCode}|${choice.priceRule.qty}|${choice.priceRule.price}`
                    : 'DEFAULT'

                const defaultPrice = getBasePrice(item)
                const options: { value: string; label: string }[] = []
                if (defaultPrice > 0) {
                    options.push({ value: 'DEFAULT', label: `Default — 1 Unit = ${formatRupiah(defaultPrice)}` })
                }
                for (const r of rules) {
                    options.push({
                        value: `${r.unitCode}|${r.qty}|${r.price}`,
                        label: `${r.unitCode.toUpperCase()} (per ${r.qty}) = ${formatRupiah(r.price)}`
                    })
                }

                if (options.length === 0) {
                    return <span className="text-orange-500 text-xs">Harga tidak ditemukan</span>
                }
                return (
                    <Select
                        size="small"
                        value={currentKey}
                        options={options}
                        onChange={(v) => updateChoice(mr.id, v, mr)}
                        className="w-full"
                    />
                )
            }
        },
        {
            title: 'Qty (edit)', key: 'qty', width: 130, align: 'center',
            render: (_: unknown, mr: MRItem) => {
                const c = choices.get(mr.id)
                const dispOriginal = mr.dispenseRequest?.quantity?.value
                return (
                    <div className="flex flex-col items-center gap-0.5">
                        <InputNumber
                            size="small"
                            min={1}
                            max={dispOriginal ?? 9999}
                            value={c?.qty ?? 1}
                            onChange={(v) => updateQty(mr.id, typeof v === 'number' ? v : 1)}
                            className="w-20"
                        />
                        {dispOriginal != null && (
                            <span className="text-xs text-gray-400">maks {dispOriginal} {c?.satuan ?? ''}</span>
                        )}
                    </div>
                )
            }
        },
        {
            title: 'Subtotal', key: 'sub', width: 120, align: 'right',
            render: (_: unknown, mr: MRItem) => {
                const choice = choices.get(mr.id)
                const si = mr.supportingInformation ?? []
                if (si.length > 0) {
                    const totalHarga = si.reduce((s, comp) => {
                        const fromId = fullItemMapById.get(String(comp.itemId ?? ''))
                        const price = getBasePrice(fromId ?? null)
                        return s + price * (comp.quantity ?? 1)
                    }, 0)
                    return <span className="font-semibold">{formatRupiah(totalHarga * (choice?.qty ?? 1))}</span>
                }
                const item = resolveItem(mr, fullItemMap, fullItemMapById)
                const harga = getEffectiveHarga(choice, item)
                return <span className="font-semibold">{formatRupiah(harga * (choice?.qty ?? 1))}</span>
            }
        }
    ]

    const mrExpandable = {
        rowExpandable: (mr: MRItem) => (mr.supportingInformation?.length ?? 0) > 0,
        expandedRowRender: (mr: MRItem) => (
            <div className="ml-6 my-1 bg-purple-50 rounded p-2">
                <div className="text-xs font-semibold text-purple-700 mb-1">Komponen Racikan:</div>
                <table className="text-xs w-full">
                    <thead>
                        <tr className="text-gray-500 border-b">
                            <th className="text-left py-1">Item Component</th>
                            <th className="text-left py-1">Satuan &amp; Harga</th>
                            <th className="text-right py-1">Qty (edit)</th>
                            <th className="text-right py-1">Sub Total</th>
                            <th className="text-left py-1 pl-3">Instruksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(mr.supportingInformation ?? []).map((comp, i) => {
                            const idStr = String(comp.itemId ?? '')
                            const compItem = fullItemMapById.get(idStr)
                            const compKey = `${mr.id}__${idStr}`
                            const cChoice = compChoices.get(compKey)

                            const rules = compItem?.sellPriceRules ?? []
                            const currentHarga = getEffectiveHarga(cChoice, compItem ?? null)
                            const currentQty = cChoice?.qty ?? comp.quantity ?? 1
                            const base = getBasePrice(compItem ?? null)

                            return (
                                <tr key={i} className="border-b last:border-0">
                                    <td className="py-2">
                                        {compItem?.nama && <div className="font-medium">{compItem.nama}</div>}
                                    </td>
                                    <td className="py-2 pr-2">
                                        <Select
                                            size="small"
                                            className="w-full min-w-[140px]"
                                            value={cChoice?.priceRule ? `${cChoice.priceRule.unitCode}|${cChoice.priceRule.qty}|${cChoice.priceRule.price}` : `DEFAULT|1|${base}`}
                                            onChange={(v) => updateCompChoice(mr.id, idStr, v)}
                                            options={[
                                                ...(base > 0 ? [{ value: `DEFAULT|1|${base}`, label: `Default = ${formatRupiah(base)}` }] : []),
                                                ...rules.map(r => ({
                                                    value: `${r.unitCode}|${r.qty}|${r.price}`,
                                                    label: `${r.unitCode.toUpperCase()} = ${formatRupiah(r.price)}`
                                                }))
                                            ]}
                                        />
                                    </td>
                                    <td className="py-2 text-right">
                                        <InputNumber
                                            size="small"
                                            min={1}
                                            value={currentQty}
                                            onChange={(v) => updateCompQty(mr.id, idStr, Number(v) || 1)}
                                            className="w-20"
                                        />
                                    </td>
                                    <td className="text-right py-2 text-purple-700 font-semibold">{formatRupiah(currentHarga * currentQty)}</td>
                                    <td className="py-2 pl-3 text-gray-400">{comp.instruction ?? '—'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    }

    const groupColumns: ColumnsType<GroupRow> = [
        {
            title: 'Grup Resep', key: 'label',
            render: (_: unknown, g: GroupRow) => {
                const ids = g.items.map(m => m.id)
                const allSel = ids.every(id => selectedMRIds.includes(id))
                const someSel = ids.some(id => selectedMRIds.includes(id))
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={allSel}
                            ref={el => { if (el) el.indeterminate = someSel && !allSel }}
                            onChange={() => toggleGroup(g)}
                        />
                        <div>
                            <span className="font-semibold text-blue-600">{g.patientName}</span>
                            <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-1 rounded border border-blue-100">
                                {ids.filter(id => selectedMRIds.includes(id)).length}/{ids.length} dipilih
                            </span>
                        </div>
                    </div>
                )
            }
        }
    ]

    return (
        <Modal
            open={open}
            title={<><ImportOutlined className="mr-2" />Import dari Resep Dokter (MR)</>}
            onCancel={() => { onClose(); setSelectedMRIds([]) }}
            footer={
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{selectedMRIds.length} item dipilih</span>
                    <div className="flex gap-2">
                        <Button onClick={() => { onClose(); setSelectedMRIds([]) }}>Batal</Button>
                        <Button type="primary" icon={<ImportOutlined />} disabled={selectedMRIds.length === 0} onClick={handleImport}>
                            Import ke Keranjang
                        </Button>
                    </div>
                </div>
            }
            width={1020}
            afterOpenChange={(vis) => { if (vis) handleFetch() }}
        >

            {groups.length === 0 && !loading && (
                <div className="text-center text-gray-400 py-10">
                    <FileSearchOutlined className="text-4xl mb-2 block" />
                    <div>Tidak ada MR aktif ditemukan</div>
                </div>
            )}

            <Table<GroupRow>
                rowKey="groupKey"
                columns={groupColumns}
                dataSource={groups}
                loading={loading}
                size="small"
                pagination={false}
                showHeader={false}
                expandable={{
                    defaultExpandAllRows: true,
                    expandedRowRender: (g) => (
                        <div className="pl-4 pb-2">
                            <Table<MRItem>
                                rowKey="id"
                                columns={mrColumns}
                                dataSource={g.items}
                                size="small"
                                pagination={false}
                                expandable={mrExpandable}
                                rowClassName={(mr) =>
                                    selectedMRIds.includes(mr.id) ? 'bg-blue-50' : ''
                                }
                            />
                        </div>
                    )
                }}
            />
        </Modal>
    )
}


function mergeRow(result: PurchaseItemRow[], seen: Map<string, number>, key: string, row: PurchaseItemRow) {
    const idx = seen.get(key)
    if (idx !== undefined) {
        result[idx].qty += row.qty
        result[idx].subTotal = result[idx].harga * result[idx].qty
    } else {
        seen.set(key, result.length)
        result.push({ ...row })
    }
}
