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
  itemCategoryCode?: string | null
  itemGroupCode?: string | null
  fpktl?: boolean | null
  prb?: boolean | null
  oen?: boolean | null
  sediaanId?: number | null
  peresepanMaksimal?: any | null
  restriksi?: string | null
  kekuatan?: string | null
  satuanId?: number | null
  categoryRef?: { code: string; display: string } | null
  groupRef?: { code: string; display: string } | null
}

export interface ItemOption {
  value: number
  label: string
  unitCode: string
  categoryType: string
  // Extend with all flags from attributes
  itemCategoryCode?: string | null
  itemGroupCode?: string | null
  fpktl?: boolean | null
  prb?: boolean | null
  oen?: boolean | null
  peresepanMaksimal?: any | null
  restriksi?: string | null
  kekuatan?: string | null
  satuanId?: number | null
  categoryId?: number | null
  itemCategoryName?: string | null
  itemGroupName?: string | null
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
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined)

  const categories = useMemo(() => {
    const types = new Set(itemOptions.map((opt) => opt.itemCategoryName).filter(Boolean) as string[])
    return Array.from(types)
      .sort()
      .map((type) => ({ label: type.toUpperCase(), value: type }))
  }, [itemOptions])

  const groups = useMemo(() => {
    const types = new Set(itemOptions.map((opt) => opt.itemGroupName).filter(Boolean) as string[])
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

      const matchCategory = !selectedCategory || item.itemCategoryName === selectedCategory
      const matchGroup = !selectedGroup || item.itemGroupName === selectedGroup

      return matchSearch && matchCategory && matchGroup
    })
  }, [itemOptions, searchText, selectedCategory, selectedGroup])

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
          {record.itemCategoryName && <Tag color="cyan">{record.itemCategoryName.toUpperCase()}</Tag>}
          {record.itemGroupName && <Tag color="red">{record.itemGroupName.toUpperCase()}</Tag>}
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
            placeholder="Kategori"
            allowClear
            style={{ width: 140 }}
            options={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
          <Select
            placeholder="Golongan"
            allowClear
            style={{ width: 140 }}
            options={groups}
            value={selectedGroup}
            onChange={setSelectedGroup}
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
