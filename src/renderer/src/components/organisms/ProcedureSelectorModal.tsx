import { Modal, Table, Input, Button, Space, Tag, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { useDebounce } from '@renderer/hooks/useDebounce'
import {
  CATEGORY_BPJS_VALUES,
  type MasterTindakanItem,
  type MasterTindakanPagination,
  type CategoryBpjs
} from '@renderer/hooks/query/use-master-tindakan'

interface ProcedureSelectorModalProps {
  open: boolean
  onCancel: () => void
  onSelect: (item: MasterTindakanItem) => void
  procedures: MasterTindakanItem[]
  loading?: boolean
  pagination?: MasterTindakanPagination
  pageSize: number
  searchValue: string
  selectedCategory?: string
  selectedBpjsCategory?: CategoryBpjs
  categoryOptions?: Array<{ label: string; value: string }>
  onSearchChange: (value: string) => void
  onCategoryChange: (value?: string) => void
  onBpjsCategoryChange: (value?: CategoryBpjs) => void
  onPageChange: (page: number, pageSize: number) => void
}

export const ProcedureSelectorModal = ({
  open,
  onCancel,
  onSelect,
  procedures,
  loading,
  pagination,
  pageSize,
  searchValue,
  selectedCategory,
  selectedBpjsCategory,
  categoryOptions,
  onSearchChange,
  onCategoryChange,
  onBpjsCategoryChange,
  onPageChange
}: ProcedureSelectorModalProps) => {
  const [searchText, setSearchText] = useState(searchValue || '')
  const debouncedSearchText = useDebounce(searchText, 300)

  const categories = useMemo(() => {
    if (Array.isArray(categoryOptions) && categoryOptions.length > 0) {
      return categoryOptions
    }
    const typeSet = new Set(
      procedures.map((item) => String(item.kategoriTindakan || '').trim()).filter((value) => value.length > 0)
    )
    return Array.from(typeSet)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ label: value, value }))
  }, [categoryOptions, procedures])

  useEffect(() => {
    if (!open) return
    setSearchText(searchValue || '')
  }, [open, searchValue])

  useEffect(() => {
    if (!open) return
    onSearchChange(debouncedSearchText.trim())
  }, [debouncedSearchText, onSearchChange, open])

  const columns: ColumnsType<MasterTindakanItem> = [
    {
      title: 'Kode',
      dataIndex: 'kodeTindakan',
      key: 'kodeTindakan',
      width: 120,
      render: (v: string) => <Tag color="orange">{v || '-'}</Tag>
    },
    {
      title: 'Nama Tindakan',
      dataIndex: 'namaTindakan',
      key: 'namaTindakan',
      sorter: (a: MasterTindakanItem, b: MasterTindakanItem) =>
        a.namaTindakan.localeCompare(b.namaTindakan),
      render: (text: string) => <span className="font-semibold">{text}</span>
    },
    {
      title: 'Kategori',
      dataIndex: 'kategoriTindakan',
      key: 'kategoriTindakan',
      width: 150,
      render: (v: string) => v || '-'
    },
    {
      title: 'Kat. BPJS',
      dataIndex: 'categoryBpjs',
      key: 'categoryBpjs',
      width: 150,
      render: (v: string) => (v ? <Tag color="cyan">{v}</Tag> : '-')
    },
    {
      title: 'Satuan',
      dataIndex: 'satuan',
      key: 'satuan',
      width: 100,
      render: (v: string) => <Tag color="blue">{v || '-'}</Tag>
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      render: (_: any, record: MasterTindakanItem) => (
        <Button type="primary" size="small" onClick={() => onSelect(record)}>
          Pilih
        </Button>
      )
    }
  ]

  return (
    <Modal
      title="Pilih Tindakan / Prosedur Medis"
      open={open}
      onCancel={onCancel}
      width={1000}
      footer={null}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <Select
            placeholder="Kategori Umum"
            allowClear
            style={{ width: 180 }}
            options={categories}
            value={selectedCategory}
            onChange={(value) => onCategoryChange(value)}
          />
          <Select
            placeholder="Kategori BPJS"
            allowClear
            style={{ width: 180 }}
            options={CATEGORY_BPJS_VALUES.map((v) => ({ label: v, value: v }))}
            value={selectedBpjsCategory}
            onChange={(value) => onBpjsCategoryChange(value as CategoryBpjs | undefined)}
          />
          <Input
            placeholder="Cari Nama or Kode Tindakan..."
            prefix={<SearchOutlined />}
            style={{ flex: 1, minWidth: '250px' }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            autoFocus
          />
        </div>
        <Table
          dataSource={procedures}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination?.page ?? 1,
            pageSize: pagination?.limit ?? pageSize,
            total: pagination?.count ?? 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total}`
          }}
          onChange={(tablePagination) => {
            onPageChange(
              tablePagination.current ?? 1,
              tablePagination.pageSize ?? pageSize
            )
          }}
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
