import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { rpc, client } from '@renderer/utils/client'
import {
  Button,
  Divider,
  Spin,
  Table,
  Tag,
  Typography,
  Select,
  InputNumber,
  Card,
  Row,
  Col,
  Statistic,
  Modal,
  App,
  Alert,
  Switch,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { RPCSelectAsync } from '@renderer/components/organisms/RPCSelectAsync'

const { Title, Text } = Typography

type PayorType = 'bpjs' | 'insurance' | 'company' | 'hospital' | 'patient'

interface AllocationRow {
  id: number
  description: string
  category: string
  qty: number
  unitPrice: number
  totalAmount: number
  asuransi: number
  asuransiPercent: number
  rs: number
  rsPercent: number
  pasien: number
  mitraId?: number | null
  note?: string | null
}

/**
 * A local-state managed InputNumber that only notifies parent after a delay or on blur
 * This prevents the heavy total-table re-render on every keystroke
 */
const DebouncedInputNumber = ({
  value,
  onChange,
  debounceMs = 300,
  ...props
}: {
  value: number;
  onChange: (val: number) => void;
  debounceMs?: number;
} & any) => {
  const [localValue, setLocalValue] = useState<number>(value)
  const timerRef = useRef<any>(null)

  // Sync with global state changes (e.g. initial load or cross-field updates)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (newValue: number | null) => {
    const val = newValue || 0
    setLocalValue(val)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(val)
    }, debounceMs)
  }

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange(localValue)
  }

  return (
    <InputNumber
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onPressEnter={handleBlur}
    />
  )
}

