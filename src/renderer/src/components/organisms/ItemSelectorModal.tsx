import { Modal, Table, Input, Button, Space, Tag, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'

export interface ItemAttributes {
  id: number
  nama?: string | null
  kode?: string | null
  kodeUnit?: string | null
  unit?: {
    id?: number
    kode?: string | null
    nama?: string | null
  } | null
  itemCategoryId?: number | null
  category?: {
    id?: number
    name?: string | null
    categoryType?: string | null
  } | null
  isObatKeras?: boolean | null
  bpjs?: boolean | null
  fpktl?: boolean | null
  prb?: boolean | null
  oen?: boolean | null
  sediaanId?: number | null
  peresepanMaksimal?: any | null
  restriksi?: string | null
  kekuatan?: string | null
  satuanId?: number | null
}

export interface ItemOption {
  value: number
  label: string
  unitCode: string
  categoryType: string
  // Extend with all flags from attributes
  isObatKeras?: boolean | null
  bpjs?: boolean | null
  fpktl?: boolean | null
  prb?: boolean | null
  oen?: boolean | null
  peresepanMaksimal?: any | null
  restriksi?: string | null
  kekuatan?: string | null
  satuanId?: number | null
  categoryId?: number | null
}

interface ItemSelectorModalProps {
  open: boolean
  onCancel: () => void
  onSelect: (item: ItemOption) => void
  itemOptions: ItemOption[]
  loading?: boolean
}

export const ItemSelectorModal = ({
  open,
  onCancel,
  onSelect,
  itemOptions,
  loading
}: ItemSelectorModalProps) => {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedBpjs, setSelectedBpjs] = useState<boolean | undefined>(undefined)
  const [selectedKeras, setSelectedKeras] = useState<boolean | undefined>(undefined)

  const categories = useMemo(() => {
    const types = new Set(itemOptions.map((opt) => opt.categoryType).filter(Boolean))
    return Array.from(types)
      .sort()
      .map((type) => ({ label: type.toUpperCase(), value: type }))
  }, [itemOptions])

  const filteredData = useMemo(() => {
    const q = searchText.toLowerCase()
    return itemOptions.filter((item) => {
      const matchSearch =
        !searchText ||
        item.label.toLowerCase().includes(q) ||
        item.unitCode.toLowerCase().includes(q) ||
        (item.kekuatan && item.kekuatan.toLowerCase().includes(q)) ||
        (item.restriksi && item.restriksi.toLowerCase().includes(q))

      const matchCategory = !selectedCategory || item.categoryType === selectedCategory
      const matchBpjs = selectedBpjs === undefined || item.bpjs === selectedBpjs
      const matchKeras = selectedKeras === undefined || item.isObatKeras === selectedKeras

      return matchSearch && matchCategory && matchBpjs && matchKeras
    })
  }, [itemOptions, searchText, selectedCategory, selectedBpjs, selectedKeras])

  const columns = [
    {
      title: 'Nama Item',
      dataIndex: 'label',
      key: 'label',
      sorter: (a: ItemOption, b: ItemOption) => a.label.localeCompare(b.label),
      render: (text: string, record: ItemOption) => (
        <Space direction="vertical" size={0}>
          <span className="font-semibold">{text}</span>
          {record.kekuatan && <span className="text-xs text-gray-500 italic">{record.kekuatan}</span>}
        </Space>
      )
    },
    {
      title: 'Satuan',
      dataIndex: 'unitCode',
      key: 'unitCode',
      width: 90,
      render: (v: string) => <Tag color="blue">{v || '-'}</Tag>
    },
    {
      title: 'Status / Flag',
      key: 'flags',
      width: 200,
      render: (_: any, record: ItemOption) => (
        <Space wrap size={[4, 4]}>
          {record.bpjs && <Tag color="cyan">BPJS</Tag>}
          {record.isObatKeras && <Tag color="red">KERAS</Tag>}
          {record.fpktl && <Tag color="purple">FPKTL</Tag>}
          {record.prb && <Tag color="orange">PRB</Tag>}
          {record.oen && <Tag color="magenta">OEN</Tag>}
        </Space>
      )
    },
    {
      title: 'Keterangan Klinis',
      key: 'clinical',
      render: (_: any, record: ItemOption) => (
        <Space direction="vertical" size={0}>
          {record.restriksi && (
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-gray-600">RESTRIKSI:</span> {record.restriksi}
            </div>
          )}
              {record.peresepanMaksimal && (
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-gray-600">MAX:</span>{' '}
                  {typeof record.peresepanMaksimal === 'object' && record.peresepanMaksimal !== null
                    ? `${record.peresepanMaksimal.qty || ''} ${record.peresepanMaksimal.unit || ''} / ${record.peresepanMaksimal.per || ''}`
                    : String(record.peresepanMaksimal || '-')}
                </div>
              )}
        </Space>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      render: (_: any, record: ItemOption) => (
        <Button type="primary" size="small" onClick={() => onSelect(record)}>
          Pilih
        </Button>
      )
    }
  ]

  return (
    <Modal
      title="Pilih Obat / Barang (Detail Medis)"
      open={open}
      onCancel={onCancel}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <Select
            placeholder="Tipe"
            allowClear
            style={{ width: 120 }}
            options={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
          <Select
            placeholder="BPJS?"
            allowClear
            style={{ width: 100 }}
            value={selectedBpjs}
            onChange={setSelectedBpjs}
            options={[
              { label: 'BPJS', value: true },
              { label: 'Non-BPJS', value: false }
            ]}
          />
          <Select
            placeholder="Keras?"
            allowClear
            style={{ width: 100 }}
            value={selectedKeras}
            onChange={setSelectedKeras}
            options={[
              { label: 'Keras', value: true },
              { label: 'Biasa', value: false }
            ]}
          />
          <Input
            placeholder="Cari Nama Item, Kekuatan, atau Restriksi..."
            prefix={<SearchOutlined />}
            style={{ flex: 1, minWidth: '300px' }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            autoFocus
          />
        </div>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="value"
          loading={loading}
          pagination={{ pageSize: 12 }}
          onRow={(record) => ({
            onDoubleClick: () => onSelect(record),
            style: { cursor: 'pointer' }
          })}
          size="small"
          bordered
        />
      </Space>
    </Modal>
  )
}
