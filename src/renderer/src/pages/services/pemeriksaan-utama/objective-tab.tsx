import { Form, Input, Row, Col, Typography, Button, Divider } from 'antd'

const { Title } = Typography

export const ObjectiveTab = () => {
  const [form] = Form.useForm()

  return (
    <div className="p-4">
      <Title level={4} className="mb-6">
        Asuhan Keperawatan
      </Title>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        labelAlign="left"
        className="max-w-5xl"
      >
        <h4 className="font-bold mb-4">Keadaan Umum</h4>

        <Form.Item label="Nadi" name="nadi">
          <Input />
        </Form.Item>
        <Form.Item label="Suhu" name="suhu">
          <Input />
        </Form.Item>
        <Form.Item label="Pernafasan" name="pernafasan">
          <Input />
        </Form.Item>

        <Form.Item label="Tek. Darah">
          <div className="flex items-center gap-2">
            <Form.Item name="sistole" noStyle>
              <Input addonBefore="Sistole" style={{ width: 150 }} />
            </Form.Item>
            <span className="font-bold">/</span>
            <Form.Item name="diastole" noStyle>
              <Input addonBefore="Diastole" style={{ width: 150 }} />
            </Form.Item>
          </div>
        </Form.Item>

        <Form.Item label="Tinggi Badan" name="tinggiBadan">
          <Input addonAfter="CM" />
        </Form.Item>
        <Form.Item label="Berat Badan" name="beratBadan">
          <Input addonAfter="KG" />
        </Form.Item>
        <Form.Item label="Lingkar Perut" name="lingkarPerut">
          <Input addonAfter="CM" />
        </Form.Item>

        <h4 className="font-bold mb-4 mt-6">Kepala</h4>

        <Form.Item label="Rambut" name="rambut">
          <Input />
        </Form.Item>

        {/* Mata Subsection */}
        <Row className="mb-0">
          <Col span={4}>
            <div className="ant-form-item-label text-left">
              <label>Mata</label>
            </div>
          </Col>
          <Col span={20}>
            <Form.Item label="Pupil" name="pupil" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
              <Input />
            </Form.Item>
            <Form.Item
              label="Sclera : Icteric"
              name="sclera"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* Telinga Subsection */}
        <Row className="mt-0">
          <Col span={4}>
            <div className="ant-form-item-label text-left">
              <label>Telinga</label>
            </div>
          </Col>
          <Col span={20}>
            <Form.Item
              label="Membrane Thymp"
              name="membraneThymp"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Cerumen Plug"
              name="cerumenPlug"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <h4 className="font-bold mb-4 mt-6">Ekstremitas</h4>
        <Row className="mb-0">
          <Col span={4}>
            <div className="ant-form-item-label text-left">
              <label>Atas</label>
            </div>
          </Col>
          <Col span={20}>
            <Form.Item
              label="Kelainan"
              name="ekstremitasAtasKelainan"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Kebersihan Kuku"
              name="ekstremitasAtasKebersihanKuku"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Refleks Fisiologis"
              name="ekstremitasAtasRefleksFisiologis"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Refleks Patologis"
              name="ekstremitasAtasRefleksPatologis"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {/* Bawah Subsection */}
        <Row className="mt-0">
          <Col span={4}>
            <div className="ant-form-item-label text-left">
              <label>Bawah</label>
            </div>
          </Col>
          <Col span={20}>
            <Form.Item
              label="Kelainan"
              name="ekstremitasBawahKelainan"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Kebersihan Kuku"
              name="ekstremitasBawahKebersihanKuku"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Refleks Fisiologis"
              name="ekstremitasBawahRefleksFisiologis"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Refleks Patologis"
              name="ekstremitasBawahRefleksPatologis"
              labelCol={{ span: 4 }}
              wrapperCol={{ span: 20 }}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Divider />
      <div className="flex justify-end">
        <Button type="primary">Simpan</Button>
      </div>
    </div>
  )
}
