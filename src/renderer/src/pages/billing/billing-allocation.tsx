import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { rpc, client } from '@renderer/utils/client'
import { 
  Button, 
  Divider, 
  Spin, 
  Table, 
  Tag, 
  Typography, 
  message, 
  Select, 
  InputNumber,
  Card,
  Row,
  Col,
  Statistic
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState, useMemo } from 'react'
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
  rs: number
  pasien: number
  mitraId?: number | null
  note?: string | null
}

export default function BillingAllocationPage() {
  const params = useParams()
  const kode = params['*']
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<AllocationRow[]>([])
  const [saving, setSaving] = useState(false)
  const [globalMitraId, setGlobalMitraId] = useState<number | null>(null)

  const { data, isLoading, isError, error } = client.billing.getInvoiceWithAllocations.useQuery({
    kode: kode!
  })

  useEffect(() => {
    console.log('[BillingAllocation] Data updated:', data)
    if (data?.success && data.result) {
      const invoice = data.result
      const items: AllocationRow[] = (invoice.details || []).map((item: any) => {
        const asuransiAlloc = item.allocations?.find((a: any) => ['bpjs', 'insurance', 'company'].includes(a.payorType))
        const rsAlloc = item.allocations?.find((a: any) => a.payorType === 'hospital')
        const pasienAlloc = item.allocations?.find((a: any) => a.payorType === 'patient')

        return {
          id: item.id,
          description: item.description || 'Tanpa Deskripsi',
          category: item.category || 'Lain-lain',
          qty: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          totalAmount: item.totalAmount || 0,
          asuransi: asuransiAlloc?.amount || 0,
          rs: rsAlloc?.amount || 0,
          pasien: pasienAlloc?.amount || item.totalAmount || 0,
          mitraId: asuransiAlloc?.mitraId || null,
          note: asuransiAlloc?.note || null
        }
      })
      setRows(items)
      
      const someMitraId = items.find(i => i.mitraId)?.mitraId
      if (someMitraId) setGlobalMitraId(someMitraId)
    }
  }, [data])

  const handleAmountChange = (id: number, field: 'asuransi' | 'rs' | 'pasien', value: number) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row
      
      const newRow = { ...row, [field]: value }
      
      // Auto-recalculate Pasien if asuransi or rs changed
      if (field !== 'pasien') {
        newRow.pasien = Math.max(0, row.totalAmount - (field === 'asuransi' ? value : row.asuransi) - (field === 'rs' ? value : row.rs))
      }
      
      return newRow
    }))
  }

  const handleSave = async () => {
    if (!kode) return
    setSaving(true)
    try {
      const payload: any[] = []
      rows.forEach(row => {
        if (row.asuransi > 0) {
          payload.push({
            invoiceDetailId: row.id,
            payorType: 'insurance', // Generic insurance for simplicity in payload
            amount: row.asuransi,
            mitraId: globalMitraId,
            note: row.note
          })
        }
        if (row.rs > 0) {
          payload.push({
            invoiceDetailId: row.id,
            payorType: 'hospital',
            amount: row.rs
          })
        }
        if (row.pasien > 0) {
          payload.push({
            invoiceDetailId: row.id,
            payorType: 'patient',
            amount: row.pasien
          })
        }
      })

      const res = await rpc.billing.saveAllocations({
        kode,
        allocations: payload
      })

      if (res.success) {
        message.success('Alokasi berhasil disimpan')
        queryClient.invalidateQueries({ queryKey: ['billing', 'getInvoiceWithAllocations', kode] })
        navigate('/dashboard/billing')
      } else {
        message.error(res.message || 'Gagal menyimpan alokasi')
      }
    } catch (err: any) {
      message.error(err.message || 'Terjadi kesalahan')
    } finally {
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
      width: 150,
      render: (_, record) => (
        <InputNumber
          value={record.asuransi}
          onChange={(v) => handleAmountChange(record.id, 'asuransi', v || 0)}
          className="w-full"
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
        />
      )
    },
    {
      title: 'Tanggungan RS',
      key: 'rs',
      width: 150,
      render: (_, record) => (
        <InputNumber
          value={record.rs}
          onChange={(v) => handleAmountChange(record.id, 'rs', v || 0)}
          className="w-full"
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
        />
      )
    },
    {
      title: 'Tanggungan Pasien',
      key: 'pasien',
      width: 150,
      render: (_, record) => (
        <InputNumber
          value={record.pasien}
          disabled // Usually Pasien is the remainder
          className="w-full bg-gray-50"
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) || 0}
        />
      )
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
      acc.pasien += curr.pasien
      return acc
    }, { total: 0, asuransi: 0, rs: 0, pasien: 0 })
  }, [rows])

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
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Kembali</Button>
          <Title level={3} className="!mb-0">Alokasi Penjamin - {kode}</Title>
        </div>
        <div className="flex items-center gap-4">
          <RPCSelectAsync
            entity="mitra"
            listAll
            placeHolder="Pilih Penjamin Utama"
            value={globalMitraId}
            onChange={setGlobalMitraId}
            className="w-64"
          />
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            size="large" 
            loading={saving}
            onClick={handleSave}
          >
            Simpan Alokasi
          </Button>
        </div>
      </div>

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
