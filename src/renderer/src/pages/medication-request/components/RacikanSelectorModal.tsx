import { Modal, Table, Input, Button, Tag } from 'antd'
import { useState, useEffect } from 'react'
import { SearchOutlined } from '@ant-design/icons'

interface RacikanSelectorModalProps {
  open: boolean
  onCancel: () => void
  onSelect: (racikan: any) => void
}

export const RacikanSelectorModal = ({ open, onCancel, onSelect }: RacikanSelectorModalProps) => {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  // fetchData is handled by useEffect on open

  // We should actually use a proper API call method verified for simrs-electron.
  // Let's check how itemOptions are fetched in medication-request-form.tsx:
  // const fn = (window.api?.query as { item?: { list: () => Promise<any> } }).item?.list
  
  // For master racikan, let's just make a direct standard request using window.api.axios if available.

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    setLoading(true)
    console.log('[RX][TemplateModal] window.api.query keys:', Object.keys((window.api as any)?.query || {}))
    try {
       const api = (window.api?.query as any)?.masterRacikan
       if (api?.list) {
         const response = await api.list({ q: searchText })
         console.log('[RX][TemplateModal] result from API:', response)
         setData(response?.result || response?.data || [])
       } else {
         console.warn('[RX][TemplateModal] API masterRacikan.list not available')
         setData([])
       }
    } catch (e) {
       console.error("Failed to fetch custom racikan", e)
    } finally {
       setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Nama Template Racikan',
      dataIndex: 'nama',
      key: 'nama',
      render: (text: string) => <strong className="text-blue-600">{text}</strong>
    },
    {
      title: 'Isi Obat (Komposisi)',
      key: 'composition',
      width: 250,
      render: (_, record: any) => {
        const ingredients = Array.isArray(record.items) ? record.items : []
        return (
          <div className="flex flex-wrap gap-1">
            {ingredients.map((ing: any, idx: number) => (
              <Tag key={idx} color="default" className="text-[10px]">
                {ing.item?.nama || ing.name || 'Obat'}
              </Tag>
            ))}
            {ingredients.length === 0 && <span className="text-gray-400 text-xs">-</span>}
          </div>
        )
      }
    },
    {
      title: 'Sediaan',
      dataIndex: 'sediaan',
      key: 'sediaan',
      render: (sediaan: any) => sediaan?.nama || '-'
    },
    {
      title: 'Aksi',
      key: 'aksi',
      align: 'center' as const,
      width: 80,
      render: (_, record: any) => (
        <Button size="small" type="primary" onClick={() => onSelect(record)}>
          Pilih
        </Button>
      )
    }
  ]

  const filteredData = data.filter((item) => {
    const q = searchText.toLowerCase()
    const matchName = item.nama?.toLowerCase().includes(q)
    
    const ingredients = Array.isArray(item.items) ? item.items : []
    const matchIngredients = ingredients.some((ing: any) => {
      const itemName = (ing.item?.nama || ing.name || '').toLowerCase()
      return itemName.includes(q)
    })

    return matchName || matchIngredients
  })

  return (
    <Modal
      title="Pilih Template Master Racikan"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      centered
    >
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Cari nama racikan atau isi obat di dalamnya..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          autoFocus
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 8 }}
        scroll={{ y: 400 }}
      />
    </Modal>
  )
}
