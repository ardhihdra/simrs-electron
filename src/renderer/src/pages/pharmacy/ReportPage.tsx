import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, DatePicker, Table, Tabs, message, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState, useMemo } from 'react'

const { RangePicker } = DatePicker

// --- TYPES ---

// Stock Types
interface InventoryStockItem {
  kodeItem: string
  namaItem: string
  unit: string
  stockIn: number
  stockOut: number
  availableStock: number
}

interface InventoryStockResponse {
  success: boolean
  result?: InventoryStockItem[]
  message?: string
}

interface StockReportItem {
  key: string
  code: string
  name: string
  initialStock: number
  in: number
  out: number
  finalStock: number
  unit: string
}

// Sales Types (MedicationDispense)
interface MedicationDispenseItem {
  id: number
  status: string
  itemId?: number
  whenHandedOver?: string
  patient?: {
    name?: string | Array<{ text?: string }>
  }
  authorizingPrescription?: {
    item?: {
      nama?: string
    }
    category?: Array<{ text?: string; code?: string }>
    note?: string
    supportingInformation?: any[]
    medication?: {
      name?: string
    }
  }
  medication?: {
    name?: string
  }
  quantity?: {
    value?: number
    unit?: string
  }
}

interface ItemAttributes {
  id?: number
  nama?: string
  kode?: string
}

interface ItemListResponse {
  success: boolean
  result?: ItemAttributes[]
  message?: string
}

interface MedicationDispenseResponse {
  success: boolean
  data?: MedicationDispenseItem[]
  message?: string
}

interface SalesReportItem {
  key: string
  date: string
  patientName: string
  itemName: string
  quantity: number
  unit: string
  status: string
}

// Purchase Types (WarehouseNTTB)
interface WarehouseNTTBItem {
  id: number
  kode: string
  kodePo: string
  kodeItem: string
  kodeSuplier: string
  batchNumber?: string | null
  expiryDate?: string | null
  hargaBeli?: number | null
  diskon1?: number | null
  diskon2?: number | null
  bonus?: number | null
  total?: number | null
  note?: string | null
  createdAt: string
  item?: {
    kode: string
    nama: string
  } | null
  suplier?: {
    kode: string
    nama: string
  } | null
  stock?: {
    qty: number
  } | null
  po?: {
    kode: string
  } | null
}

interface WarehouseNTTBResponse {
  success: boolean
  result?: WarehouseNTTBItem[]
  message?: string
}

interface PurchaseReportItem {
  key: string
  receivedDate: string
  nttbCode: string
  poCode: string
  suplierName: string
  itemName: string
  batchNumber: string
  expiryDate: string
  quantity: number
  price: number
  discount: number
  total: number
  notes: string
}

// --- HELPERS ---

