import { Card, Button, Tag, Typography, Empty, Spin, Table, Space, Avatar, Modal } from 'antd'
import { EyeOutlined, UserOutlined, CalendarOutlined, CaretRightOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { useState } from 'react'

dayjs.locale('id')

const { Text } = Typography

interface EncounterTimelineProps {
  encounterId: string
  onViewDetail?: (time: string, data: any[]) => void
}

export const EncounterTimeline = ({ encounterId, onViewDetail }: EncounterTimelineProps) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailModalTitle, setDetailModalTitle] = useState('')
  const [detailItems, setDetailItems] = useState<any[]>([])

  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['encounter', encounterId, 'timeline'],
    queryFn: async () => {
      const fn = window.api?.query?.encounter?.getTimeline
      if (!fn) throw new Error('API timeline tidak tersedia')
      const res = await fn({ encounterId })

      if (!res.success || !res.result) {
        return []
      }

      return res.result
    }
  })

  const handleOpenDetail = (time: string, items: any[]) => {
    setDetailModalTitle(`Detail Pemeriksaan - ${time}`)
    setDetailItems(items)
    setIsDetailModalOpen(true)
    if (onViewDetail) {
      onViewDetail(time, items)
    }
  }

  if (isLoading)
    return (
      <Card className="mb-4  border-gray-200" size="small">
        <div className="p-8 text-center">
          <Spin tip="Memuat riwayat harian..." />
        </div>
      </Card>
    )

  if (!timelineData || timelineData.length === 0)
    return (
      <Card className="mb-4  border-gray-200" size="small">
        <Empty description="Belum ada riwayat pemeriksaan" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )

  const columns = [
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      width: 200,
      render: (text: string) => (
        <Space>
          <CalendarOutlined className="text-gray-400" />
          <Text strong>{dayjs(text).format('dddd, DD MMMM YYYY')}</Text>
        </Space>
      )
    },
    {
      title: 'Pemberi Layanan',
      key: 'performers',
      render: (record: any) => {
        const performers = new Set<string>()
        record.sessions?.forEach((session: any) => {
          if (session.performer) performers.add(session.performer)
        })
        return (
          <Space wrap size={4}>
            {Array.from(performers).map((doc, i) => (
              <Tag key={i} className="m-0 bg-gray-50 border-gray-200 text-gray-600 rounded-full px-3">
                {doc}
              </Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: 'Ringkasan',
      key: 'summary',
      width: 200,
      render: (record: any) => (
        <Tag color="cyan" className="rounded-full px-3 border-0">
          {record.sessions?.length || 0} Sesi Pemeriksaan
        </Tag>
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
          <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {text}
          </span>
        )
      },
      {
        title: 'Pemeriksa',
        key: 'performer',
        render: (session: any) => {
          const name = session.performer || 'Petugas Medis'
          return (
            <Space>
              <Avatar size="small" icon={<UserOutlined />} className="bg-slate-300" />
              <span className="text-gray-700 font-medium">{name}</span>
            </Space>
          )
        }
      },
      {
        title: '',
        key: 'action',
        width: 120,
        align: 'right' as const,
        render: (session: any) => (
          <Button
            type="link"
            size="small"
            className="text-blue-600 hover:text-blue-800"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetail(`${record.date} ${session.time}`, [...session.observations, ...session.compositions])}
          >
            Lihat Detail
          </Button>
        )
      }
    ]

    return (
      <div className="">
        <Table
          columns={sessionColumns}
          dataSource={record.sessions}
          pagination={false}
          size="small"
          rowKey="time"
          rowClassName="bg-white hover:bg-gray-50"
          bordered={false}
        />
      </div>
    )
  }

  const detailColumns = [
    {
      title: 'Pemeriksaan',
      dataIndex: 'display',
      key: 'display',
      render: (text: string, record: any) => text || record.codeCoding?.[0]?.display || '-'
    },
    {
      title: 'Hasil',
      key: 'value',
      render: (record: any) => {
        if (record.valueQuantity) {
          return `${record.valueQuantity.value} ${record.valueQuantity.unit || ''}`
        }
        if (record.valueInteger !== undefined) return record.valueInteger
        if (record.valueBoolean !== undefined) return record.valueBoolean ? 'Ya' : 'Tidak'
        return record.valueString || '-'
      }
    }
  ]

  return (
    <>
      <Card
        className="overflow-hidden mb-4"
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-600" />
            <span className="font-bold text-gray-700">Riwayat Harian Pemeriksaan</span>
          </div>
        }
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
            expandIcon: ({ expanded, onExpand, record }) => (
              <Button
                type="text"
                size="small"
                icon={<CaretRightOutlined rotate={expanded ? 90 : 0} />}
                onClick={(e) => onExpand(record, e)}
                className="text-gray-400 hover:text-blue-600"
              />
            ),
            columnTitle: ' '
          }}
        />
      </Card>

      <Modal
        title={detailModalTitle}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Tutup
          </Button>
        ]}
        width={600}
      >
        <Table
          dataSource={detailItems}
          columns={detailColumns}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </Modal>
    </>
  )
}

export default EncounterTimeline
