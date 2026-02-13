import { SaveOutlined, CoffeeOutlined, HistoryOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Divider,
  Typography,
  Modal
} from 'antd'
import { useState } from 'react'
import {
  useCreateNutritionOrder,
  useNutritionOrderByEncounter
} from '../../hooks/query/use-nutrition-order'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Text } = Typography

export const NutritionOrderForm = ({
  encounterId,
  patientData
}: {
  encounterId: string
  patientData?: any
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const { data: nutritionOrders, isLoading } = useNutritionOrderByEncounter(encounterId)
  const createMutation = useCreateNutritionOrder()

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        encounterId,
        patientId: patientData?.patient?.id,
        dateTime: new Date(),
        status: 'active',
        oralDietTypes: values.dietType
          ? [
              {
                code: values.dietType,
                display: DIET_TYPES.find((d) => d.value === values.dietType)?.label
              }
            ]
          : [],
        oralDietNutrients:
          values.nutrients?.map((n: string) => ({
            code: n,
            display: NUTRIENTS.find((nu) => nu.value === n)?.label
          })) || [],
        oralDietTextures: values.texture
          ? [
              {
                code: values.texture,
                display: TEXTURES.find((t) => t.value === values.texture)?.label
              }
            ]
          : [],
        oralDietFluids: values.fluid
          ? [
              {
                code: values.fluid,
                display: FLUIDS.find((f) => f.value === values.fluid)?.label
              }
            ]
          : [],
        supplements: values.supplements
          ? [
              {
                productName: values.supplements,
                type: 'supplement'
              }
            ]
          : [],
        note: values.instruction ? [{ text: values.instruction }] : [],
        enteralFormula: values.enteralFormula
          ? {
              baseFormulaProductName: values.enteralFormula
            }
          : undefined
      }

      await createMutation.mutateAsync(payload)
      message.success('Order Diet berhasil disimpan')
      form.resetFields()
    } catch (error) {
      console.error(error)
      message.error('Gagal menyimpan order diet')
    }
  }

  const DIET_TYPES = [
    { value: 'diet-biasa', label: 'Diet Biasa (Nasi)' },
    { value: 'diet-lunak', label: 'Diet Lunak (Nasi Tim)' },
    { value: 'diet-bubur-kasar', label: 'Bubur Kasar' },
    { value: 'diet-bubur-saring', label: 'Bubur Saring/Halus' },
    { value: 'diet-cair-penuh', label: 'Diet Cair Penuh' },
    { value: 'diet-cair-jernih', label: 'Diet Cair Jernih' },
    { value: 'puasa', label: 'Puasa (NPO)' }
  ]

  const NUTRIENTS = [
    { value: 'rg', label: 'Rendah Garam (RG)' },
    { value: 'rl', label: 'Rendah Lemak (RL)' },
    { value: 'rp', label: 'Rendah Protein (RP)' },
    { value: 'tp', label: 'Tinggi Protein (TP)' },
    { value: 'dm', label: 'Diabetes Melitus (DM)' },
    { value: 'dh', label: 'Diet Hati (DH)' },
    { value: 'dj', label: 'Diet Jantung (DJ)' },
    { value: 'rp-ginjal', label: 'Rendah Protein Ginjal' }
  ]

  const TEXTURES = [
    { value: 'normal', label: 'Normal' },
    { value: 'soft', label: 'Lunak' },
    { value: 'minced', label: 'Cincang (Minced)' },
    { value: 'pureed', label: 'Halus (Pureed)' }
  ]

  const FLUIDS = [
    { value: 'minuman-biasa', label: 'Cair Biasa (Thin)' },
    { value: 'nektar', label: 'Kental Nektar (Nectar-thick)' },
    { value: 'madu', label: 'Kental Madu (Honey-thick)' },
    { value: 'puding', label: 'Kental Puding (Spoon-thick)' }
  ]

  const columns = [
    {
      title: 'Waktu Order',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Jenis Diet',
      key: 'diet',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          {record.oralDietTypes?.map((t: any) => (
            <Tag color="blue" key={t.id}>
              {t.display}
            </Tag>
          ))}
          {record.oralDietNutrients?.map((n: any) => (
            <Tag color="orange" key={n.id}>
              {n.display}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Tekstur & Cairan',
      key: 'texture',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          {record.oralDietTextures?.map((t: any) => (
            <Text type="secondary" key={t.id}>
              Tekstur: {t.display}
            </Text>
          ))}
          {record.oralDietFluids?.map((f: any) => (
            <Text type="secondary" key={f.id}>
              Cairan: {f.display}
            </Text>
          ))}
        </Space>
      )
    },
    {
      title: 'Tambahan',
      key: 'extra',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          {record.enteralFormula && (
            <Tag color="purple">NGT: {record.enteralFormula.baseFormulaProductName}</Tag>
          )}
          {record.supplements?.map((s: any) => (
            <Tag color="cyan" key={s.id}>
              {s.productName}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Catatan',
      dataIndex: 'note',
      key: 'note',
      render: (notes: any[]) => notes?.map((n) => n.text).join('; ')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : 'default'}>{s.toUpperCase()}</Tag>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card
          title={
            <Space>
              <CoffeeOutlined />
              <span>Formulir Permintaan Diet & Nutrisi (Nutrition Order)</span>
            </Space>
          }
          extra={
            <Button icon={<HistoryOutlined />} onClick={() => setIsHistoryModalOpen(true)}>
              Lihat Riwayat ({nutritionOrders?.result?.length || 0})
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Bentuk Makanan (Jenis Diet)"
                name="dietType"
                rules={[{ required: true, message: 'Pilih jenis diet' }]}
              >
                <Select options={DIET_TYPES} placeholder="Pilih bentuk makanan..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kebutuhan Nutrisi Khusus" name="nutrients">
                <Select
                  mode="multiple"
                  options={NUTRIENTS}
                  placeholder="Pilih jika ada (bisa lebih dari satu)..."
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item label="Konsistensi/Tekstur Makanan" name="texture">
                <Select options={TEXTURES} placeholder="Pilih tekstur..." allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Konsistensi Cairan" name="fluid">
                <Select options={FLUIDS} placeholder="Pilih konsistensi cairan..." allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Nutrisi Enteral & Suplemen</Divider>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Formula Enteral (Via NGT/OGT)"
                name="enteralFormula"
                tooltip="Diisi jika pasien menggunakan selang makan"
              >
                <Input placeholder="Contoh: Peptisol 200cc / 6 jam" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Suplemen Tambahan" name="supplements" tooltip="Puding, Susu, Snack">
                <Input placeholder="Contoh: Ekstra Putih Telur, Susu High Protein" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Instruksi Khusus / Catatan Dietisien" name="instruction">
            <TextArea
              rows={3}
              placeholder="Contoh: Pasien alergi udang, mohon makanan disajikan hangat."
            />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createMutation.isPending}
              size="large"
            >
              Kirim Order Diet
            </Button>
          </div>
        </Card>
      </Form>

      <Modal
        title="Riwayat Order Diet"
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsHistoryModalOpen(false)}>
            Tutup
          </Button>
        ]}
        width={1000}
      >
        <Table
          dataSource={nutritionOrders?.result || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 1000 }}
        />
      </Modal>
    </div>
  )
}
