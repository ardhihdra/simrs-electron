import {
  Modal,
  Tabs,
  Descriptions,
  Tag,
  Divider,
  Empty,
  Typography,
  List,
  Space,
  Button
} from 'antd'
import {
  FileSearchOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

interface AssessmentDetailModalProps {
  visible: boolean
  onClose: () => void
  data: {
    time: string
    items: any[]
  } | null
}

export const AssessmentDetailModal = ({ visible, onClose, data }: AssessmentDetailModalProps) => {
  if (!data) return null

  // Group items by category to display in tabs
  const physicalExams = data.items.filter((item) =>
    item.categories?.some((cat: any) => cat.code === 'exam')
  )

  const vitalSigns = data.items.filter((item) =>
    item.categories?.some((cat: any) => cat.code === 'vital-signs')
  )

  const items = [
    {
      key: '1',
      label: (
        <span>
          <InfoCircleOutlined />
          Ringkasan (SOAP)
        </span>
      ),
      children: (
        <div className="py-4">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Subjektif/Objektif">
              {data.items.find((i: any) => i.valueString)?.valueString || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Interpretasi">
              {data.items.map((it: any) =>
                it.interpretations?.map((int: any) => (
                  <Tag color={int.code === 'A' ? 'red' : 'green'} key={int.code}>
                    {int.display}
                  </Tag>
                ))
              )}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <UserOutlined />
          Pemeriksaan Fisik
        </span>
      ),
      children: (
        <div className="py-4">
          {physicalExams.length > 0 ? (
            <List
              dataSource={physicalExams}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Text strong>
                        {item.display?.replace('Physical findings of ', '').split(' Narrative')[0]}
                      </Text>
                    }
                    description={item.valueString}
                  />
                  <Tag color={item.valueBoolean === false ? 'red' : 'green'}>
                    {item.valueBoolean === false ? 'Abnormal' : 'Normal'}
                  </Tag>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Tidak ada data pemeriksaan fisik" />
          )}
        </div>
      )
    },
    {
      key: '3',
      label: (
        <span>
          <MedicineBoxOutlined />
          Vitals & Terapi
        </span>
      ),
      children: (
        <div className="py-4">
          <Title level={5}>Tanda Vital</Title>
          <Descriptions column={2} size="small">
            {vitalSigns.map((vs: any, idx: number) => (
              <Descriptions.Item label={vs.display} key={idx}>
                {vs.valueQuantity?.value} {vs.valueQuantity?.unit}
              </Descriptions.Item>
            ))}
          </Descriptions>
          <Divider />
          <Text type="secondary">
            Data e-resep dan tindakan lain akan muncul di sini (Under Development)
          </Text>
        </div>
      )
    }
  ]

  return (
    <Modal
      title={
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '18px' }}>
            Detail Pemeriksaan Klinis
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(data.time).format('DD MMMM YYYY, HH:mm')}
          </Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Tutup
        </Button>,
        <Button key="print" icon={<FileSearchOutlined />}>
          Cetak PDF
        </Button>
      ]}
      width={800}
      bodyStyle={{ padding: '0 24px 24px 24px' }}
    >
      <Tabs defaultActiveKey="1" items={items} />
    </Modal>
  )
}

const { Title } = Typography

export default AssessmentDetailModal
