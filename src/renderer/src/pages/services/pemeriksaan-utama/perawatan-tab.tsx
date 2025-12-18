import { Table, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlayCircleOutlined } from '@ant-design/icons'

interface DataType {
  key: string
  no: number
  kategori: string
  perawatan: string
  dokter: string
  asistenDokter: string
  perawat1: string
  perawat2: string
  jumlah: number
  jumlahDiambil: number
}

const data: DataType[] = [
  {
    key: '1',
    no: 1,
    kategori: 'Rawat Jalan',
    perawatan: 'Konsultasi Dokter Umum',
    dokter: 'dr. Syahrial',
    asistenDokter: '-',
    perawat1: 'Suster Siti',
    perawat2: '-',
    jumlah: 1,
    jumlahDiambil: 1
  },
  {
    key: '2',
    no: 2,
    kategori: 'Tindakan',
    perawatan: 'Pembersihan Luka',
    dokter: 'dr. Syahrial',
    asistenDokter: 'Asisten Budi',
    perawat1: 'Suster Siti',
    perawat2: 'Suster Ana',
    jumlah: 1,
    jumlahDiambil: 1
  },
  {
    key: '3',
    no: 3,
    kategori: 'Obat',
    perawatan: 'Injeksi Vitamin C',
    dokter: '-',
    asistenDokter: '-',
    perawat1: 'Suster Ana',
    perawat2: '-',
    jumlah: 1,
    jumlahDiambil: 1
  }
]

export const PerawatanTab = () => {
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
      title: 'Kategori',
      dataIndex: 'kategori',
      key: 'kategori'
    },
    {
      title: 'Perawatan / Tindakan',
      dataIndex: 'perawatan',
      key: 'perawatan'
    },
    {
      title: 'Dokter',
      dataIndex: 'dokter',
      key: 'dokter'
    },
    {
      title: 'Asisten Dokter',
      dataIndex: 'asistenDokter',
      key: 'asistenDokter'
    },
    {
      title: 'Perawat 1',
      dataIndex: 'perawat1',
      key: 'perawat1'
    },
    {
      title: 'Perawat 2',
      dataIndex: 'perawat2',
      key: 'perawat2'
    },
    {
      title: 'Jumlah',
      dataIndex: 'jumlah',
      key: 'jumlah',
      width: 80
    },
    {
      title: 'Jumlah Diambil',
      dataIndex: 'jumlahDiambil',
      key: 'jumlahDiambil',
      width: 120
    }
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
