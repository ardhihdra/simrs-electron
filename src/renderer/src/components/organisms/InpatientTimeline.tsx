import { Card, Button, Tag, Typography, Empty, Spin, Table, Space } from 'antd'
import { EyeOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

const { Text, Title } = Typography

interface InpatientTimelineProps {
  encounterId: string
  onViewDetail?: (time: string, data: any) => void
}

export const InpatientTimeline = ({ encounterId, onViewDetail }: InpatientTimelineProps) => {
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['observations', encounterId, 'timeline'],
    queryFn: async () => {
      const fn = window.api?.query?.observation?.getByEncounter
      if (!fn) throw new Error('API observation tidak tersedia')
      const res = await fn({ encounterId })

      let allObs: any[] = []
      if (res.result && !Array.isArray(res.result) && Array.isArray(res.result.all)) {
        allObs = res.result.all
      } else {
        allObs = Array.isArray(res.result) ? res.result : []
      }

      const dateGroups: Record<
        string,
        { date: string; items: any[]; doctors: Set<string>; sessions: Record<string, any[]> }
      > = {}
      allObs.forEach((obs) => {
        const dateKey = dayjs(obs.createdAt).format('YYYY-MM-DD')
        const timeKey = dayjs(obs.createdAt).format('HH:mm')

        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = {
            date: dateKey,
            items: [],
            doctors: new Set(),
            sessions: {}
          }
        }

        if (!dateGroups[dateKey].sessions[timeKey]) {
          dateGroups[dateKey].sessions[timeKey] = []
        }

        dateGroups[dateKey].items.push(obs)
        dateGroups[dateKey].sessions[timeKey].push(obs)
        const doc = obs.performers?.[0]?.display || 'Petugas Medis'
        dateGroups[dateKey].doctors.add(doc)
      })

      return Object.values(dateGroups)
        .map((day) => ({
          ...day,
          sessionList: Object.entries(day.sessions)
            .map(([time, items]) => ({ time, items }))
            .sort((a, b) => b.time.localeCompare(a.time))
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
    }
  })

  if (isLoading)
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-gray-100 mb-4 shadow-sm">
        <Spin tip="Memuat riwayat harian..." />
      </div>
    )

  if (!timelineData || timelineData.length === 0)
    return (
      <Card className="mb-4 shadow-sm border-gray-100">
        <Empty description="Belum ada riwayat pemeriksaan" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )

  const columns = [
    {
      title: 'Tanggal Pemeriksaan',
      dataIndex: 'date',
      key: 'date',
      width: 250,
      render: (text: string) => (
        <Space>
          <CalendarOutlined className="text-blue-500" />
          <Text strong>{dayjs(text).format('DD MMMM YYYY')}</Text>
        </Space>
      )
    },
    {
      title: 'Pemberi Layanan',
      dataIndex: 'doctors',
      key: 'doctors',
      render: (doctors: Set<string>) => (
        <Space wrap size={4}>
          {Array.from(doctors).map((doc, i) => (
            <Tag
              key={i}
              icon={<UserOutlined />}
              className="m-0 bg-blue-50/50 border-blue-100 text-blue-700"
            >
              {doc}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Ket.',
      key: 'summary',
      render: (record: any) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {record.sessionList.length} kali pemeriksaan
        </Text>
      )
    }
  ]

  const expandedRowRender = (record: any) => {
    const sessionColumns = [
      {
        title: 'Jam',
        dataIndex: 'time',
        key: 'time',
        width: 100,
        render: (text: string) => (
          <Text strong className="text-blue-600">
            {text} WIB
          </Text>
        )
      },
      {
        title: 'Pemeriksa',
        key: 'performer',
        render: (item: any) => item.items[0]?.performers?.[0]?.display || 'Petugas Medis'
      },
      {
        title: 'Aksi',
        key: 'action',
        width: 120,
        align: 'center' as const,
        render: (item: any) => (
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail?.(`${record.date} ${item.time}`, item.items)}
          >
            Lihat SOAP
          </Button>
        )
      }
    ]

    return (
      <div className="bg-blue-50/20 p-4 rounded-lg border border-blue-100 shadow-inner">
        <Table
          columns={sessionColumns}
          dataSource={record.sessionList}
          pagination={false}
          size="small"
          rowKey="time"
          rowClassName="bg-white"
        />
      </div>
    )
  }

  return (
    <Card
      className="shadow-sm border-blue-100 rounded-lg overflow-hidden mb-4"
      title={
        <Title level={5} className="m-0 text-blue-700 font-bold">
          Riwayat CPPT (Ringkasan Harian)
        </Title>
      }
      bodyStyle={{ padding: 0 }}
    >
      <Table
        dataSource={timelineData}
        columns={columns}
        pagination={false}
        size="middle"
        rowKey="date"
        expandable={{
          expandedRowRender,
          defaultExpandAllRows: false,
          columnTitle: 'Detail'
        }}
        rowClassName="hover:bg-blue-50/10 transition-colors"
      />
    </Card>
  )
}

export default InpatientTimeline
