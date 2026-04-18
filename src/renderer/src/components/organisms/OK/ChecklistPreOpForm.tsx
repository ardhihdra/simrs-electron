import {
  Form,
  Card,
  Input,
  Button,
  Row,
  Col,
  Alert,
  FormInstance,
  Select,
  Radio,
  Tag
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'

interface StatusOption {
  label: string
  value: string
}

const YA_TIDAK_OPTIONS: StatusOption[] = [
  { label: 'Ya', value: 'ya' },
  { label: 'Tidak', value: 'tidak' }
]

interface ChecklistPreOpFormProps {
  standalone?: boolean
  externalForm?: FormInstance
  performerOptions?: Array<{ label: string; value: number }>
  isLoadingPerformers?: boolean
}

export const ChecklistPreOpForm = ({
  standalone = true,
  externalForm,
  performerOptions = [],
  isLoadingPerformers = false
}: ChecklistPreOpFormProps) => {
  const [internalForm] = Form.useForm()
  const form = externalForm || internalForm
  const getStatusTagColor = (value: string): string => {
    const normalized = String(value || '').trim().toLowerCase()
    if (normalized === 'ya') return 'green'
    if (normalized === 'tidak') return 'red'
    return 'default'
  }

  const renderStatusRadio = (options: StatusOption[] = YA_TIDAK_OPTIONS) => (
    <Radio.Group className="flex flex-wrap gap-4">
      {options.map((option) => (
        <Radio key={option.value} value={option.value} className="!m-0">
          <Tag color={getStatusTagColor(option.value)} className="!mr-0">
            {option.label}
          </Tag>
        </Radio>
      ))}
    </Radio.Group>
  )

  const content = (
    <div className="flex flex-col gap-4">
      <Card
        size="small"
        title={<span className="font-semibold text-gray-700">Checklist Pre-Operasi</span>}
        className="shadow-none border-gray-100"
      >
        <Row gutter={[16, 16]} className="py-2">
          <Col xs={24} md={12}>
            <Form.Item
              name="preopIdentitas"
              label="Identitas"
              rules={[{ required: true, message: 'Pilih status identitas' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="preopSuratIjinBedah"
              label="Surat Ijin Bedah"
              rules={[{ required: true, message: 'Pilih status surat ijin bedah' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="preopPersiapanDarah"
              label="Persiapan Darah"
              rules={[{ required: true, message: 'Pilih status persiapan darah' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="preopKeadaanUmumPasien"
              label="Keadaan Umum Pasien"
              rules={[{ required: true, message: 'Pilih kondisi umum pasien' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="preopSuratIjinAnestesi"
              label="Surat Ijin Anestesi"
              rules={[{ required: true, message: 'Pilih status surat ijin anestesi' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="preopPenandaAreaOperasi"
              label="Penanda Area Operasi"
              rules={[{ required: true, message: 'Pilih status penanda area operasi' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="preopSuratIjinTransfusi"
              label="Surat Ijin Transfusi"
              rules={[{ required: true, message: 'Pilih status surat ijin transfusi' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="preopPerlengkapanKhususImplan"
              label="Perlengkapan Khusus / Alat Implan"
              rules={[{ required: true, message: 'Pilih status perlengkapan khusus/implan' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title={<span className="font-semibold text-gray-700">Hasil Pemeriksaan Penunjang</span>}
        className="shadow-none border-gray-100"
      >
        <Row gutter={[16, 16]} className="py-2">
          <Col xs={24} md={12}>
            <Form.Item
              name="preopPenunjangRadiologi"
              label="Radiologi"
              rules={[{ required: true, message: 'Pilih status radiologi' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="preopPenunjangLsig"
              label="LSIG"
              rules={[{ required: true, message: 'Pilih status LSIG' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              name="preopPenunjangMri"
              label="MRI"
              rules={[{ required: true, message: 'Pilih status MRI' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="preopPenunjangEkg"
              label="EKG"
              rules={[{ required: true, message: 'Pilih status EKG' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="preopPenunjangCtScan"
              label="CT Scan"
              rules={[{ required: true, message: 'Pilih status CT Scan' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title={<span className="font-semibold text-gray-700">Petugas Pre-Op</span>}
        className="shadow-none border-gray-100"
      >
        <Row gutter={[16, 16]} className="py-2">
          <Col xs={24} md={12}>
            <Form.Item
              name="petugasRuanganId"
              label="Petugas Ruangan"
              rules={[{ required: true, message: 'Pilih petugas ruangan' }]}
            >
              <Select
                placeholder="Pilih petugas ruangan..."
                showSearch
                optionFilterProp="label"
                options={performerOptions}
                loading={isLoadingPerformers}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="petugasOkId"
              label="Petugas OK"
              rules={[{ required: true, message: 'Pilih petugas OK' }]}
            >
              <Select
                placeholder="Pilih petugas OK..."
                showSearch
                optionFilterProp="label"
                options={performerOptions}
                loading={isLoadingPerformers}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title={<span className="font-semibold text-gray-700">Catatan Klinis</span>}
        className="shadow-none border-gray-100"
      >
        <Row gutter={[16, 16]} className="py-2">
          <Col xs={24} md={12}>
            <Form.Item name="catatanDPJP" label="Catatan DPJP / Instruksi Khusus">
              <Input.TextArea rows={3} placeholder="Tuliskan catatan dari DPJP..." />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="catatanAnestesi" label="Catatan Anestesiologi">
              <Input.TextArea rows={3} placeholder="Catatan risiko dan rencana anestesi..." />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message="Lengkapi semua field wajib pre-op sebelum pasien masuk ruang operasi."
        className="mb-2"
      />

      {standalone ? (
        <Form form={form} layout="vertical">
          {content}
          <div className="flex justify-end gap-2 mt-6">
            <Button size="large">Reset</Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              style={{ background: '#3b82f6', border: 'none' }}
              htmlType="submit"
            >
              Simpan Checklist Pre-Op
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-2">{content}</div>
      )}
    </div>
  )
}
