import { Table, Input, Select, Button } from 'antd'
import { EditOutlined, LockOutlined, HistoryOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'

interface DataType {
  key: string
  no: number
  tanggal: string
  noKunjungan: string
  antreanPoli: string
  noBpjs: string
  noRm: string
  namaPasien: string
  namaDokter: string
  status: string
  statusSatuSehat: string
}

const data: DataType[] = [
  {
    key: '1',
    no: 1,
    tanggal: '17 Dec 2025 07:41:20',
    noKunjungan: 'KJ2512170014',
    antreanPoli: '005',
    noBpjs: '',
    noRm: 'S.4575',
    namaPasien: 'SURYANI',
    namaDokter: 'dr. Syahrial',
    status: 'Sudah Diperiksa',
    statusSatuSehat: 'Terhubung'
  },
  {
    key: '2',
    no: 2,
    tanggal: '17 Dec 2025 08:30:37',
    noKunjungan: 'KJ2512170032',
    antreanPoli: '006',
    noBpjs: '',
    noRm: 'S.3945',
    namaPasien: 'SAFIRA NUR AISYAH',
    namaDokter: 'dr. Syahrial',
    status: 'Sudah Diperiksa',
    statusSatuSehat: 'Tidak terhubung'
  }
]

export default function PemeriksaanUtamaTable() {
  const navigate = useNavigate()
  const columns: ColumnsType<DataType> = [
    {
      title: 'No.',
      dataIndex: 'no',
      key: 'no',
      width: 50,
      align: 'center'
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      align: 'center',
      render: () => (
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-2">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              className="p-0 h-auto"
              onClick={() => navigate('/dashboard/services/pemeriksaan-utama/edit')}
            />
            <Button type="text" size="small" icon={<LockOutlined />} className="p-0 h-auto" />
            <Button type="text" size="small" icon={<HistoryOutlined />} className="p-0 h-auto" />
          </div>
        </div>
      )
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
      width: 150,
      render: (text: string) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold">{text.substring(0, 11)}</span>
          <span>{text.substring(12)}</span>
        </div>
      )
    },
    {
      title: (
        <div className="flex flex-col gap-2">
          <span>No. Kunjungan</span>
        </div>
      ),
      dataIndex: 'noKunjungan',
      key: 'noKunjungan',
      width: 150
    },
    {
      title: 'Antrean Poli',
      dataIndex: 'antreanPoli',
      key: 'antreanPoli',
      width: 100
    },
    {
      title: (
        <div className="flex flex-col gap-2">
          <span>No. BPJS</span>
        </div>
      ),
      dataIndex: 'noBpjs',
      key: 'noBpjs',
      width: 120
    },
    {
      title: (
        <div className="flex flex-col gap-2">
          <span>No. RM</span>
        </div>
      ),
      dataIndex: 'noRm',
      key: 'noRm',
      width: 120
    },
    {
      title: (
        <div className="flex flex-col gap-2">
          <span>Nama Pasien</span>
        </div>
      ),
      dataIndex: 'namaPasien',
      key: 'namaPasien',
      width: 200
    },
    {
      title: (
        <div className="flex flex-col gap-2">
          <span>Nama Dokter</span>
        </div>
      ),
      dataIndex: 'namaDokter',
      key: 'namaDokter',
      width: 150
    },
    {
      title: (
        <div className="flex flex-col gap-2">
          <span>Status</span>
        </div>
      ),
      dataIndex: 'status',
      key: 'status',
      width: 150
    },
    {
      title: (
        <div className="flex flex-col gap-2">
          <span>Status Satu Sehat</span>
        </div>
      ),
      dataIndex: 'statusSatuSehat',
      key: 'statusSatuSehat',
      width: 150
    }
  ]

  return (
    <div>
      <div className="mb-2 text-gray-500 text-sm">Menampilkan 1 - 10 data dari total 12 data.</div>
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
