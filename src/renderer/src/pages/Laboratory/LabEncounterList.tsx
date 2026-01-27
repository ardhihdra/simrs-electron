import GenericTable from '@renderer/components/GenericTable'
import { Tag } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'

interface LabEncounterListProps {
  encounters: any[]
  isLoading: boolean
  onOpenOrder: (encounter: any) => void
  onPrint: (encounter: any) => void
}

export function LabEncounterList({
  encounters,
  isLoading,
  onOpenOrder,
  onPrint
}: LabEncounterListProps) {
  const navigate = useNavigate()
  const columns = [
    {
      title: 'Date',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-')
    },
    {
      title: 'Patient',
      dataIndex: 'patient',
      key: 'patient',
      render: (patient: any) => patient?.name || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag>{status}</Tag>
    }
  ]

  return (
    <GenericTable
      dataSource={encounters}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      action={{
        items: (record) => [
          {
            label: 'Buat Permintaan',
            onClick: () => onOpenOrder(record)
          },
          {
            label: 'Ambil Specimen',
            onClick: () => navigate(`/dashboard/laboratory/specimen/${record.id}`)
          },
          {
            label: 'Input Hasil',
            onClick: () => navigate(`/dashboard/laboratory/result/${record.id}`)
          },
          {
            label: 'Cetak',
            onClick: () => onPrint(record)
          },
          {
            label: 'Transisi',
            onClick: () => navigate('/dashboard/encounter/transition')
          }
        ]
      }}
    />
  )
}
