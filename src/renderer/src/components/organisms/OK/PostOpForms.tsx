import {
  Form,
  Card,
  Input,
  Button,
  Row,
  Col,
  Tag,
  Alert,
  FormInstance,
  Radio
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'

interface PostOpFormProps {
  standalone?: boolean
  externalForm?: FormInstance
}

interface StatusOption {
  label: string
  value: string
}

const YA_TIDAK_OPTIONS: StatusOption[] = [
  { label: 'Ya', value: 'ya' },
  { label: 'Tidak', value: 'tidak' }
]

export const SignOutForm = ({ standalone = true, externalForm }: PostOpFormProps) => {
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
    <div className="space-y-4">
      <Card size="small" title="Verifikasi Instrumen & Material">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="hitungInstrumen" label="Hitungan instrumen lengkap?">
              {renderStatusRadio([
                { label: 'Ya, lengkap', value: 'ya' },
                { label: 'Tidak — lapor segera', value: 'tidak' }
              ])}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="hitungKasa" label="Hitungan kasa lengkap?">
              {renderStatusRadio([
                { label: 'Ya, lengkap', value: 'ya' },
                { label: 'Tidak', value: 'tidak' }
              ])}
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="hitungJarum" label="Hitungan jarum/benda tajam lengkap?">
              {renderStatusRadio([
                { label: 'Ya, lengkap', value: 'ya' },
                { label: 'Tidak', value: 'tidak' }
              ])}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="spesimenDilabeli" label="Spesimen sudah dilabeli dengan benar?">
              {renderStatusRadio([
                { label: 'Ya', value: 'ya' },
                { label: 'Tidak', value: 'tidak' },
                { label: 'Tidak ada spesimen', value: 'na' }
              ])}
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="masalahPeralatan" label="Ada masalah peralatan yang perlu dilaporkan?">
              {renderStatusRadio([
                { label: 'Tidak ada', value: 'tidak' },
                { label: 'Ya (catat di bawah)', value: 'ya' }
              ])}
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="catatanSignOut" label="Catatan Tambahan">
              <Input.TextArea rows={2} placeholder="Catatan insiden, masalah peralatan, dll..." />
            </Form.Item>
          </Col>
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
            <Button size="large">Reset</Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              style={{ background: '#3b82f6', border: 'none' }}
            >
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

// ─── Checklist Post-Op ─────────────────────────────────────────
const CHECKLIST_POSTOP = [
  {
    key: 'kondisi_pasien',
    kategori: 'Kondisi Pasien',
    items: [
      { key: 'airway_paten', label: 'Airway paten dan aman' },
      { key: 'pernapasan_adekuat', label: 'Pernapasan adekuat (SpO2 > 95%)' },
      { key: 'sirkulasi_stabil', label: 'Sirkulasi stabil (TD, nadi dalam batas normal)' },
      {
        key: 'kesadaran_sesuai',
        label: 'Tingkat kesadaran sesuai ekspektasi pasca anestesi'
      },
      { key: 'tidak_ada_perdarahan', label: 'Tidak ada tanda perdarahan aktif' }
    ]
  },
  {
    key: 'luka_operasi',
    kategori: 'Luka Operasi',
    items: [
      {
        key: 'balutan_luka_baik',
        label: 'Balutan luka dalam kondisi baik, tidak basah berlebihan'
      },
      { key: 'drain_berfungsi', label: 'Drain (jika ada) berfungsi dan tercatat output-nya' },
      {
        key: 'tidak_ada_infeksi_dini',
        label: 'Tidak ada tanda infeksi dini (kemerahan berlebihan, panas)'
      }
    ]
  },
  {
    key: 'administrasi_keluar_ok',
    kategori: 'Administrasi Keluar OK',
    items: [
      { key: 'laporan_anestesi_lengkap', label: 'Laporan anestesi sudah dilengkapi' },
      { key: 'form_signout_ditandatangani', label: 'Form sign-out WHO sudah ditandatangani' },
      {
        key: 'instruksi_postop_tertulis',
        label: 'Instruksi post-op dari operator sudah tertulis'
      },
      {
        key: 'identifikasi_ulang_transfer',
        label: 'Pasien sudah diidentifikasi ulang sebelum transfer'
      }
    ]
  }
]

export const ChecklistPostOpForm = ({ standalone = true, externalForm }: PostOpFormProps) => {
  const [internalForm] = Form.useForm()
  const form = externalForm || internalForm
  const getStatusTagColor = (value: string): string => {
    const normalized = String(value || '').trim().toLowerCase()
    if (normalized === 'ya') return 'green'
    if (normalized === 'tidak') return 'red'
    return 'default'
  }

  const renderStatusRadio = (options: StatusOption[] = [
    { label: 'Ya', value: 'ya' },
    { label: 'Tidak', value: 'tidak' }
  ]) => (
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
    <div className="space-y-4">
      {CHECKLIST_POSTOP.map((group) => (
        <Card key={group.kategori} size="small" title={group.kategori} className='!mt-4'>
          <div className="space-y-3 w-full py-2">
            {group.items.map((item) => (
              <Form.Item
                key={item.key}
                name={['postopChecklist', group.key, item.key]}
                label={item.label}
                rules={[{ required: true, message: 'Pilih Ya atau Tidak' }]}
              >
                {renderStatusRadio()}
              </Form.Item>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message="Checklist ini dilengkapi oleh perawat OK sebelum pasien ditransfer ke Ruang Pulih Sadar (RPS) atau ke ruang rawat."
        className="mb-2"
      />
      {standalone ? (
        <Form form={form} layout="vertical">
          {content}
          <div className="flex justify-end gap-2 mt-4">
            <Button size="large">Reset</Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              style={{ background: '#3b82f6', border: 'none' }}
            >
              Selesai — Transfer Pasien
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-2">{content}</div>
      )}
    </div>
  )
}
