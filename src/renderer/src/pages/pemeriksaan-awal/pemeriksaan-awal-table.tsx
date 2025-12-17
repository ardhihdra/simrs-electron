import { Table, Button, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {} from '@ant-design/icons'
import { Link } from 'react-router'

interface DataType {
  key: string
  no: number
  tanggal: string
  noKunjungan: string
  antrianPendaftaran: string
  antrianPoli: string
  noRm: string
  namaPasien: string
  namaDokter: string
  status: string
}

const dummyData: DataType[] = [
  {
    key: '1',
    no: 1,
    tanggal: '2025-12-17',
    noKunjungan: 'REG-001',
    antrianPendaftaran: 'A-001',
    antrianPoli: 'P-001',
    noRm: 'RM-0001',
    namaPasien: 'John Doe',
    namaDokter: 'Dr. Smith',
    status: 'Menunggu'
  },
  {
    key: '2',
    no: 2,
    tanggal: '2025-12-17',
    noKunjungan: 'REG-002',
    antrianPendaftaran: 'A-002',
    antrianPoli: 'P-002',
    noRm: 'RM-0002',
    namaPasien: 'Jane Doe',
    namaDokter: 'Dr. Strange',
    status: 'Diperiksa'
  },
  {
    key: '3',
    no: 3,
    tanggal: '2025-12-17',
    noKunjungan: 'REG-003',
    antrianPendaftaran: 'A-003',
    antrianPoli: 'P-003',
    noRm: 'RM-0003',
    namaPasien: 'Bob Smith',
    namaDokter: 'Dr. House',
    status: 'Selesai'
  }
]

const PemeriksaanAwalTable = () => {
  const columns: ColumnsType<DataType> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 60
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal'
    },
    {
      title: 'No. Kunjungan',
      dataIndex: 'noKunjungan',
      key: 'noKunjungan'
    },
    {
      title: 'Antrian Pendaftaran',
      dataIndex: 'antrianPendaftaran',
      key: 'antrianPendaftaran'
    },
    {
      title: 'Antrian Poli',
      dataIndex: 'antrianPoli',
      key: 'antrianPoli'
    },
    {
      title: 'No. RM',
      dataIndex: 'noRm',
      key: 'noRm'
    },
    {
      title: 'Nama Pasien',
      dataIndex: 'namaPasien',
      key: 'namaPasien'
    },
    {
      title: 'Nama Dokter',
      dataIndex: 'namaDokter',
      key: 'namaDokter'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default'
        if (status === 'Menunggu') color = 'orange'
        if (status === 'Diperiksa') color = 'blue'
        if (status === 'Selesai') color = 'green'
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/dashboard/pemeriksaan-awal/${record.key}/create`}>
            <Button type="primary" size="small">
              Periksa
            </Button>
          </Link>
        </Space>
      )
    }
  ]

  return <Table columns={columns} dataSource={dummyData} pagination={{ pageSize: 10 }} />
}

export default PemeriksaanAwalTable
