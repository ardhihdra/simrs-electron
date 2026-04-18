import {
  Form,
  Card,
  Input,
  Radio,
  Select,
  Button,
  Row,
  Col,
  Tag,
  Alert,
  FormInstance
} from 'antd'

interface WHOFormProps {
  standalone?: boolean
  externalForm?: FormInstance
  performerOptions?: Array<{ label: string; value: number }>
  isLoadingPerformers?: boolean
}

interface StatusOption {
  label: string
  value: string
}

const YA_TIDAK_OPTIONS: StatusOption[] = [
  { label: 'Ya', value: 'ya' },
  { label: 'Tidak', value: 'tidak' }
]

export const SignInForm = ({
  standalone = true,
  externalForm,
  performerOptions,
  isLoadingPerformers = false
}: WHOFormProps) => {
  const [internalForm] = Form.useForm()
  const form = externalForm || internalForm
  const requirePerawatSelection = Array.isArray(performerOptions)
  const nurseOptions = performerOptions || []
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
      <Card size="small" title="1. Sign In">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="identitas"
              label="Identitas"
              rules={[{ required: true, message: 'Pilih status identitas' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="risikoKehilanganDarahAnak"
              label="Risiko Kehilangan Darah untuk Anak"
              rules={[{ required: true, message: 'Pilih status risiko kehilangan darah' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="alergi"
              label="Alergi"
              rules={[{ required: true, message: 'Isi informasi alergi pasien' }]}
            >
              <Input.TextArea rows={2} placeholder="Tuliskan alergi pasien..." />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="risikoAspirasiDanFaktorPenyulit"
              label="Risiko Aspirasi & Faktor Penyulit"
              rules={[{ required: true, message: 'Isi risiko aspirasi dan faktor penyulit' }]}
            >
              <Input.TextArea rows={2} placeholder="Tuliskan risiko aspirasi/faktor penyulit..." />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="kesiapanAlatObatAnestesi"
              label="Kesiapan & Alat Obat Anestesi"
              rules={[{ required: true, message: 'Pilih status kesiapan alat/obat anestesi' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="penandaanAreaOperasi"
              label="Penandaan Area Operasi"
              rules={[{ required: true, message: 'Pilih status penandaan area operasi' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="jalurIvLine"
              label="Jika Ada Jalur IV Line"
              rules={[{ required: true, message: 'Pilih status jalur IV line' }]}
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="perawatKamarOperasiId"
              label="Perawat Kamar Operasi"
              rules={
                requirePerawatSelection
                  ? [{ required: true, message: 'Pilih perawat kamar operasi' }]
                  : []
              }
            >
              <Select
                placeholder="Pilih perawat..."
                showSearch
                optionFilterProp="label"
                options={nurseOptions}
                loading={isLoadingPerformers}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="rencanaAntisipasiKehilanganDarah"
              label="Jika Ada Risiko Kehilangan Darah, Rencana Antisipasi"
              dependencies={['risikoKehilanganDarahAnak']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const risiko = getFieldValue('risikoKehilanganDarahAnak')
                    if (risiko !== 'ya') return Promise.resolve()
                    if (String(value || '').trim().length > 0) return Promise.resolve()
                    return Promise.reject(
                      new Error('Rencana antisipasi kehilangan darah wajib diisi saat risiko = Ya')
                    )
                  }
                })
              ]}
            >
              <Input.TextArea rows={2} placeholder="Tuliskan rencana antisipasi..." />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item
              name="rencanaAntisipasiAnestesi"
              label="Bila Tidak Lengkap, Rencana Antisipasi"
              dependencies={['kesiapanAlatObatAnestesi']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const kesiapan = getFieldValue('kesiapanAlatObatAnestesi')
                    if (kesiapan !== 'tidak') return Promise.resolve()
                    if (String(value || '').trim().length > 0) return Promise.resolve()
                    return Promise.reject(
                      new Error('Rencana antisipasi anestesi wajib diisi saat kesiapan = Tidak')
                    )
                  }
                })
              ]}
            >
              <Input.TextArea rows={2} placeholder="Tuliskan rencana antisipasi..." />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      <Alert
        type="warning"
        showIcon
        message="Sign-In dilakukan sebelum induksi anestesi dimulai. Lengkapi seluruh item wajib sebelum lanjut."
      />
      {standalone ? (
        <Form form={form} layout="vertical">
          {content}
          <div className="flex justify-end gap-2 mt-4">
            <Button>Reset</Button>
            <Button type="primary" size="large" style={{ background: '#3b82f6', border: 'none' }}>
              Konfirmasi Sign-In
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-2">{content}</div>
      )}
    </div>
  )
}

export const TimeOutForm = ({ standalone = true, externalForm }: WHOFormProps) => {
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
      <Card size="small" title="Verifikasi Tim Operasi">
        <Form.Item
          name="timKonfirmasi"
          label="Seluruh anggota tim telah memperkenalkan diri (nama & peran)?"
        >
          {renderStatusRadio()}
        </Form.Item>
      </Card>
      <Card size="small" title="Konfirmasi Identitas & Prosedur">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="konfirmasiNama" label="Nama pasien dikonfirmasi ulang?">
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="konfirmasiProsedurFinal"
              label="Prosedur yang akan dilakukan didkonfirmasi?"
            >
              {renderStatusRadio()}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="konfirmasiSisi"
              label="Sisi/lokasi operasi dikonfirmasi dengan site mark?"
            >
              {renderStatusRadio([
                { label: 'Ya', value: 'ya' },
                { label: 'Tidak', value: 'tidak' },
                { label: 'Tidak berlaku', value: 'na' }
              ])}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="antibiotikProfilaksis"
              label="Antibiotik profilaksis sudah diberikan (60 menit sebelum insisi)?"
            >
              {renderStatusRadio([
                { label: 'Ya', value: 'ya' },
                { label: 'Tidak perlu', value: 'tidak' }
              ])}
            </Form.Item>
          </Col>
        </Row>
      </Card>
      <Card size="small" title="Kesiapan Peralatan & Antisipasi">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="imagingTersedia"
              label="Imaging essensial tersedia dan sudah ditampilkan?"
            >
              {renderStatusRadio([
                { label: 'Ya', value: 'ya' },
                { label: 'Tidak', value: 'tidak' },
                { label: 'Tidak diperlukan', value: 'na' }
              ])}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="catatanKritis"
              label="Apakah ada point kritis / kekhawatiran dari anggota tim?"
            >
              {renderStatusRadio([
                { label: 'Tidak ada', value: 'tidak' },
                { label: 'Ya (catatan di bawah)', value: 'ya' }
              ])}
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="catatanTimeOut" label="Catatan / Kekhawatiran Tim">
              <Input.TextArea rows={2} placeholder="Catatan dari dokter/perawat/anestesi..." />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      <Alert
        type="warning"
        showIcon
        message="Time-Out dilakukan tepat sebelum insisi pertama. Seluruh anggota tim harus menghentikan aktivitas dan berpartisipasi aktif."
      />
      {standalone ? (
        <Form form={form} layout="vertical">
          {content}
          <div className="flex justify-end gap-2 mt-4">
            <Button>Reset</Button>
            <Button type="primary" size="large" style={{ background: '#3b82f6', border: 'none' }}>
              Konfirmasi Time-Out — Izinkan Insisi
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-2">{content}</div>
      )}
    </div>
  )
}