export default function BillingAllocationPage() {
  const { message } = App.useApp()
  const params = useParams()
  const kode = params['*']
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<AllocationRow[]>([])
  const [saving, setSaving] = useState(false)
  const [globalMitraId, setGlobalMitraId] = useState<number | null>(null)
  const [globalPayorType, setGlobalPayorType] = useState<string>('insurance')

  // Admin fee preview state
  const [adminFeePreview, setAdminFeePreview] = useState<{
    applicable: boolean
    feeAmount: number
    discountAmount: number
    netFeeAmount: number
    description: string
    feeType?: string
    feeValue?: number
  } | null>(null)
  const [applyAdminFee, setApplyAdminFee] = useState(true)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Global allocation states
  const [globalAsuransi, setGlobalAsuransi] = useState<number>(0)
  const [globalRS, setGlobalRS] = useState<number>(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data, isLoading, isError, error } = client.billing.getInvoiceWithAllocations.useQuery({
    kode: kode!
  })

  useEffect(() => {
    if (data?.success && data.result) {
      const invoice = data.result
      const items: AllocationRow[] = (invoice.details || []).map((item: any) => {
        const asuransiAlloc = item.allocations?.find((a: any) => ['bpjs', 'insurance', 'company'].includes(a.payorType))
        const rsAlloc = item.allocations?.find((a: any) => a.payorType === 'hospital')
        const pasienAlloc = item.allocations?.find((a: any) => a.payorType === 'patient')

        const asuransi = asuransiAlloc?.amount || 0
        const rs = rsAlloc?.amount || 0
        const totalAmount = item.totalAmount || 0

        return {
          id: item.id,
          description: item.description || 'Tanpa Deskripsi',
          category: item.category || 'Lain-lain',
          qty: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          totalAmount,
          asuransi,
          asuransiPercent: totalAmount > 0 ? (asuransi / totalAmount) * 100 : 0,
          rs,
          rsPercent: totalAmount > 0 ? (rs / totalAmount) * 100 : 0,
          pasien: pasienAlloc?.amount || totalAmount - asuransi - rs,
          mitraId: asuransiAlloc?.mitraId || null,
          note: asuransiAlloc?.note || null
        }
      })
      setRows(items)

      const someMitraId = items.find(i => i.mitraId)?.mitraId
      if (someMitraId) setGlobalMitraId(someMitraId)
    }
  }, [data])

  // Fetch admin fee preview whenever payor or mitra changes
  useEffect(() => {
    const invoiceTotal = rows.reduce((s, r) => s + r.totalAmount, 0)
    if (!globalPayorType || invoiceTotal === 0) {
      setAdminFeePreview(null)
      return
    }

    let cancelled = false
    setLoadingPreview(true)

    rpc.billing.getAdminFeePreview({
      payorType: globalPayorType,
      mitraId: globalMitraId,
      invoiceTotal,
    }).then((res: any) => {
      if (!cancelled) {
        const preview = res?.result
        setAdminFeePreview(preview ?? null)
        if (preview?.applicable) {
          setApplyAdminFee(true)
        }
      }
    }).catch(() => {
      if (!cancelled) setAdminFeePreview(null)
    }).finally(() => {
      if (!cancelled) setLoadingPreview(false)
    })

    return () => { cancelled = true }
  }, [globalPayorType, globalMitraId, rows.length])

  const handleAmountChange = useCallback((id: number, field: 'asuransi' | 'rs', value: number) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row

      const updatedRow = { ...row, [field]: value }

      // Update percentage based on new amount
      if (field === 'asuransi') {
        updatedRow.asuransiPercent = row.totalAmount > 0 ? (value / row.totalAmount) * 100 : 0
      } else if (field === 'rs') {
        updatedRow.rsPercent = row.totalAmount > 0 ? (value / row.totalAmount) * 100 : 0
      }

      // Recalculate Pasien remainder (Allow negative for validation)
      updatedRow.pasien = row.totalAmount - updatedRow.asuransi - updatedRow.rs

      return updatedRow
    }))
  }, [])

  const handlePercentChange = useCallback((id: number, field: 'asuransi' | 'rs', percent: number) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row

      const updatedRow = { ...row }
      const amount = Math.round((percent / 100) * row.totalAmount)

      if (field === 'asuransi') {
        updatedRow.asuransi = amount
        updatedRow.asuransiPercent = percent
      } else if (field === 'rs') {
        updatedRow.rs = amount
        updatedRow.rsPercent = percent
      }

      // Recalculate Pasien remainder (Allow negative for validation)
      updatedRow.pasien = row.totalAmount - updatedRow.asuransi - updatedRow.rs

      return updatedRow
    }))
  }, [])

  const applyGlobalAllocation = () => {
    const totalInvoiceAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0)

    if (totalInvoiceAmount === 0) return

    setRows(prev => {
      // 1. Calculate ratios
      const ratioAsuransi = globalAsuransi / totalInvoiceAmount
      const ratioRS = globalRS / totalInvoiceAmount

      // 2. Initial proportional distribution (floor to avoid over-allocation)
      let allocatedAsuransiSum = 0
      let allocatedRSSum = 0

      const newRows = prev.map(row => {
        const asuransi = Math.floor(row.totalAmount * ratioAsuransi)
        const rs = Math.floor(row.totalAmount * ratioRS)

        allocatedAsuransiSum += asuransi
        allocatedRSSum += rs

        return {
          ...row,
          asuransi,
          rs
        }
      })

      // 3. Distribute rounding remainders (if any) to reach the exact target
      let diffAsuransi = globalAsuransi - allocatedAsuransiSum
      let diffRS = globalRS - allocatedRSSum

      return newRows.map((row, idx) => {
        const updatedRow = { ...row }

        // Add one currency unit until diff is exhausted
        if (diffAsuransi > 0) {
          const add = Math.min(row.totalAmount - updatedRow.asuransi, diffAsuransi)
          updatedRow.asuransi += add
          diffAsuransi -= add
        }

        if (diffRS > 0) {
          const maxPossibleRS = row.totalAmount - updatedRow.asuransi
          const add = Math.min(maxPossibleRS - updatedRow.rs, diffRS)
          updatedRow.rs += add
          diffRS -= add
        }

        // 4. Update percentages and pasien remainder
        updatedRow.asuransiPercent = row.totalAmount > 0 ? (updatedRow.asuransi / row.totalAmount) * 100 : 0
        updatedRow.rsPercent = row.totalAmount > 0 ? (updatedRow.rs / row.totalAmount) * 100 : 0
        updatedRow.pasien = Math.max(0, row.totalAmount - updatedRow.asuransi - updatedRow.rs)

        return updatedRow
      })
    })
    setIsModalOpen(false)
    message.success(`Alokasi Pro-rata diterapkan (Asuransi: ${Math.round((globalAsuransi / totalInvoiceAmount) * 100)}%)`)
  }

  const handleSave = async () => {
    if (!kode) {
      console.error('Save aborted: kode is missing')
      message.error('Kode invoice tidak ditemukan')
      return
    }

    const hide = message.loading('Menyimpan alokasi...', 0)
    setSaving(true)

    try {
      // 1. Pre-validation: If any row has insurance allocation, Mitra MUST be selected
      const hasInsuranceAllocation = rows.some(r => r.asuransi > 0)
      if (hasInsuranceAllocation && !globalMitraId) {
        message.error('Silahkan pilih Penjamin (Mitra) terlebih dahulu!')
        hide()
        setSaving(false)
        return
      }

      const payload: any[] = []
      rows.forEach(row => {
        if (row.asuransi > 0) {
          payload.push({
            invoiceDetailId: Number(row.id),
            payorType: 'insurance',
            amount: Number(row.asuransi),
            mitraId: Number(globalMitraId),
            note: row.note
          })
        }
        if (row.rs > 0) {
          payload.push({
            invoiceDetailId: Number(row.id),
            payorType: 'hospital',
            amount: Number(row.rs)
          })
        }
        if (row.pasien > 0) {
          payload.push({
            invoiceDetailId: Number(row.id),
            payorType: 'patient',
            amount: Number(row.pasien)
          })
        }
      })

      const shouldApplyAdminFee = applyAdminFee && adminFeePreview?.applicable && (adminFeePreview?.netFeeAmount ?? 0) > 0

      const res = await rpc.billing.saveAllocations({
        kode,
        allocations: payload,
        applyAdminFee: shouldApplyAdminFee,
        adminFeeAmount: shouldApplyAdminFee ? adminFeePreview!.netFeeAmount : null,
        adminFeeDescription: shouldApplyAdminFee ? adminFeePreview!.description : null,
      })

      if (res.success) {
        message.success('Alokasi berhasil disimpan')
        queryClient.invalidateQueries({ queryKey: ['billing', 'getInvoiceWithAllocations', kode] })
        navigate('/dashboard/billing')
      } else {
        message.error(res.message || 'Gagal menyimpan alokasi')
      }
    } catch (err: any) {
      message.error(err.message || 'Terjadi kesalahan sistem')
    } finally {
      hide()
      setSaving(false)
    }
  }

  const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const columns: ColumnsType<AllocationRow> = [
    { title: 'Tagihan', dataIndex: 'description', key: 'description' },
    { title: 'Jumlah', dataIndex: 'qty', key: 'qty', width: 80, align: 'center' },
    {
      title: 'Tarif',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right',
      render: (v) => formatRupiah(v)
    },
    {
      title: 'Tanggungan Asuransi',
      key: 'asuransi',
      width: 250,
      render: (_, record) => (
        <div className="flex gap-1 items-center">
          <DebouncedInputNumber
            value={record.asuransiPercent}
            onChange={(v: number) => handlePercentChange(record.id, 'asuransi', v)}
            className="w-24"
            suffix="%"
            min={0}
            max={100}
            size="small"
            debounceMs={200}
          />
          <DebouncedInputNumber
            value={record.asuransi}
            onChange={(v: number) => handleAmountChange(record.id, 'asuransi', v)}
            className="flex-1"
            formatter={(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: any) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
            size="small"
            debounceMs={200}
            status={record.asuransi + record.rs > record.totalAmount ? 'error' : undefined}
          />
        </div>
      )
    },
    {
      title: 'Tanggungan RS',
      key: 'rs',
      width: 250,
      render: (_, record) => (
        <div className="flex gap-1 items-center">
          <DebouncedInputNumber
            value={record.rsPercent}
            onChange={(v: number) => handlePercentChange(record.id, 'rs', v)}
            className="w-24"
            suffix="%"
            min={0}
            max={100}
            size="small"
            debounceMs={200}
          />
          <DebouncedInputNumber
            value={record.rs}
            onChange={(v: number) => handleAmountChange(record.id, 'rs', v)}
            className="flex-1"
            formatter={(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value: any) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
            size="small"
            debounceMs={200}
            status={record.asuransi + record.rs > record.totalAmount ? 'error' : undefined}
          />
        </div>
      )
    },
    {
      title: 'Tanggungan Pasien',
      key: 'pasien',
      width: 180,
      render: (_, record) => {
        const diff = record.totalAmount - record.asuransi - record.rs
        const isMismatch = diff !== 0
        
        return (
          <div className="flex flex-col">
            <InputNumber
              value={diff}
              disabled 
              className={`w-full font-semibold ${
                isMismatch ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-green-600'
              }`}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
              size="small"
              status={isMismatch ? 'error' : undefined}
            />
            {isMismatch && (
              <Text type="danger" style={{ fontSize: 10 }}>
                {diff < 0 ? 'Melebihi jatah!' : 'Masih kurang!'}
              </Text>
            )}
          </div>
        )
      }
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (v) => formatRupiah(v)
    },
  ]

  // Group by category
  const groupedData = useMemo(() => {
    const groups: Record<string, AllocationRow[]> = {}
    rows.forEach(row => {
      if (!groups[row.category]) groups[row.category] = []
      groups[row.category].push(row)
    })
    return Object.entries(groups).map(([category, items]) => ({
      category,
      items
    }))
  }, [rows])

  const summary = useMemo(() => {
    return rows.reduce((acc, curr) => {
      acc.total += curr.totalAmount
      acc.asuransi += curr.asuransi
      acc.rs += curr.rs
      acc.pasien += (curr.totalAmount - curr.asuransi - curr.rs)
      return acc
    }, { total: 0, asuransi: 0, rs: 0, pasien: 0 })
  }, [rows])

  // Global validation: disable save if any row total is not 100% allocated
  const validationStatus = useMemo(() => {
    const hasOver = rows.some(row => (row.asuransi + row.rs) > row.totalAmount)
    const hasUnder = rows.some(row => (row.asuransi + row.rs) < row.totalAmount)
    return {
      hasError: hasOver || hasUnder,
      hasOver,
      hasUnder,
      message: hasOver 
        ? 'Terdapat alokasi yang MELEBIHI total tagihan!' 
        : hasUnder 
          ? 'Terdapat tagihan yang BELUM dialokasi sepenuhnya!' 
          : ''
    }
  }, [rows])

  const openAllocationModal = () => {
    // Initialize modal with current table totals so it's not reset to 0
    setGlobalAsuransi(summary.asuransi)
    setGlobalRS(summary.rs)
    setIsModalOpen(true)
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" tip="Memuat detail tagihan..." /></div>

  if (isError) return (
    <div className="p-10 text-center">
      <Text type="danger">Terjadi kesalahan: {error?.message}</Text>
      <br />
      <Button onClick={() => navigate(-1)} className="mt-4">Kembali</Button>
    </div>
  )

  if (data && !data.success) return (
    <div className="p-10 text-center">
      <Text type="danger">Gagal memuat data: {data.message || 'Unknown Error'}</Text>
      <br />
      <Button onClick={() => navigate(-1)} className="mt-4">Kembali</Button>
    </div>
  )

  const invoice = data?.result

  if (!invoice) return (
    <div className="p-10 text-center">
      <Text type="warning">Invoice dengan kode {kode} tidak ditemukan.</Text>
      <br />
      <Button onClick={() => navigate(-1)} className="mt-4">Kembali</Button>
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Kembali</Button>
          <Title level={3} className="!mb-0">Alokasi Penjamin - {kode}</Title>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={globalPayorType}
            onChange={(v) => { setGlobalPayorType(v); setGlobalMitraId(null) }}
            style={{ width: 150 }}
            options={[
              { label: 'Asuransi', value: 'insurance' },
              { label: 'BPJS', value: 'bpjs' },
              { label: 'Perusahaan', value: 'company' },
              { label: 'Umum', value: 'hospital' },
            ]}
          />
          <RPCSelectAsync
            entity="mitra"
            listAll
            placeHolder="Pilih Penjamin Utama"
            value={globalMitraId}
            onChange={setGlobalMitraId}
            className="w-64"
          />
          <Button
            icon={<SyncOutlined />}
            onClick={openAllocationModal}
          >
            Alokasi Otomatis
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            disabled={validationStatus.hasError}
            title={validationStatus.message}
          >
            Simpan Alokasi
          </Button>
        </div>
      </div>

      {/* Admin fee preview banner */}
      {adminFeePreview?.applicable && (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message={
            <div className="flex items-center justify-between">
              <span>
                <strong>{adminFeePreview.description}</strong>{' '}
                {adminFeePreview.feeType === 'percentage'
                  ? `(${adminFeePreview.feeValue}%)`
                  : ''}{' '}
                ={' '}
                <strong>{formatRupiah(adminFeePreview.netFeeAmount)}</strong>
                {adminFeePreview.discountAmount > 0 && (
                  <span className="text-gray-400 line-through ml-2">{formatRupiah(adminFeePreview.feeAmount)}</span>
                )}
              </span>
              <div className="flex items-center gap-2 ml-6">
                <span className="text-sm">Terapkan?</span>
                <Switch
                  size="small"
                  checked={applyAdminFee}
                  onChange={setApplyAdminFee}
                  checkedChildren="Ya"
                  unCheckedChildren="Tidak"
                />
              </div>
            </div>
          }
          className="mb-2"
        />
      )}
      {loadingPreview && (
        <Alert type="info" message="Mengecek aturan biaya administrasi..." showIcon className="mb-2" />
      )}

      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-700 pb-2 border-b">
            <SyncOutlined />
            <span>Alokasi Otomatis (Bagi Rata / Plafon Global)</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={850}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Batal
          </Button>,
          <Button
            key="reset"
            danger
            onClick={() => {
              setGlobalAsuransi(0)
              setGlobalRS(0)
            }}
          >
            Reset Alokasi
          </Button>,
          <Button
            key="apply"
            type="primary"
            icon={<SyncOutlined />}
            onClick={applyGlobalAllocation}
            disabled={globalAsuransi === 0 && globalRS === 0}
          >
            Terapkan Alokasi
          </Button>
        ]}
      >
        <div className="py-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100 px-8">
            <Statistic
              title="Total Tagihan"
              value={summary.total}
              prefix="Rp"
            />
            <Statistic
              title="Tanggungan Pasien (Sisa)"
              value={Math.max(0, summary.total - globalAsuransi - globalRS)}
              prefix="Rp"
              valueStyle={{ color: (summary.total - globalAsuransi - globalRS) > 0 ? '#faad14' : '#52c41a' }}
            />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-2 px-4 rounded border border-dashed">
              <Text type="secondary">Otomatis seimbangkan (Pasien Rp 0)?</Text>
              <Select
                defaultValue="link"
                size="small"
                style={{ width: 180 }}
                onChange={(val) => {
                  if (val === 'link') {
                    // Force balance now
                    setGlobalRS(Math.max(0, summary.total - globalAsuransi))
                  }
                }}
                options={[
                  { label: 'Ya (Otomatis)', value: 'link' },
                  { label: 'Tidak (Manual)', value: 'manual' }
                ]}
                id="allocation-mode-select"
              />
            </div>

            <div className="space-y-4 px-4">
              <Row align="middle" gutter={16}>
                <Col span={6}>
                  <Text strong className="text-slate-600">Plafon Asuransi</Text>
                </Col>
                <Col span={18}>
                  <DebouncedInputNumber
                    style={{ width: '100%' }}
                    size="large"
                    min={0}
                    max={summary.total}
                    value={globalAsuransi}
                    onChange={(v: number) => {
                      const newVal = v || 0
                      setGlobalAsuransi(newVal)
                      const mode = (document.getElementById('allocation-mode-select') as HTMLSelectElement)?.value || 'link'
                      if (mode === 'link') {
                        setGlobalRS(Math.max(0, summary.total - newVal))
                      }
                    }}
                    formatter={(value: any) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: any) => Number(value!.replace(/\Rp\s?|(,*)/g, '')) || 0}
                    debounceMs={300}
                  />
                </Col>
              </Row>

              <Row align="middle" gutter={16}>
                <Col span={6}>
                  <Text strong className="text-slate-600">Plafon RS</Text>
                </Col>
                <Col span={18}>
                  <DebouncedInputNumber
                    style={{ width: '100%' }}
                    size="large"
                    min={0}
                    max={summary.total}
                    value={globalRS}
                    onChange={(v: number) => {
                      const newVal = v || 0
                      setGlobalRS(newVal)
                      const mode = (document.getElementById('allocation-mode-select') as HTMLSelectElement)?.value || 'link'
                      if (mode === 'link') {
                        setGlobalAsuransi(Math.max(0, summary.total - newVal))
                      }
                    }}
                    formatter={(value: any) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: any) => Number(value!.replace(/\Rp\s?|(,*)/g, '')) || 0}
                    debounceMs={300}
                  />
                </Col>
              </Row>
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded border border-amber-100 flex items-start gap-2">
            <Text type="warning" className="text-xs">
              ⓘ Tip: Gunakan mode <b>Otomatis</b> agar Anda cukup mengisi satu kolom saja, sistem akan langsung menghitung sisanya untuk kolom lain.
            </Text>
          </div>
        </div>
      </Modal>

      <Card size="small" className="bg-blue-50">
        <Row gutter={24}>
          <Col span={6}>
            <Text type="secondary">Nama Pasien</Text><br />
            <Text strong style={{ fontSize: 16 }}>{invoice?.patientName || '-'}</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">No. Rekam Medis</Text><br />
            <Text strong>{invoice?.mrn || '-'}</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Alamat</Text><br />
            <Text>{invoice?.address || '-'}</Text>
          </Col>
          <Col span={6}>
            <Text type="secondary">Tanggal Pelayanan</Text><br />
            <Text>{invoice?.visitDate ? new Date(invoice.visitDate).toLocaleString('id-ID') : '-'}</Text>
          </Col>
        </Row>
      </Card>

      {rows.length === 0 && !isLoading && (
        <Card className="text-center py-10 text-gray-400">
          Tidak ada data tagihan untuk invoice ini.
        </Card>
      )}

      {groupedData.map(group => (
        <div key={group.category} className="mb-6 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
          <Title level={5} className="!px-4 !py-3 bg-gray-50/50 mb-0 border-b border-gray-100 !text-slate-700">
            {group.category}
          </Title>
          <Table
            dataSource={group.items}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            showHeader={true}
            className="border-none"
          />
        </div>
      ))}

      <Divider />

      <Row gutter={24}>
        <Col span={10}>
          <Card size="small" title="Ringkasan Alokasi">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text>Total Biaya</Text>
                <Text strong>{formatRupiah(summary.total)}</Text>
              </div>
              <div className="flex justify-between text-blue-600">
                <Text>Tanggungan Asuransi</Text>
                <Text strong>{formatRupiah(summary.asuransi)}</Text>
              </div>
              <div className="flex justify-between text-orange-600">
                <Text>Tanggungan RS</Text>
                <Text strong>{formatRupiah(summary.rs)}</Text>
              </div>
              <div className="flex justify-between text-green-600 border-t pt-2 mt-2">
                <Title level={5} className="!mb-0">Tanggungan Pasien</Title>
                <Title level={5} className="!mb-0">{formatRupiah(summary.pasien)}</Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
