import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { App, Form, Input, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import CreateAncillaryModal from './components/CreateAncillaryModal'

export default function LaboratoryQueue() {
  const [searchText, setSearchText] = useState('')
  const { message } = App.useApp()
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const {
    data: encountersData,
    isLoading,
    isRefetching
  } = client.query.entity.useQuery({
    model: 'encounter',
    method: 'get',
    params: {
      category: 'LABORATORY'
    }
  })

  const filteredData = useMemo(() => {
    const data = (encountersData as any)?.result || []
    if (!searchText) return data
    return data.filter(
      (item: any) =>
        (item.patientName || item.patient?.name)
          ?.toLowerCase()
          .includes(searchText.toLowerCase()) ||
        (item.patientMrNo || item.patient?.mrn)?.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [encountersData, searchText])

  const columns: ColumnsType<any> = [
    {
      title: 'Pasien',
      key: 'patient',
      render: (_, record: any) => (
        <div>
          <div className="font-medium text-blue-600">
            {record.patientName || record.patient?.name || 'Unknown Patient'}
          </div>
          <div className="text-xs text-gray-500">
            {record.patientMrNo || record.patient?.mrn || record.patientId}
          </div>
        </div>
      )
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => {
        const colors = {
          CLINICAL: 'cyan',
          LABORATORY: 'orange',
          RADIOLOGY: 'purple'
        }
        return <Tag color={colors[cat] || 'default'}>{cat}</Tag>
      }
    },
    {
      title: 'Waktu Mulai',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: 'Unit Asal',
      key: 'unit',
      render: (_, record: any) =>
        record.queueTicket?.serviceUnit?.display || record.serviceUnitName || '-'
    },
    {
      title: 'Poli Asal',
      key: 'poli',
      render: (_, record: any) => record.queueTicket?.poli?.name || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status?.toUpperCase()}</Tag>
    }
  ]

  const onSearch = (values: any) => {
    setSearchText(values.patientName || '')
  }

  const handleCreateAncillary = (record: any) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRecord(null)
  }

  return (
    <div className="p-4">
      <TableHeader
        title="Management Penunjang (Lab & Rad)"
        subtitle="Daftar encounter aktif dan pembuatan encounter penunjang"
        onSearch={onSearch}
        onRefresh={() => {}}
        onCreate={() => {
          // If they click create from header, we could show a patient search modal
          // But for now, we guide them to pick from the list or search above
          message.info(
            'Silahkan cari pasien Clinical aktif dari tabel di bawah untuk dibuatkan penunjang'
          )
        }}
        createLabel="Registrasi Penunjang Baru"
        loading={isLoading || isRefetching}
      >
        <Form.Item name="patientName" style={{ width: '100%' }} label="Pasien">
          <Input
            placeholder="Cari Nama / No. RM Pasien yang sedang dilayani"
            allowClear
            suffix={<SearchOutlined />}
            size="large"
          />
        </Form.Item>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading || isRefetching}
          action={{
            title: 'Aksi',
            width: 250,
            items: (record: any) => [
              {
                label:
                  record.category === 'CLINICAL'
                    ? 'Buat Encounter Penunjang'
                    : 'Buat Penunjang Tambahan',
                icon: <PlusOutlined />,
                type: 'primary',
                onClick: () => handleCreateAncillary(record)
              }
            ]
          }}
        />
      </div>

      <CreateAncillaryModal
        open={isModalOpen}
        onClose={handleCloseModal}
        patient={
          selectedRecord
            ? {
                id: selectedRecord.patientId,
                name: selectedRecord.patientName || selectedRecord.patient?.name || 'Unknown',
                mrn: selectedRecord.patientMrNo || selectedRecord.patient?.mrn || 'N/A'
              }
            : null
        }
        encounter={selectedRecord}
      />
    </div>
  )
}
