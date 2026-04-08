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

  const fetchRacikan = async (search = '') => {
    setLoading(true)
    try {
      // Menggunakan axios atau API standar Electron untuk hit module moduleRouter.ts -> /master-racikan/read
      // Kita asumsikan API GET dengan parameter `q` atau filter nama tersedia.
      const rawApi = window.api?.query as any
      // Since it's a new API, we might need to hit it directly if not bound in preload
      if (rawApi?.request?.list) {
         // Fallback using general request method if it exists
         const res = await rawApi.request.list({ entity: 'module/master-racikan', options: { q: search } })
         setData(res?.result || [])
      } else {
         // Fallback standard fetch through our standard wrapper (assuming similar to item)
         // In simrs-electron normally we use axios or configured TRPC. We'll use standard window.api
         const axiosLikeGet = (window.api as any)?.axios?.get || window.fetch
         // This is a placeholder, actual implementation will depend on how the API is exposed
         // Assuming a generic entity listing capability exists or we will use standard GET
         const response = await window.api.axios.get(`/api/module/master-racikan?q=${search}`)
         setData(response?.data?.result || response?.data?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch master racikan', error)
      // fallback mock for development or UI test if needed
      setData([])
    } finally {
      setLoading(false)
    }
  }

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
      title: 'Sediaan',
      dataIndex: 'sediaan',
      key: 'sediaan',
      render: (sediaan: any) => sediaan?.nama || '-'
    },
    {
      title: 'Dosis Standar',
      dataIndex: 'defaultDosage',
      key: 'defaultDosage',
    },
    {
      title: 'Batas Umur',
      key: 'age',
      render: (_, record: any) => `${record.minAge || 0} - ${record.maxAge || '∞'} bln`
    },
    {
      title: 'Aksi',
      key: 'aksi',
      align: 'center' as const,
      width: 100,
      render: (_, record: any) => (
        <Button size="small" type="primary" onClick={() => onSelect(record)}>
          Pilih
        </Button>
      )
    }
  ]

  const filteredData = data.filter((item) => 
     item.nama?.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <Modal
      title="Pilih Template Master Racikan"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
    >
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Cari nama racikan..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 5 }}
        scroll={{ y: 300 }}
      />
    </Modal>
  )
}
