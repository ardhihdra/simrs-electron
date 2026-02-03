import { Button, DatePicker, Select, Popconfirm, message } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ServiceRequestAttributes } from '@shared/service-request'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import dayjs from 'dayjs'
import { useState } from 'react'

const { Option } = Select

// Extend attributes to include potential joined fields or formatted values
type ServiceRequestRow = ServiceRequestAttributes

const baseColumns = [
  {
    title: 'Tanggal',
    dataIndex: 'authoredOn',
    key: 'authoredOn',
    render: (v: ServiceRequestRow['authoredOn']) =>
      v ? dayjs(v).format('DD MMM YYYY HH:mm:ss') : '-'
  },
  {
    title: 'No. Faktur',
    key: 'faktur',
    render: (_value: ServiceRequestRow['identifier'], record: ServiceRequestRow) => {
      // Mocking/extracting identifier if available, otherwise ID
      return record.identifier?.[0]?.value || `INV-${record.id}`
    }
  },
  {
    title: 'Nama Pasien',
    dataIndex: ['subject', 'display'],
    key: 'subject',
    render: (text: string, record: ServiceRequestRow) => text || record.subject?.reference || '-'
  },
  {
    title: 'No. RM',
    key: 'mrn',
    render: (_value: ServiceRequestRow['subject'], record: ServiceRequestRow) => {
      const ref = record.subject?.reference || ''
      return ref.split('/')[1] || '-'
    }
  },
  {
    title: 'Nama Dokter',
    dataIndex: ['requester', 'display'],
    key: 'requester',
    render: (text: string) => text || '-'
  },
  {
    title: 'Nama Poli',
    key: 'poli',
    render: () => {
      // Mock location or get from extension
      return 'POLI UMUM'
    }
  },
  {
    title: 'Rujukan',
    key: 'rujukan',
    render: (_value: ServiceRequestRow['reason'], record: ServiceRequestRow) => {
      return record.reason?.[0]?.text || '-'
    }
  },
  {
    title: 'Catatan',
    key: 'catatan',
    render: (_value: ServiceRequestRow['note'], record: ServiceRequestRow) => {
      return record.note?.[0]?.text || '-'
    }
  },
  {
    title: 'Kasir',
    key: 'kasir',
    render: () => 'Admin' // Placeholder
  }
]

function RowActions({ record }: { record: ServiceRequestRow }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // @ts-ignore - dynamic API call not typed in window
      const res = await window.api.query.serviceRequest.deleteById({ id })
      if (!res.success) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      message.success('Data berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['serviceRequest', 'list'] })
    },
    onError: (err: Error) => {
      message.error('Gagal menghapus: ' + err.message)
    }
  })

  return (
    <div className="flex gap-2 justify-center">
      <Button
        icon={<EditOutlined />}
        size="small"
        onClick={() => {
          if (record.id) {
            navigate(`/dashboard/service-request/edit/${record.id}`)
          }
        }}
      />
      <Popconfirm
        title="Hapus data?"
        description="Apakah Anda yakin ingin menghapus data ini?"
        onConfirm={() => {
          if (record.id) deleteMutation.mutate(record.id)
        }}
        okText="Ya"
        cancelText="Tidak"
      >
        <Button icon={<DeleteOutlined />} size="small" danger loading={deleteMutation.isPending} />
      </Popconfirm>
    </div>
  )
}

export default function ServiceRequestTable() {
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState<string | null>(dayjs().startOf('day').toISOString())
  const [endDate, setEndDate] = useState<string | null>(dayjs().endOf('day').toISOString())
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const {
    data: serviceRequests,
    isLoading,
    error
  } = useQuery({
    queryKey: ['serviceRequest', 'list'],
    queryFn: async () => {
      // @ts-ignore - dynamic API
      const response = await window.api.query.serviceRequest.list()
      if (!response.success) throw new Error(response.error)
      return response.data as ServiceRequestRow[]
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Pemeriksaan Laboratorium</h2>

        <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded ">
          <div>
            <div className="mb-1 text-sm font-semibold">Pilihan Periode</div>
            <Select defaultValue="tanggal" style={{ width: 200 }}>
              <Option value="tanggal">Berdasarkan Tanggal</Option>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-sm opacity-0">Start Date</div>
            <DatePicker
              value={startDate ? dayjs(startDate) : null}
              onChange={(d) => setStartDate(d ? d.startOf('day').toISOString() : null)}
              format="DD MMM YYYY"
            />
          </div>

          <div>
            <div className="mb-1 text-sm opacity-0">End Date</div>
            <DatePicker
              value={endDate ? dayjs(endDate) : null}
              onChange={(d) => setEndDate(d ? d.endOf('day').toISOString() : null)}
              format="DD MMM YYYY"
            />
          </div>

          <Button type="primary" icon={<SearchOutlined />} className="bg-blue-500">
            Cari
          </Button>
          <Button icon={<ReloadOutlined />}>Refresh</Button>
          <Button
            icon={<SearchOutlined />}
            onClick={async () => {
              try {
                const res = await window.api.query.export.exportCsv({
                  entity: 'servicerequest',
                  usePagination: true,
                  page: currentPage,
                  items: pageSize,
                  startDate: startDate ?? undefined,
                  endDate: endDate ?? undefined
                })
                if (
                  res &&
                  typeof res === 'object' &&
                  'success' in res &&
                  res.success &&
                  'url' in res &&
                  res.url
                ) {
                  window.open(res.url as string, '_blank')
                } else {
                  message.error('Gagal menyiapkan URL ekspor')
                }
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                message.error(msg || 'Gagal ekspor CSV')
              }
            }}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div>
          Menampilkan {serviceRequests?.length || 0} data dari total {serviceRequests?.length || 0}{' '}
          data.
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/dashboard/service-request/create')}
        >
          Buat Baru
        </Button>
      </div>

      <GenericTable<ServiceRequestRow>
        columns={baseColumns}
        dataSource={serviceRequests || []}
        rowKey={(r) => String(r.id || '')}
        action={{
          title: 'Action',
          width: 80,
          align: 'center',
          fixedRight: true,
          render: (record) => <RowActions record={record} />
        }}
        tableProps={{
          pagination: {
            pageSize,
            current: currentPage,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size || 10)
            }
          },
          scroll: { x: 1000 }
        }}
      />
    </div>
  )
}
