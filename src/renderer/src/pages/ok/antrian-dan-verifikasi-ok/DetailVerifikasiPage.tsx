import { useParams, useNavigate } from 'react-router'
import {
  Button,
  Card,
  Descriptions,
  Table,
  Typography,
  Space,
  Divider,
  Tag,
  Tabs,
  Form,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { ChecklistPreOpForm } from '../../../components/organisms/OK/ChecklistPreOpForm'
import { SignInForm, TimeOutForm, SignOutForm } from '../../../components/organisms/OK/WHOChecklist'
import {
  ChecklistPostOpForm,
  AdministrasiOKForm,
  TagihanOKView
} from '../../../components/organisms/OK/PostOpForms'

const { Text } = Typography

// Mock data logic (for demonstration, ideally fetched via IPC)
const MOCK_DETAIL = {
  id: 'OK-2026-001',
  namaPasien: 'Budi Santoso',
  noRM: '2024-00012',
  tindakan: 'Appendektomi',
  spesialis: 'Bedah Umum',
  kelas: 'Kelas II',
  sifat: 'cyto',
  tanggalRencana: '2026-03-28',
  jamRencana: '08:00 — 10:00',
  dokterOperator: 'dr. Ahmad Fadillah, Sp.B',
  ruangOK: 'Kamar OK 1',
  status: 'menunggu',
  bhp: [
    { nama: 'Sarung Tangan Steril', qty: 4, satuan: 'pasang', harga: 15000 },
    { nama: 'Benang Absorbable 3-0', qty: 2, satuan: 'box', harga: 45000 },
    { nama: 'Kasa Steril', qty: 10, satuan: 'lembar', harga: 3000 }
  ]
}

const DetailVerifikasiPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Form Instances
  const [preOpForm] = Form.useForm()
  const [signInForm] = Form.useForm()
  const [timeOutForm] = Form.useForm()
  const [signOutForm] = Form.useForm()
  const [postOpCheckForm] = Form.useForm()

  const bhpTotal = MOCK_DETAIL.bhp.reduce((sum, b) => sum + b.qty * b.harga, 0)

  const handleSavePreOp = async () => {
    try {
      const values = await preOpForm.validateFields()
      console.log('Saving Pre-Op:', values)
      message.success('Checklist Pre-Op berhasil disimpan')
    } catch (error) {
      message.error('Mohon lengkapi seluruh field wajib di Checklist Pre-Op')
    }
  }

  const handleSaveIntraOp = async () => {
    try {
      const signInValues = await signInForm.validateFields()
      const timeOutValues = await timeOutForm.validateFields()
      console.log('Saving Intra-Op:', { signInValues, timeOutValues })
      message.success('WHO Checklist (Sign-In & Time-Out) berhasil dikonfirmasi')
    } catch (error) {
      message.error('Mohon lengkapi seluruh item WHO Checklist yang wajib diisi')
    }
  }

  const handleSavePostOp = async () => {
    try {
      const signOutValues = await signOutForm.validateFields()
      const postOpValues = await postOpCheckForm.validateFields()
      console.log('Saving Post-Op:', { signOutValues, postOpValues })
      message.success('Data Post-Operasi berhasil disimpan')
    } catch (error) {
      message.error('Mohon lengkapi seluruh field wajib di form Post-Op')
    }
  }

  const tabItems = [
    {
      key: 'verifikasi',
      label: '1. Verifikasi & BHP',
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 gap-4 flex flex-col">
            <Card title="Informasi Pasien & Operasi" className="shadow-none border-gray-100" size="small">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Nama Pasien" span={2}>
                  {MOCK_DETAIL.namaPasien}
                </Descriptions.Item>
                <Descriptions.Item label="No. Rekam Medis">{MOCK_DETAIL.noRM}</Descriptions.Item>
                <Descriptions.Item label="Kelas Layanan">{MOCK_DETAIL.kelas}</Descriptions.Item>
                <Descriptions.Item label="Jenis Tindakan" span={2}>
                  {MOCK_DETAIL.tindakan}
                </Descriptions.Item>
                <Descriptions.Item label="Dokter Operator">
                  {MOCK_DETAIL.dokterOperator}
                </Descriptions.Item>
                <Descriptions.Item label="Ruang OK">{MOCK_DETAIL.ruangOK}</Descriptions.Item>
                <Descriptions.Item label="Tanggal Rencana">
                  {MOCK_DETAIL.tanggalRencana}
                </Descriptions.Item>
                <Descriptions.Item label="Estimasi Waktu">
                  {MOCK_DETAIL.jamRencana}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Daftar Permintaan BHP" className="shadow-none border-gray-100" size="small">
              <Table
                size="small"
                dataSource={MOCK_DETAIL.bhp}
                rowKey="nama"
                pagination={false}
                columns={[
                  { title: 'Item', dataIndex: 'nama', key: 'nama' },
                  { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
                  { title: 'Satuan', dataIndex: 'satuan', key: 'satuan' },
                  {
                    title: 'Harga',
                    dataIndex: 'harga',
                    key: 'harga',
                    align: 'right',
                    render: (v) => `Rp ${v.toLocaleString('id-ID')}`
                  },
                  {
                    title: 'Subtotal',
                    key: 'subtotal',
                    align: 'right',
                    render: (_, r) => `Rp ${(r.qty * r.harga).toLocaleString('id-ID')}`
                  }
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Text strong>Total Estimasi Biaya BHP</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>Rp {bhpTotal.toLocaleString('id-ID')}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Verifikasi Keputusan" className="shadow-none border-gray-100" size="small">
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Setelah disetujui, jadwal akan otomatis masuk ke kalender ruang operasi dan
                  notifikasi akan dikirim ke dokter pengaju.
                </p>
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CheckCircleOutlined />}
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    Setujui & Jadwalkan
                  </Button>
                  <Button danger block size="large" icon={<CloseCircleOutlined />}>
                    Tolak Pengajuan
                  </Button>
                </Space>
                <Divider />
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-500">
                  <FileTextOutlined className="mr-1" />
                  Dibuat oleh Dr. Ahmad pada 26/03/2026 10:00
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'pre-op',
      label: '2. Checklist Pre-Op',
      children: (
        <div className="space-y-6">
          <Form form={preOpForm} layout="vertical">
            <ChecklistPreOpForm standalone={false} externalForm={preOpForm} />
            <div className="flex justify-end mt-6">
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSavePreOp}
                style={{ background: '#3b82f6', border: 'none' }}
              >
                Simpan Seluruh Data Pre-Op
              </Button>
            </div>
          </Form>
        </div>
      )
    },
    {
      key: 'intra-op',
      label: '3. WHO (SignIn + TimeOut)',
      children: (
        <div className="space-y-4">
          <div className="space-y-4">
            <SignInForm standalone={false} externalForm={signInForm} />
            <TimeOutForm standalone={false} externalForm={timeOutForm} />
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSaveIntraOp}
              style={{ background: '#3b82f6', border: 'none' }}
            >
              Simpan WHO Checklist (SignIn + TimeOut)
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'post-op-checklist',
      label: '4. SignOut & Post-Op',
      children: (
        <div className="space-y-4">
          <SignOutForm standalone={false} externalForm={signOutForm} />
          <ChecklistPostOpForm standalone={false} externalForm={postOpCheckForm} />
          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSavePostOp}
              style={{ background: '#3b82f6', border: 'none' }}
            >
              Simpan Sign-Out & Checklist Post-Op
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'administrasi',
      label: '5. Administrasi & Order',
      children: (
        <div className="space-y-6">
          <AdministrasiOKForm />
        </div>
      )
    },
    {
      key: 'billing',
      label: '6. Billing & Tagihan',
      children: (
        <div className="space-y-6">
          <TagihanOKView />
        </div>
      )
    }
  ]

  return (
    <div className="">
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard/ok/verifikasi')}
          type="text"
          className="text-gray-500 hover:text-blue-500"
        >
          Kembali ke Daftar Antrian
        </Button>
      </div>

      <Card
        title={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <FileTextOutlined className="text-blue-500" />
              <span className="text-gray-700 font-bold uppercase tracking-wider text-xs">
                Detail Transaksi Operasi: {id || MOCK_DETAIL.id}
              </span>
            </div>
            <Tag color="orange" icon={<HistoryOutlined />} className="mr-0">
              Status: Menunggu Verifikasi
            </Tag>
          </div>
        }
        className="shadow-none border-gray-100 overflow-hidden"
        bodyStyle={{ padding: '0 24px 24px 24px' }}
      >
        <Tabs
          defaultActiveKey="verifikasi"
          items={tabItems}
          size="small"
          className="ok-tabs-custom"
          tabBarStyle={{ marginBottom: 20 }}
        />
      </Card>

      <style>{`
        .ok-tabs-custom .ant-tabs-tab {
          padding: 12px 0 !important;
          margin-right: 24px !important;
        }
        .ok-tabs-custom .ant-tabs-tab-btn {
          font-weight: 500;
          color: #6b7280;
          font-size: 13px;
        }
        .ok-tabs-custom .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #3b82f6 !important;
        }
        .ok-tabs-custom .ant-tabs-ink-bar {
          height: 3px !important;
          background: #3b82f6 !important;
        }
      `}</style>
    </div>
  )
}

export default DetailVerifikasiPage
