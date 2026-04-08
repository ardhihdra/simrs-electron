import { Modal, Table, Input, Button, Space, Tag, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { MasterTindakanItem, CATEGORY_BPJS_VALUES } from '@renderer/hooks/query/use-master-tindakan'

interface ProcedureSelectorModalProps {
  open: boolean
  onCancel: () => void
  onSelect: (item: MasterTindakanItem) => void
  procedures: MasterTindakanItem[]
  loading?: boolean
}

export const ProcedureSelectorModal = ({
  open,
  onCancel,
  onSelect,
  procedures,
  loading
}: ProcedureSelectorModalProps) => {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [selectedBpjsCategory, setSelectedBpjsCategory] = useState<string | undefined>(undefined)

  const categories = useMemo(() => {
    const types = new Set(procedures.map((p) => p.kategoriTindakan).filter(Boolean))
    return Array.from(types)
      .sort()
      .map((type) => ({ label: type!, value: type! }))
  }, [procedures])

  const filteredData = useMemo(() => {
    const q = searchText.toLowerCase()
    return procedures.filter((item) => {
      const nameMatch = item.namaTindakan.toLowerCase().includes(q)
      const codeMatch = item.kodeTindakan.toLowerCase().includes(q)
      const searchMatch = !searchText || nameMatch || codeMatch

      const categoryMatch = !selectedCategory || item.kategoriTindakan === selectedCategory
      const bpjsMatch = !selectedBpjsCategory || item.categoryBpjs === selectedBpjsCategory

      return searchMatch && categoryMatch && bpjsMatch
    })
  }, [procedures, searchText, selectedCategory, selectedBpjsCategory])

  const columns = [
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
            onChange={setSelectedCategory}
          />
          <Select
            placeholder="Kategori BPJS"
            allowClear
            style={{ width: 180 }}
            options={CATEGORY_BPJS_VALUES.map((v) => ({ label: v, value: v }))}
            value={selectedBpjsCategory}
            onChange={setSelectedBpjsCategory}
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
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
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
