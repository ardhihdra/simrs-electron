import { Table, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlayCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

interface DataType {
  key: string
  no: number
  kodeLoinc: string
  bidang: string
  nama: string
  dokter: string
  asistenDokter: string
  perawat1: string
  perawat2: string
  jumlah: number
  jumlahDiambil: number
  jadikanDeposit: boolean
  tarif: number
  subtotal: number
  diskon: number
  nominalDiskon: number
  total: number
}

const data: DataType[] = []

export const LabolatoriumTab = () => {
  const columns: ColumnsType<DataType> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 50,
      align: 'center'
    },
    {
      title: <PlayCircleOutlined />,
      key: 'play',
      width: 50,
      align: 'center',
      render: () => <Button type="text" icon={<PlayCircleOutlined />} size="small" />
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'center',
      render: () => (
        <div className="flex justify-center gap-1">
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" />
        </div>
      )
    },
    { title: 'Kode LOINC', dataIndex: 'kodeLoinc', key: 'kodeLoinc' },
    { title: 'Bidang', dataIndex: 'bidang', key: 'bidang' },
    { title: 'Nama', dataIndex: 'nama', key: 'nama' },
    { title: 'Dokter', dataIndex: 'dokter', key: 'dokter' },
    { title: 'Asisten Dokter', dataIndex: 'asistenDokter', key: 'asistenDokter' },
    { title: 'Perawat 1', dataIndex: 'perawat1', key: 'perawat1' },
    { title: 'Perawat 2', dataIndex: 'perawat2', key: 'perawat2' },
    { title: 'Jumlah', dataIndex: 'jumlah', key: 'jumlah', width: 80 },
    { title: 'Jumlah Diambil', dataIndex: 'jumlahDiambil', key: 'jumlahDiambil', width: 120 },
    { title: 'Jadikan Deposit', dataIndex: 'jadikanDeposit', key: 'jadikanDeposit' },
    { title: 'Tarif', dataIndex: 'tarif', key: 'tarif' },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal' },
    { title: 'Diskon', dataIndex: 'diskon', key: 'diskon' },
    { title: 'Nominal Diskon', dataIndex: 'nominalDiskon', key: 'nominalDiskon' },
    { title: 'Total', dataIndex: 'total', key: 'total' }
  ]

  return (
    <div className="p-4">
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
        bordered
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
