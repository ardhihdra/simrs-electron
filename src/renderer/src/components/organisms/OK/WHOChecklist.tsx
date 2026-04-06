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
  Divider,
  Typography,
  FormInstance
} from 'antd'

const { Text } = Typography

interface WHOFormProps {
  standalone?: boolean
  externalForm?: FormInstance
}

export const SignInForm = ({ standalone = true, externalForm }: WHOFormProps) => {
  const [internalForm] = Form.useForm()
  const form = externalForm || internalForm

  const content = (
    <div className="flex flex-col gap-4">
      <Card size="small" title="1. Konfirmasi Identitas Pasien">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="konfirmasiIdentitas"
              label="Pasien telah mengkonfirmasi identitas?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak / Tidak dapat dikonfirmasi</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="konfirmasiProsedur"
              label="Prosedur & area operasi sudah dikonfirmasi?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="konfirmasiConsent"
              label="Informed consent sudah ditandatangani?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="sitemarking"
              label="Site marking sudah dibuat?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
                <Radio value="na">
                  <Tag>Tidak berlaku</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card size="small" title="2. Kesiapan Anestesi">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="mesinAnestesi"
              label="Mesin anestesi dan obat sudah diperiksa?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="pulseOximetry"
              label="Pulse oximetry terpasang dan berfungsi?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="alergiDiketahui"
              label="Apakah pasien memiliki alergi?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="tidak">Tidak ada alergi yang diketahui</Radio>
                <Radio value="ya">Ya, ada alergi:</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="detailAlergi" label="Detail alergi (jika ada)">
              <Input placeholder="Sebutkan jenis alergi..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="risikoAspirasi"
              label="Apakah ada risiko aspirasi?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="tidak">
                  <Tag color="green">Tidak</Tag>
                </Radio>
                <Radio value="ya_persiapan">
                  <Tag color="orange">Ya — peralatan sudah disiapkan</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="risikoPerdarahan"
              label="Perkiraan kehilangan darah > 500ml?"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value="tidak">
                  <Tag color="green">Tidak</Tag>
                </Radio>
                <Radio value="ya_dua_iv">
                  <Tag color="orange">Ya — 2 IV line + cairan disiapkan</Tag>
                </Radio>
              </Radio.Group>
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
        message="Sign-In dilakukan sebelum induksi anestesi dimulai. Seluruh item WAJIB dikonfirmasi oleh tim."
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

  const content = (
    <div className="flex flex-col gap-4">
      <Card size="small" title="Verifikasi Tim Operasi">
        <Form.Item
          name="timKonfirmasi"
          label="Seluruh anggota tim telah memperkenalkan diri (nama & peran)?"
        >
          <Radio.Group>
            <Radio value="ya">
              <Tag color="green">Ya</Tag>
            </Radio>
            <Radio value="tidak">
              <Tag color="red">Tidak</Tag>
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Card>
      <Card size="small" title="Konfirmasi Identitas & Prosedur">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="konfirmasiNama" label="Nama pasien dikonfirmasi ulang?">
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="konfirmasiProsedurFinal"
              label="Prosedur yang akan dilakukan didkonfirmasi?"
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="konfirmasiSisi"
              label="Sisi/lokasi operasi dikonfirmasi dengan site mark?"
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
                <Radio value="na">
                  <Tag>Tidak berlaku</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="antibiotikProfilaksis"
              label="Antibiotik profilaksis sudah diberikan (60 menit sebelum insisi)?"
            >
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak perlu</Tag>
                </Radio>
              </Radio.Group>
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
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
                <Radio value="na">
                  <Tag>Tidak diperlukan</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="catatanKritis"
              label="Apakah ada point kritis / kekhawatiran dari anggota tim?"
            >
              <Radio.Group>
                <Radio value="tidak">Tidak ada</Radio>
                <Radio value="ya">Ya (catatan di bawah)</Radio>
              </Radio.Group>
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

export const SignOutForm = ({ standalone = true, externalForm }: WHOFormProps) => {
  const [internalForm] = Form.useForm()
  const form = externalForm || internalForm

  const content = (
    <div className="space-y-4">
      <Card size="small" title="Verifikasi Instrumen & Material">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="hitungInstrumen" label="Hitungan instrumen lengkap?">
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya, lengkap</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak — lapor segera</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="hitungKasa" label="Hitungan kasa lengkap?">
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya, lengkap</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="hitungJarum" label="Hitungan jarum/benda tajam lengkap?">
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya, lengkap</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="spesimenDilabeli" label="Spesimen sudah dilabeli dengan benar?">
              <Radio.Group>
                <Radio value="ya">
                  <Tag color="green">Ya</Tag>
                </Radio>
                <Radio value="tidak">
                  <Tag color="red">Tidak</Tag>
                </Radio>
                <Radio value="na">
                  <Tag>Tidak ada spesimen</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="masalahPeralatan" label="Ada masalah peralatan yang perlu dilaporkan?">
              <Radio.Group>
                <Radio value="tidak">Tidak ada</Radio>
                <Radio value="ya">Ya (catat di bawah)</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="catatanSignOut" label="Catatan Tambahan">
              <Input.TextArea rows={2} placeholder="Catatan insiden, masalah peralatan, dll..." />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card size="small" title="Input Tim Operasi">
        <Divider orientation="left" orientationMargin={0}>
          <Text type="secondary" className="text-xs">
            Dokter Operator
          </Text>
        </Divider>
        <Row gutter={8} className="mb-2">
          {['dokterOperator1', 'dokterOperator2'].map((field, i) => (
            <Col xs={24} md={12} key={field}>
              <Form.Item name={field} label={`Dokter Operator ${i + 1}`}>
                <Select
                  placeholder="Pilih dokter operator..."
                  showSearch
                  allowClear
                  options={[
                    { label: 'dr. Ahmad Fadillah, Sp.B', value: 'dr_ahmad' },
                    { label: 'dr. Budi Santoso, Sp.OT', value: 'dr_budi' },
                    { label: 'dr. Citra Dewi, Sp.OG', value: 'dr_citra' }
                  ]}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Divider orientation="left" orientationMargin={0}>
          <Text type="secondary" className="text-xs">
            Asisten Operasi
          </Text>
        </Divider>
        <Row gutter={8} className="mb-2">
          {['asisten1', 'asisten2'].map((field, i) => (
            <Col xs={24} md={12} key={field}>
              <Form.Item name={field} label={`Asisten ${i + 1}`}>
                <Select
                  placeholder="Pilih asisten..."
                  showSearch
                  allowClear
                  options={[
                    { label: 'dr. Dian Pratiwi', value: 'dr_dian' },
                    { label: 'dr. Eka Putra', value: 'dr_eka' }
                  ]}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Divider orientation="left" orientationMargin={0}>
          <Text type="secondary" className="text-xs">
            Anestesiologi
          </Text>
        </Divider>
        <Row gutter={8} className="mb-2">
          {['anestesi1', 'anestesi2'].map((field, i) => (
            <Col xs={24} md={12} key={field}>
              <Form.Item name={field} label={`Dokter Anestesi ${i + 1}`}>
                <Select
                  placeholder="Pilih dokter anestesi..."
                  showSearch
                  allowClear
                  options={[
                    { label: 'dr. Eko Prasetyo, Sp.An', value: 'dr_eko' },
                    { label: 'dr. Fitri Handayani, Sp.An', value: 'dr_fitri' }
                  ]}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Divider orientation="left" orientationMargin={0}>
          <Text type="secondary" className="text-xs">
            Perawat OK / Sirkuler
          </Text>
        </Divider>
        <Row gutter={8}>
          {['perawat1', 'perawat2', 'perawat3'].map((field, i) => (
            <Col xs={24} md={8} key={field}>
              <Form.Item name={field} label={`Perawat OK ${i + 1}`}>
                <Select
                  placeholder="Pilih perawat..."
                  showSearch
                  allowClear
                  options={[
                    { label: 'Ns. Rina Susanti, S.Kep', value: 'ns_rina' },
                    { label: 'Ns. Siti Aminah, S.Kep', value: 'ns_siti' },
                    { label: 'Ns. Dewi Kurnia, S.Kep', value: 'ns_dewi' }
                  ]}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      <Alert
        type="success"
        showIcon
        message="Sign-Out dilakukan sebelum penutupan luka. Pastikan semua instrumen, kasa, dan jarum sudah dihitung lengkap."
      />
      {standalone ? (
        <Form form={form} layout="vertical">
          {content}
          <div className="flex justify-end gap-2 mt-4">
            <Button>Reset</Button>
            <Button type="primary" size="large" style={{ background: '#3b82f6', border: 'none' }}>
              Konfirmasi Sign-Out & Selesaikan Operasi
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-2">{content}</div>
      )}
    </div>
  )
}
