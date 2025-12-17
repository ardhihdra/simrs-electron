import { Card, Space, Select, DatePicker, Button, Typography } from 'antd'
import { SearchOutlined, ReloadOutlined, UsergroupAddOutlined } from '@ant-design/icons'
import PemeriksaanAwalTable from './pemeriksaan-awal-table'

const { Title } = Typography
const { RangePicker } = DatePicker

const PemeriksaanAwal = () => {
  return (
    <div className="flex flex-col gap-4 h-full t-6 md:pt-8 pl-4 md:pl-6">
      <div className="flex justify-between items-center">
        <Title level={4} style={{ margin: 0 }}>
          Pemeriksaan Awal
        </Title>
      </div>

      <Card bodyStyle={{ padding: '16px' }}>
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <Space wrap>
            <Select
              placeholder="Pilih Poli"
              style={{ width: 200 }}
              options={[
                { value: 'umum', label: 'Poli Umum' },
                { value: 'gigi', label: 'Poli Gigi' },
                { value: 'anak', label: 'Poli Anak' }
              ]}
            />
            <RangePicker />
            <Button type="primary" icon={<SearchOutlined />}>
              Cari
            </Button>
            <Button icon={<ReloadOutlined />}>Refresh</Button>
          </Space>

          <Button
            type="primary"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            icon={<UsergroupAddOutlined />}
          >
            Antrian Poli
          </Button>
        </div>
      </Card>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <PemeriksaanAwalTable />
      </div>
    </div>
  )
}

export default PemeriksaanAwal