const calculateInitialStock = (final: number, stockIn: number, stockOut: number) => {
  return final - stockIn + stockOut
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPatientName = (patient?: MedicationDispenseItem['patient']) => {
  if (!patient) return '-'
  if (typeof patient.name === 'string') return patient.name
  if (Array.isArray(patient.name) && patient.name.length > 0) return patient.name[0].text || '-'
  return '-'
}

// --- COMPONENTS ---

const StockReport = () => {
  const { data, isLoading, refetch, isError } = useQuery<InventoryStockResponse>({
    queryKey: ['inventoryStock', 'list'],
    queryFn: async () => {
      const api = (
        window.api?.query as {
          inventoryStock?: { list: () => Promise<InventoryStockResponse> }
        }
      ).inventoryStock
      
      if (!api?.list) {
        throw new Error('API stok inventory tidak tersedia.')
      }
      return api.list()
    }
  })

  const tableData: StockReportItem[] = (data?.result || []).map((item, index) => ({
    key: item.kodeItem || String(index),
    code: item.kodeItem,
    name: item.namaItem,
    initialStock: calculateInitialStock(item.availableStock, item.stockIn, item.stockOut),
    in: item.stockIn,
    out: item.stockOut,
    finalStock: item.availableStock,
    unit: item.unit
  }))

  const handleDownloadCSV = () => {
    if (!tableData.length) {
      message.warning('Tidak ada data untuk diunduh')
      return
    }

    const headers = ['Kode Item', 'Nama Item', 'Unit', 'Stok', 'Keluar', 'Stok Akhir']
    const rows = tableData.map(item => [
      item.code,
      `"${item.name.replace(/"/g, '""')}"`,
      item.unit,
      item.in,
      item.out,
      item.finalStock
    ])

    downloadCSV(headers, rows, 'laporan_stok_obat')
  }

  const columns: ColumnsType<StockReportItem> = [
    { title: 'Kode Item', dataIndex: 'code', key: 'code' },
    { title: 'Nama Item', dataIndex: 'name', key: 'name' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    { title: 'Stok', dataIndex: 'in', key: 'in' },
    { title: 'Keluar', dataIndex: 'out', key: 'out' },
    { title: 'Stok Akhir', dataIndex: 'finalStock', key: 'finalStock' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Laporan Stok Obat</h3>
        <div className="flex gap-2">
          <RangePicker />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            Refresh
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadCSV}>
            Download CSV
          </Button>
        </div>
      </div>

      {isError && <div className="text-red-500">Gagal memuat data laporan stok.</div>}

      <div className="p-4 bg-white">
        <Table 
          columns={columns} 
          dataSource={tableData} 
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          bordered
          size="small"
        />
      </div>
    </div>
  )
}

const SalesReport = () => {
  const { data, isLoading, refetch, isError } = useQuery<MedicationDispenseResponse>({
    queryKey: ['medicationDispense', 'list'],
    queryFn: async () => {
      const api = (
        window.api?.query as {
          medicationDispense?: { list: (args?: { limit?: number }) => Promise<MedicationDispenseResponse> }
        }
      ).medicationDispense
      
      if (!api?.list) {
        throw new Error('API medication dispense tidak tersedia.')
      }
      return api.list({ limit: 100 }) // Fetch last 100 items for report
    }
  })

  const { data: itemData } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list'],
    queryFn: async () => {
      const api = (window.api?.query as any).item
      if (!api?.list) return { success: false, result: [] }
      return api.list()
    }
  })

  const itemNameById = useMemo(() => { // Initialize definition of itemNameById
    const map = new Map<number, string>()
    const items = itemData?.result || []
    items.forEach(item => {
      if (item.id && item.nama) map.set(item.id, item.nama)
    })
    return map
  }, [itemData])

  const tableData: SalesReportItem[] = (data?.data || []).map((item) => {
    // Resolve Item Name Logic
    let resolvedName = 'Unknown Item'
    
    // 1. Try ID lookup
    if (item.itemId && itemNameById.has(item.itemId)) {
      resolvedName = itemNameById.get(item.itemId)!
    } 
    // 2. Try prescription item name
    else if (item.authorizingPrescription?.item?.nama) {
      resolvedName = item.authorizingPrescription.item.nama
    }
    // 3. Try medication name
    else if (item.medication?.name) {
      resolvedName = item.medication.name
    }
    // 4. Try prescription medication name
    else if (item.authorizingPrescription?.medication?.name) {
      resolvedName = item.authorizingPrescription.medication.name
    }

    // Racikan Detection
    const prescription = item.authorizingPrescription
    const categories = prescription?.category || []
    const isRacikan = categories.some(c => c.text?.toLowerCase().includes('racikan') || c.code === 'compound') || 
                      (prescription?.note?.toLowerCase().includes('racikan') ?? false)

    if (isRacikan) {
      let racikanName = 'Obat Racikan'
      
      // Append note if available
      if (prescription?.note) {
         racikanName += ` - ${prescription.note}`
      }

      // Parse ingredients
      if (Array.isArray(prescription?.supportingInformation)) {
        const ingredients = prescription.supportingInformation.filter((info: any) => 
          info.resourceType === 'Ingredient' || info.itemId || info.item_id
        ).map((ing: any) => {
          const id = ing.itemId || ing.item_id
          const name = ing.name || ing.text || (id ? itemNameById.get(id) : 'Unknown Ingredient')
          const qty = ing.quantity?.value || ing.amount?.value || ''
          const unit = ing.quantity?.unit || ing.amount?.unit || ''
          return `${name} ${qty}${unit}`.trim()
        })
        
        if (ingredients.length > 0) {
          racikanName += ` (${ingredients.join(', ')})`
        }
      }
      resolvedName = racikanName
    }

    return {
      key: String(item.id),
      date: formatDate(item.whenHandedOver),
      patientName: getPatientName(item.patient),
      itemName: resolvedName,
      quantity: item.quantity?.value || 0,
      unit: item.quantity?.unit || '',
      status: item.status
    }
  })

  const handleDownloadCSV = () => {
    if (!tableData.length) {
      message.warning('Tidak ada data untuk diunduh')
      return
    }

    const headers = ['Tanggal', 'Pasien', 'Nama Obat', 'Jumlah', 'Satuan', 'Status']
    const rows = tableData.map(item => [
      `"${item.date}"`,
      `"${item.patientName.replace(/"/g, '""')}"`,
      `"${item.itemName.replace(/"/g, '""')}"`,
      item.quantity,
      `"${item.unit}"`,
      `"${item.status}"`
    ])

    downloadCSV(headers, rows, 'laporan_penjualan_obat')
  }

  const columns: ColumnsType<SalesReportItem> = [
    { title: 'Tanggal', dataIndex: 'date', key: 'date' },
    { title: 'Pasien', dataIndex: 'patientName', key: 'patientName' },
    { title: 'Nama Obat', dataIndex: 'itemName', key: 'itemName' },
    { title: 'Jumlah', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Satuan', dataIndex: 'unit', key: 'unit' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => <Tag color={status === 'completed' ? 'green' : 'orange'}>{status}</Tag>
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Laporan Penjualan/Dispensing</h3>
        <div className="flex gap-2">
          <RangePicker />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            Refresh
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadCSV}>
            Download CSV
          </Button>
        </div>
      </div>
      
      {isError && <div className="text-red-500">Gagal memuat data laporan penjualan.</div>}

      <div className="p-4 bg-white">
        <Table 
          columns={columns} 
          dataSource={tableData} 
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          bordered
          size="small"
        />
      </div>
    </div>
  )
}

