/**
 * Purpose: Modal pemilihan/peninjauan tindakan medis untuk form tindakan.
 * Main callers: DetailTindakanForm (tab tindakan non-paket dan paket tindakan).
 * Key dependencies: antd Modal/Table/Input/Select, hooks query master tindakan.
 * Main/public functions: ProcedureSelectorModal.
 * Side effects: trigger callback `onSelect`, trigger callback filter/pagination saat mode select.
 */
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
  mode?: 'select' | 'readonly'
  title?: string
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
  mode = 'select',
  title,
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
  const isReadonly = mode === 'readonly'
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
    if (isReadonly) return
    onSearchChange(debouncedSearchText.trim())
  }, [debouncedSearchText, onSearchChange, open, isReadonly])

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
    }
  ]
  if (!isReadonly) {
    columns.push({
      title: 'Aksi',
      key: 'action',
      width: 80,
      render: (_: any, record: MasterTindakanItem) => (
        <Button type="primary" size="small" onClick={() => onSelect(record)}>
          Pilih
        </Button>
      )
    })
  }

  const readonlyFilteredProcedures = useMemo(() => {
    if (!isReadonly) return procedures
    const q = searchText.trim().toLowerCase()
    if (!q) return procedures
    return procedures.filter((item) => {
      const nama = String(item?.namaTindakan || '').toLowerCase()
      const kode = String(item?.kodeTindakan || '').toLowerCase()
      const kategori = String(item?.kategoriTindakan || '').toLowerCase()
      return nama.includes(q) || kode.includes(q) || kategori.includes(q)
    })
  }, [isReadonly, procedures, searchText])

  return (
    <Modal
      title={title || (isReadonly ? 'Daftar Tindakan Paket' : 'Pilih Tindakan / Prosedur Medis')}
      open={open}
      onCancel={onCancel}
      width={1000}
      footer={null}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {isReadonly ? (
          <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <Input
              placeholder="Cari Nama atau Kode Tindakan Paket..."
              prefix={<SearchOutlined />}
              style={{ flex: 1, minWidth: '250px' }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              autoFocus
            />
          </div>
        ) : (
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
        )}
        <Table
          dataSource={isReadonly ? readonlyFilteredProcedures : procedures}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={
            isReadonly
              ? false
              : {
                  current: pagination?.page ?? 1,
                  pageSize: pagination?.limit ?? pageSize,
                  total: pagination?.count ?? 0,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total}`
                }
          }
          onChange={(tablePagination) => {
            if (isReadonly) return
            onPageChange(
              tablePagination.current ?? 1,
              tablePagination.pageSize ?? pageSize
            )
          }}
          onRow={(record) => ({
            onDoubleClick: () => {
              if (!isReadonly) onSelect(record)
            },
            style: { cursor: isReadonly ? 'default' : 'pointer' }
          })}
          size="small"
          bordered
        />
      </Space>
    </Modal>
  )
}
