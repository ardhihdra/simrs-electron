import { Select, DatePicker, Button, Typography } from 'antd'
import { SearchOutlined, ReloadOutlined, SoundOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PemeriksaanUtamaTable from './table'

const { Title } = Typography

export default function PemeriksaanUtamaPage() {
  return (
    <div>
      <div className="flex justify-center mb-6">
        <Title level={2} style={{ marginTop: 0 }}>
          Pemeriksaan Utama
        </Title>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center">
          <div className="w-32 font-semibold text-gray-700">Pilihan Poli</div>
          <Select
            defaultValue="POLI UMUM/RAWAT JALAN"
            className="w-80"
            options={[{ label: 'POLI UMUM/RAWAT JALAN', value: 'POLI UMUM/RAWAT JALAN' }]}
          />
        </div>

        <div className="flex items-center">
          <div className="w-32 font-semibold text-gray-700">Pilihan Periode</div>
          <div className="flex gap-2">
            <Select
              defaultValue="Berdasarkan Tanggal"
              className="w-48"
              options={[{ label: 'Berdasarkan Tanggal', value: 'Berdasarkan Tanggal' }]}
            />
            <DatePicker defaultValue={dayjs()} format="DD MMM YYYY" allowClear={false} />
            <DatePicker defaultValue={dayjs()} format="DD MMM YYYY" allowClear={false} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button type="primary" icon={<SearchOutlined />}>
          Cari
        </Button>
        <Button icon={<ReloadOutlined />}>Refresh</Button>
        <Button type="primary" icon={<SoundOutlined />}>
          Antrean Poli
        </Button>
        <Button type="primary" icon={<SyncOutlined />}>
          Integrasi Satu Sehat
        </Button>
      </div>

      <PemeriksaanUtamaTable />
    </div>
  )
}