const PurchaseReport = () => {
  const { data, isLoading, refetch, isError, error } = useQuery<WarehouseNTTBResponse>({
    queryKey: ['warehouseNTTB', 'list'],
    queryFn: async () => {
      const api = (
        window.api?.query as {
          warehouseNTTB?: { list: (args?: { limit?: number; depth?: number }) => Promise<WarehouseNTTBResponse> }
        }
      ).warehouseNTTB
      
      if (!api?.list) {
        throw new Error('API warehouse NTTB belum tersedia. Silakan restart aplikasi.')
      }
      return api.list({ limit: 100, depth: 1 })
    }
  })

  const tableData: PurchaseReportItem[] = (data?.result || []).map((item) => ({
    key: String(item.id),
    receivedDate: formatDate(item.createdAt),
    nttbCode: item.kode,
    poCode: item.po?.kode || item.kodePo || '-',
    suplierName: item.suplier?.nama || '-',
    itemName: item.item?.nama || 'Unknown Item',
    batchNumber: item.batchNumber || '-',
    expiryDate: formatDate(item.expiryDate),
    quantity: item.stock?.qty || 0,
    price: item.hargaBeli || 0,
    discount: (item.diskon1 || 0) + (item.diskon2 || 0),
    total: item.total || 0,
    notes: item.note || '-'
  }))

  const handleDownloadCSV = () => {
    if (!tableData.length) {
      message.warning('Tidak ada data untuk diunduh')
      return
    }

    const headers = [
      'Tanggal', 
      'No. NTTB', 
      'No. PO', 
      'Supplier', 
      'Nama Barang', 
      'Batch', 
      'Kadaluarsa', 
      'Jumlah', 
      'Harga Beli', 
      'Diskon', 
      'Total', 
      'Catatan'
    ]
    
    const rows = tableData.map(item => [
      `"${item.receivedDate}"`,
      `"${item.nttbCode}"`,
      `"${item.poCode}"`,
      `"${item.suplierName.replace(/"/g, '""')}"`,
      `"${item.itemName.replace(/"/g, '""')}"`,
      `"${item.batchNumber}"`,
      `"${item.expiryDate}"`,
      item.quantity,
      item.price,
      item.discount,
      item.total,
      `"${item.notes.replace(/"/g, '""')}"`
    ])

    downloadCSV(headers, rows, 'laporan_pembelian_nttb')
  }

  const columns: ColumnsType<PurchaseReportItem> = [
    { title: 'Tanggal', dataIndex: 'receivedDate', key: 'receivedDate' },
    { title: 'No. NTTB', dataIndex: 'nttbCode', key: 'nttbCode' },
    { title: 'No. PO', dataIndex: 'poCode', key: 'poCode' },
    { title: 'Supplier', dataIndex: 'suplierName', key: 'suplierName' },
    { title: 'Nama Barang', dataIndex: 'itemName', key: 'itemName' },
    { title: 'Batch', dataIndex: 'batchNumber', key: 'batchNumber' },
    { title: 'ED', dataIndex: 'expiryDate', key: 'expiryDate' },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    { 
      title: 'Total', 
      dataIndex: 'total', 
      key: 'total',
      render: (val) => val?.toLocaleString('id-ID')
    },
    { title: 'Catatan', dataIndex: 'notes', key: 'notes' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Laporan Pembelian (NTTB)</h3>
        <div className="flex gap-2">
          <RangePicker />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            Refresh
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadCSV}>
            Download CSV
          </Button>
        </div>
      </div>

      {isError && (
        <div className="text-red-500">
          Gagal memuat data laporan pembelian: {(error as Error).message}
        </div>
      )}

      <div className="p-4 bg-white">
        <Table 
          columns={columns} 
          dataSource={tableData} 
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          bordered
          size="small"
          scroll={{ x: 1500 }}
        />
      </div>
    </div>
  )
}

// Common CSV Downloader
const downloadCSV = (headers: string[], rows: (string | number)[][], filenamePrefix: string) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  message.success('Laporan berhasil diunduh')
}

const ReportPage = () => {
  const [activeTab, setActiveTab] = useState('1')

  const items = [
    {
      key: '1',
      label: 'Laporan Stok',
      children: <StockReport />
    },
    {
      key: '2',
      label: 'Laporan Penjualan',
      children: <SalesReport />
    },
    {
      key: '3',
      label: 'Laporan Pembelian',
      children: <PurchaseReport />
    }
  ]

  return (
    <div className="p-6">
      <Card title="Laporan Farmasi" bordered={false}>
        <Tabs activeKey={activeTab} items={items} onChange={setActiveTab} />
      </Card>
    </div>
  )
}

export default ReportPage
