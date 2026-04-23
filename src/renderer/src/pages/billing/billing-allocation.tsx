import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  UserOutlined,
  IdcardOutlined,
  HomeOutlined,
  HistoryOutlined,
  SolutionOutlined
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
  App,
  Alert,
  Switch,
  Tooltip
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { RPCSelectAsync } from '@renderer/components/organisms/RPCSelectAsync'
import DebouncedInputNumber from './DebouncedInputNumber'
import GlobalAllocationModal from './GlobalAllocationModal'

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
  console.log('getInvoiceWithAllocations', data)

      useEffect(() => {
    if (data?.success && data.result) {
      const invoice = data.result
      
      // Automatic Payor Detection
      if (invoice.penjaminId) setGlobalMitraId(invoice.penjaminId)
      
      const payorMap: Record<string, string> = {
        cash: 'hospital',
        asuransi: 'insurance',
        company: 'company',
        bpjs: 'bpjs'
      }
      if (invoice.paymentMethod) {
        setGlobalPayorType(payorMap[invoice.paymentMethod] || 'insurance')
      }

      const items: AllocationRow[] = (invoice.details || []).map((item: any) => {
        const asuransiAlloc = item.allocations?.find((a: any) =>
          ['bpjs', 'insurance', 'company'].includes(a.payorType)
        )
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

      const someMitraId = items.find((i) => i.mitraId)?.mitraId
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

    rpc.billing
      .getAdminFeePreview({
        payorType: globalPayorType,
        mitraId: globalMitraId,
        invoiceTotal
      })
      .then((res: any) => {
        if (!cancelled) {
          const preview = res?.result
          setAdminFeePreview(preview ?? null)
          if (preview?.applicable) {
            setApplyAdminFee(true)
          }
        }
      })
      .catch(() => {
        if (!cancelled) setAdminFeePreview(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false)
      })

    return () => {
      cancelled = true
    }
  }, [globalPayorType, globalMitraId, rows.length])

  const handleAmountChange = useCallback((id: number, field: 'asuransi' | 'rs', value: number) => {
    setRows((prev) =>
      prev.map((row) => {
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
      })
    )
  }, [])

  const handlePercentChange = useCallback(
    (id: number, field: 'asuransi' | 'rs', percent: number) => {
      setRows((prev) =>
        prev.map((row) => {
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
        })
      )
    },
    []
  )

  const applyGlobalAllocation = () => {
    const totalInvoiceAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0)

    if (totalInvoiceAmount === 0) return

    setRows((prev) => {
      // 1. Calculate ratios
      const ratioAsuransi = globalAsuransi / totalInvoiceAmount
      const ratioRS = globalRS / totalInvoiceAmount

      // 2. Initial proportional distribution (floor to avoid over-allocation)
      let allocatedAsuransiSum = 0
      let allocatedRSSum = 0

      const newRows = prev.map((row) => {
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
        updatedRow.asuransiPercent =
          row.totalAmount > 0 ? (updatedRow.asuransi / row.totalAmount) * 100 : 0
        updatedRow.rsPercent = row.totalAmount > 0 ? (updatedRow.rs / row.totalAmount) * 100 : 0
        updatedRow.pasien = Math.max(0, row.totalAmount - updatedRow.asuransi - updatedRow.rs)

        return updatedRow
      })
    })
    setIsModalOpen(false)
    message.success(
      `Alokasi Pro-rata diterapkan (Asuransi: ${Math.round((globalAsuransi / totalInvoiceAmount) * 100)}%)`
    )
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
      const hasInsuranceAllocation = rows.some((r) => r.asuransi > 0)
      if (hasInsuranceAllocation && !globalMitraId) {
        message.error('Silahkan pilih Penjamin (Mitra) terlebih dahulu!')
        hide()
        setSaving(false)
        return
      }

      const payload: any[] = []
      rows.forEach((row) => {
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

      const shouldApplyAdminFee =
        applyAdminFee && adminFeePreview?.applicable && (adminFeePreview?.netFeeAmount ?? 0) > 0

      const res = await rpc.billing.saveAllocations({
        kode,
        allocations: payload,
        applyAdminFee: shouldApplyAdminFee,
        adminFeeAmount: shouldApplyAdminFee ? adminFeePreview!.netFeeAmount : null,
        adminFeeDescription: shouldApplyAdminFee ? adminFeePreview!.description : null
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
        const diff = record.totalAmount - record.asuransi - record.rs - record.pasien
        const isMismatch = diff !== 0

        return (
          <div className="flex flex-col">
            <InputNumber
              value={record.pasien}
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
    }
  ]

  // Group by category
  const groupedData = useMemo(() => {
    const groups: Record<string, AllocationRow[]> = {}
    rows.forEach((row) => {
      if (!groups[row.category]) groups[row.category] = []
      groups[row.category].push(row)
    })
    return Object.entries(groups).map(([category, items]) => ({
      category,
      items
    }))
  }, [rows])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, curr) => {
        acc.total += curr.totalAmount
        acc.asuransi += curr.asuransi
        acc.rs += curr.rs
        acc.pasien += curr.totalAmount - curr.asuransi - curr.rs
        return acc
      },
      { total: 0, asuransi: 0, rs: 0, pasien: 0 }
    )
  }, [rows])

  // Global validation: disable save if any row total is not 100% allocated
  const validationStatus = useMemo(() => {
    const hasOver = rows.some((row) => row.asuransi + row.rs + row.pasien > row.totalAmount)
    const hasUnder = rows.some((row) => row.asuransi + row.rs + row.pasien < row.totalAmount)
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

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" tip="Memuat detail tagihan..." />
      </div>
    )

  if (isError)
    return (
      <div className="p-10 text-center">
        <Text type="danger">Terjadi kesalahan: {error?.message}</Text>
        <br />
        <Button onClick={() => navigate(-1)} className="mt-4">
          Kembali
        </Button>
      </div>
    )

  if (data && !data.success)
    return (
      <div className="p-10 text-center">
        <Text type="danger">Gagal memuat data: {data.message || 'Unknown Error'}</Text>
        <br />
        <Button onClick={() => navigate(-1)} className="mt-4">
          Kembali
        </Button>
      </div>
    )

  const invoice = data?.result

  if (!invoice)
    return (
      <div className="p-10 text-center">
        <Text type="warning">Invoice dengan kode {kode} tidak ditemukan.</Text>
        <br />
        <Button onClick={() => navigate(-1)} className="mt-4">
          Kembali
        </Button>
      </div>
    )

  return (
    <div className="p-4 space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="hover:!border-blue-500 hover:!text-blue-500 transition-all rounded-lg"
          >
            Kembali
          </Button>
          <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
          <div>
            <Title level={4} className="!mb-0 text-slate-800">
              Alokasi Penjamin
            </Title>
            <Text type="secondary" className="text-xs uppercase tracking-wider">
              {kode}
            </Text>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            icon={<SyncOutlined />}
            onClick={openAllocationModal}
            className="rounded-lg hover:!text-blue-500 hover:!border-blue-500"
          >
            Alokasikan Otomatis
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            disabled={validationStatus.hasError}
            title={validationStatus.message}
            className="rounded-lg shadow-md shadow-blue-100 bg-blue-600 hover:bg-blue-700"
          >
            Simpan Alokasi
          </Button>
        </div>
      </div>

      {/* Patient Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-2xl text-white shadow-lg shadow-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <SolutionOutlined style={{ fontSize: 160 }} />
        </div>

        <div className="flex items-start gap-4 col-span-1 md:col-span-1">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">
            <UserOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium uppercase tracking-tight mb-1">
              Nama Pasien
            </div>
            <div className="text-xl font-bold leading-tight">{invoice?.patientName || '-'}</div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <IdcardOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium uppercase tracking-tight mb-1">
              No. Rekam Medis
            </div>
            <div className="text-lg font-semibold tracking-wide">{invoice?.mrn || '-'}</div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <HomeOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium uppercase tracking-tight mb-1">
              Alamat Pasien
            </div>
            <div className="text-sm font-medium line-clamp-2 leading-snug">
              {invoice?.address || '-'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <HistoryOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium uppercase tracking-tight mb-1">
              Tanggal Pelayanan
            </div>
            <div className="text-sm font-semibold tracking-wide">
              {invoice?.visitDate
                ? new Date(invoice.visitDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '-'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <CheckCircleOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium uppercase tracking-tight mb-1">
              Penjamin Pasien
            </div>
            <div className="text-sm font-bold uppercase tracking-wide">
              {invoice?.penjaminName || '-'}
            </div>
          </div>
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
                {adminFeePreview.feeType === 'percentage' ? `(${adminFeePreview.feeValue}%)` : ''} ={' '}
                <strong>{formatRupiah(adminFeePreview.netFeeAmount)}</strong>
                {adminFeePreview.discountAmount > 0 && (
                  <span className="text-gray-400 line-through ml-2">
                    {formatRupiah(adminFeePreview.feeAmount)}
                  </span>
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
        <Alert
          type="info"
          message="Mengecek aturan biaya administrasi..."
          showIcon
          className="mb-2"
        />
      )}

      <GlobalAllocationModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        summary={summary}
        globalAsuransi={globalAsuransi}
        globalRS={globalRS}
        setGlobalAsuransi={setGlobalAsuransi}
        setGlobalRS={setGlobalRS}
        onApply={applyGlobalAllocation}
      />

      {rows.length === 0 && !isLoading && (
        <Card className="text-center py-10 text-gray-400">
          Tidak ada data tagihan untuk invoice ini.
        </Card>
      )}

      <div className="space-y-8">
        {groupedData.map((group) => (
          <div
            key={group.category}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-md"
          >
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                <Title
                  level={5}
                  className="!mb-0 text-slate-700 uppercase tracking-wide text-sm font-bold"
                >
                  {group.category}
                </Title>
              </div>
              <Tag color="blue" className="rounded-full px-3">
                {group.items.length} Item
              </Tag>
            </div>
            <Table
              dataSource={group.items}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
              showHeader={true}
              className="px-2"
            />
          </div>
        ))}
      </div>

      <Divider />

      <div className="flex justify-end pt-4">
        <div className="w-full md:w-[600px]">
          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

            <Title level={4} className="mb-6 flex items-center gap-2">
              <CheckCircleOutlined className="text-green-500" />
              <span>Ringkasan Alokasi</span>
            </Title>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <Text className="text-slate-500 font-medium font-bold">Total Tagihan</Text>
                <Text className="text-lg font-bold text-slate-800">
                  {formatRupiah(summary.total)}
                </Text>
              </div>

              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <Text className="text-slate-600">Tanggungan Asuransi</Text>
                </div>
                <Text strong className="text-blue-600 font-semibold">
                  {formatRupiah(summary.asuransi)}
                </Text>
              </div>

              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <Text className="text-slate-600">Tanggungan RS</Text>
                </div>
                <Text strong className="text-orange-600 font-semibold">
                  {formatRupiah(summary.rs)}
                </Text>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex justify-between items-center text-green-700">
                  <div className="flex flex-col">
                    <Text className="text-xs uppercase font-bold tracking-wider text-green-600">
                      Sisa Tanggungan
                    </Text>
                    <Title level={3} className="!mb-0 !mt-1 !text-green-700 font-black">
                      Pasien
                    </Title>
                  </div>
                  <Title level={2} className="!mb-0 !text-green-700 font-black">
                    {formatRupiah(summary.pasien)}
                  </Title>
                </div>
              </div>

              {validationStatus.hasError && (
                <div className="mt-4 animate-pulse">
                  <Alert
                    message={validationStatus.message}
                    type="error"
                    showIcon
                    className="rounded-lg font-medium"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
