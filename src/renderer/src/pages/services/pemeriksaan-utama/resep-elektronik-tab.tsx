import { Table, Button, Input, Checkbox, Select, InputNumber } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SyncOutlined } from '@ant-design/icons'

interface DataType {
  key: string
  no: number
  kode: string
  kodeKfa: string
  kodeObatBpjs: string
  namaObat: string
  jumlah: number
  jumlahDiambil: number
  jadikanDeposit: boolean
  satuan: string
  etiket: string
  gudang: string
}

const data: DataType[] = [
  {
    key: '1',
    no: 1,
    kode: 'OBT2104230015',
    kodeKfa: '',
    kodeObatBpjs: '',
    namaObat: 'CEFADROXIL 500 MG MEPRO',
    jumlah: 10,
    jumlahDiambil: 0,
    jadikanDeposit: false,
    satuan: 'Kapsul',
    etiket: '',
    gudang: 'GUDANG UTAMA'
  },
  {
    key: '2',
    no: 2,
    kode: 'OBT2104180014',
    kodeKfa: '',
    kodeObatBpjs: '',
    namaObat: 'BUFACARYL',
    jumlah: 10,
    jumlahDiambil: 0,
    jadikanDeposit: false,
    satuan: 'Kaplet',
    etiket: '',
    gudang: 'GUDANG UTAMA'
  },
  {
    key: '3',
    no: 3,
    kode: 'OBT2104190025',
    kodeKfa: '',
    kodeObatBpjs: '',
    namaObat: 'OBH ITRASAL',
    jumlah: 1,
    jumlahDiambil: 0,
    jadikanDeposit: false,
    satuan: 'SYRUP',
    etiket: '',
    gudang: 'GUDANG UTAMA'
  }
]

export const ResepElektronikTab = () => {
  const columns: ColumnsType<DataType> = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 50,
      align: 'center'
    },
    { title: 'Kode', dataIndex: 'kode', key: 'kode' },
    {
      title: 'Kode KFA',
      key: 'kodeKfa',
      render: () => (
        <Button
          type="primary"
          size="small"
          icon={<SyncOutlined />}
          className="bg-orange-400 hover:bg-orange-500 border-orange-400 text-xs"
        >
          Sinkronisasi data KFA
        </Button>
      )
    },
    { title: 'Kode Obat BPJS', dataIndex: 'kodeObatBpjs', key: 'kodeObatBpjs' },
    { title: 'Nama Obat', dataIndex: 'namaObat', key: 'namaObat' },
    {
      title: 'Jumlah',
      dataIndex: 'jumlah',
      key: 'jumlah',
      render: (val) => <InputNumber size="small" defaultValue={val} precision={2} />
    },
    {
      title: 'Jumlah Diambil',
      dataIndex: 'jumlahDiambil',
      key: 'jumlahDiambil',
      render: (val) => <InputNumber size="small" defaultValue={val} precision={2} />
    },
    {
      title: 'Jadikan Deposit',
      dataIndex: 'jadikanDeposit',
      key: 'jadikanDeposit',
      align: 'center',
      render: (val) => <Checkbox defaultChecked={val} />
    },
    {
      title: 'Satuan',
      dataIndex: 'satuan',
      key: 'satuan',
      render: (val) => (
        <Select size="small" defaultValue={val} style={{ width: 100 }}>
          <Select.Option value="Kapsul">Kapsul</Select.Option>
          <Select.Option value="Kaplet">Kaplet</Select.Option>
          <Select.Option value="SYRUP">SYRUP</Select.Option>
        </Select>
      )
    },
    {
      title: 'Etiket/Aturan Pakai',
      dataIndex: 'etiket',
      key: 'etiket',
      width: 250,
      render: () => (
        <div className="flex gap-1">
          <Input size="small" />
          <Button type="primary" size="small" className="bg-cyan-500 border-cyan-500">
            Pilih
          </Button>
        </div>
      )
    },
    { title: 'Gudang', dataIndex: 'gudang', key: 'gudang' }
  ]

  return (
    <div className="p-4">
      <Table columns={columns} dataSource={data} pagination={false} size="small" bordered />
    </div>
  )
}
