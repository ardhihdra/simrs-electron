import { Card, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DoctorScheduleRowActions } from './DoctorScheduleRowActions'
import { DoctorScheduleStatusTag } from './DoctorScheduleStatusTag'
import { formatDoctorScheduleDate } from './helpers'
import type { DoctorScheduleRow } from './types'

const baseColumns: ColumnsType<DoctorScheduleRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60, align: 'center' },
  { title: 'Nama Jadwal', dataIndex: 'scheduleName', key: 'scheduleName', width: 220 },
  { title: 'Dokter', dataIndex: 'doctorName', key: 'doctorName', width: 200 },
  {
    title: 'Kategori',
    dataIndex: 'category',
    key: 'category',
    width: 200,
    render: (value: string) => value || '-'
  },
  {
    title: 'Poli',
    dataIndex: 'poli',
    key: 'poli',
    width: 180
  },
  {
    title: 'Periode Berlaku',
    dataIndex: 'effectiveRange',
    key: 'effectiveRange',
    width: 220
  },
  // {
  //   title: 'ID Kontrak',
  //   dataIndex: 'contractId',
  //   key: 'contractId',
  //   width: 110,
  //   align: 'center'
  // },
  // {
  //   title: 'ID Lokasi',
  //   dataIndex: 'locationId',
  //   key: 'locationId',
  //   width: 110,
  //   align: 'center'
  // },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    align: 'center',
    render: (value: DoctorScheduleRow['status']) => <DoctorScheduleStatusTag status={value} />
  },
  {
    title: 'Keterangan',
    dataIndex: 'note',
    key: 'note',
    width: 260,
    render: (value: string) => (
      <Typography.Paragraph ellipsis={{ rows: 2, expandable: false }} className="mb-0">
        {value || '-'}
      </Typography.Paragraph>
    )
  }
]

interface DoctorScheduleDataTableProps {
  rows: DoctorScheduleRow[]
  loading: boolean
  isError: boolean
}

export function DoctorScheduleDataTable({ rows, loading, isError }: DoctorScheduleDataTableProps) {
  const columns: ColumnsType<DoctorScheduleRow> = [
    ...baseColumns,
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => <DoctorScheduleRowActions record={record} />
    }
  ]

  return (
    <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
      {isError ? (
        <div className="flex items-center justify-center h-full min-h-[320px] text-red-500">
          Gagal memuat daftar jadwal dokter.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-full min-h-[320px]">
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={rows}
          rowKey={(record) => String(record.id ?? record.no)}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1850 }}
          size="middle"
        />
      )}
    </Card>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const buildDoctorScheduleRangeLabel = (
  berlakuDari: string,
  berlakuSampai?: string | null
) => {
  return `${formatDoctorScheduleDate(berlakuDari)} - ${formatDoctorScheduleDate(berlakuSampai) === '-' ? 'Sekarang' : formatDoctorScheduleDate(berlakuSampai)}`
}
