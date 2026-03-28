import { useState, useRef } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  DatePicker,
  App,
  Modal,
  Table,
  Divider,
  Typography
} from 'antd'
import {
  PrinterOutlined,
  SaveOutlined,
  EditOutlined,
  HistoryOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { useReactToPrint } from 'react-to-print'
import { FollowUpLetter, type FollowUpData } from './FollowUpLetter'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { SignaturePadModal } from '@renderer/components/molecules/SignaturePadModal'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import {
  useCreateFollowUpSchedule,
  useFollowUpScheduleByEncounter,
  useDeleteFollowUpSchedule
} from '@renderer/hooks/query/use-follow-up-schedule'

dayjs.locale('id')

const { Text } = Typography
const { TextArea } = Input

interface FollowUpFormProps {
  encounterId: string
  patientData: any
}

const JENIS_KONTROL_OPTIONS = [
  { label: 'Post Rawat Jalan', value: 'Post Rawat Jalan' },
  { label: 'Post Rawat Inap', value: 'Post Rawat Inap' },
  { label: 'Post Operasi', value: 'Post Operasi' },
  { label: 'Kontrol Rutin', value: 'Kontrol Rutin' },
  { label: 'Rujuk Balik / Prolanis', value: 'Rujuk Balik / Prolanis' }
]

export const FollowUpForm = ({ encounterId: _encounterId, patientData }: FollowUpFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const { data: performers, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  const { data: followUpList, isLoading: isListLoading } =
    useFollowUpScheduleByEncounter(_encounterId)
  const createFollowUp = useCreateFollowUpSchedule()
  const deleteFollowUp = useDeleteFollowUpSchedule()

  const [previewData, setPreviewData] = useState<FollowUpData | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [sigModal, setSigModal] = useState<{ visible: boolean; type: string; title: string }>({
    visible: false,
    type: '',
    title: ''
  })

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Surat_Kontrol_${previewData?.id || ''}`
  })

  const openSigModal = (type: string, title: string) => {
    setSigModal({ visible: true, type, title })
  }

  const saveSignature = (dataUrl: string) => {
    setSignatures((prev) => ({ ...prev, [sigModal.type]: dataUrl }))
  }

  const signatureBox = (type: string, label: string) => (
    <div className="flex flex-col items-center p-4 border border-black/10 bg-white/10">
      <Text strong className="mb-3 uppercase text-[10px] tracking-widest text-gray-400">
        {label}
      </Text>
      <div className="border border-white/10 w-full h-32 flex items-center justify-center mb-4 bg-white/10 rounded-lg overflow-hidden relative group">
        {signatures[type] ? (
          <img
            src={signatures[type]}
            alt="Signature"
            className="max-h-full transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <EditOutlined className="text-2xl opacity-20" />
            <Text className="text-[10px] italic">Belum Ada TTD</Text>
          </div>
        )}
      </div>
      <Button
        icon={<EditOutlined />}
        size="small"
        block
        className="rounded-lg text-xs"
        onClick={() => openSigModal(type, label)}
      >
        Tanda Tangan
      </Button>
    </div>
  )

  const onFinish = async (values: any) => {
    const performer =
      (performers as any[] | undefined)?.find((p: any) => p.name === values.dokterTujuan) ||
      (performers as any[] | undefined)?.[0]

    const controlDateISO = values.controlDate?.toISOString()

    try {
      const response = await createFollowUp.mutateAsync({
        encounterId: _encounterId,
        patientId: patientData?.patient?.id || patientData?.id,
        doctorId: performer?.id || 1,
        followUpDate: controlDateISO,
        polyclinicId: Number(values.poliTujuan) || null,
        controlType: values.jenisKontrol,
        diagnosis: values.diagnosis,
        notes: values.notes
      })

      const newFollowUp: FollowUpData = {
        id: response?.id || `KTR-${Date.now()}`,
        controlDate: controlDateISO,
        poliTujuan: values.poliTujuan,
        dokterTujuan: values.dokterTujuan,
        jenisKontrol: values.jenisKontrol,
        diagnosis: values.diagnosis,
        notes: values.notes,
        issuedAt: values.assessment_date?.toISOString() || new Date().toISOString(),
        doctorName: performer?.name || values.dokterTujuan || 'dr. _______________',
        doctorSip: performer?.sip || undefined,
        signatureUrl: signatures['doctor']
      }

      setPreviewData(newFollowUp)
      setIsPreviewOpen(true)

      message.success('Rencana Kontrol berhasil dibuat')
      form.resetFields([
        'controlDate',
        'poliTujuan',
        'dokterTujuan',
        'jenisKontrol',
        'diagnosis',
        'notes'
      ])
      form.setFieldsValue({ assessment_date: dayjs() })
    } catch (error) {
      console.error(error)
      message.error('Gagal menyimpan rencana kontrol')
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Hapus Rencana Kontrol',
      content: 'Apakah Anda yakin ingin menghapus data Jadwal Kontrol ini?',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await deleteFollowUp.mutateAsync({ id })
          message.success('Jadwal kontrol berhasil dihapus')
        } catch (error) {
          message.error('Gagal menghapus jadwal kontrol')
        }
      }
    })
  }

  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Tgl Pembuatan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="font-semibold">{dayjs(date).format('DD/MM/YYYY')}</span>
          <span className="text-gray-500 text-xs">{dayjs(date).format('HH:mm')}</span>
        </div>
      )
    },
    {
      title: 'Dokter',
      key: 'doctor',
      width: 160,
      render: (_: any, record: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-blue-700 text-xs">
            {record.doctor?.namaLengkap || '-'}
          </span>
        </div>
      )
    },
    {
      title: 'Jadwal Kontrol',
      key: 'detail',
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex gap-2 items-center">
            <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs border border-green-100 uppercase tracking-wider">
              {record.controlType || 'Kontrol'}
            </span>
            <span className="font-semibold">
              {dayjs(record.followUpDate).format('dddd, DD MMM YYYY')}
            </span>
          </div>

          <div className="flex flex-col text-gray-600 text-xs mt-1 gap-1">
            <span>
              <span className="text-gray-400">Diagnosis:</span> {record.diagnosis || '-'}
            </span>
            <span>
              <span className="text-gray-400">Poli Tujuan:</span>{' '}
              {record.polyclinic?.name || record.polyclinicId || '-'}
            </span>
          </div>

          {record.notes && (
            <div className="mt-1 bg-gray-50 border border-gray-100 p-2 rounded text-xs italic text-gray-500">
              Catatan: {record.notes}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <div className="flex gap-2 justify-center">
          <Button
            type="text"
            className="text-blue-500"
            icon={<PrinterOutlined />}
            onClick={() => {
              const fallbackDoctor = (performers as any[])?.find((p) => p.id === record.doctorId)
              setPreviewData({
                id: record.id,
                controlDate: record.followUpDate,
                poliTujuan:
                  record.polyclinic?.name ||
                  (record.polyclinicId ? `Poli ID ${record.polyclinicId}` : 'Poliklinik'),
                dokterTujuan:
                  record.doctor?.namaLengkap || fallbackDoctor?.name || 'Dokter Pemeriksa',
                jenisKontrol: record.controlType,
                diagnosis: record.diagnosis || '-',
                notes: record.notes,
                issuedAt: record.createdAt,
                doctorName:
                  record.doctor?.namaLengkap || fallbackDoctor?.name || 'dr. _______________',
                doctorSip: fallbackDoctor?.sip || undefined
              })
              setIsPreviewOpen(true)
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            loading={deleteFollowUp.isPending}
          />
        </div>
      )
    }
  ]

  return (
    <div className="flex! flex-col! gap-6!">
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>Riwayat Surat Kontrol Pasien</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsFormModalOpen(true)}>
              Buat Jadwal Kontrol
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={followUpList || []}
          rowKey="id"
          pagination={false}
          className="border-none"
          loading={isListLoading}
          locale={{ emptyText: 'Belum ada riwayat surat kontrol' }}
        />
      </Card>

      <Modal
        title="Buat Jadwal / Rencana Kontrol"
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-4 [&_.ant-form-item]:mb-3! [&_.ant-divider]:my-2!"
          initialValues={{
            assessment_date: dayjs()
          }}
        >
          <AssessmentHeader performers={performers || []} loading={isLoadingPerformers} />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="controlDate"
                label="Tanggal Kontrol"
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <DatePicker className="w-full" format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="poliTujuan"
                label="Poli Tujuan"
                rules={[{ required: true, message: 'Wajib dipilih' }]}
              >
                <SelectAsync entity="poli" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dokterTujuan"
                label="Dokter Tujuan"
                rules={[{ required: true, message: 'Wajib dipilih' }]}
              >
                <Select
                  placeholder="Pilih Dokter Tujuan"
                  showSearch
                  loading={isLoadingPerformers}
                  options={(performers || []).map((p: any) => ({
                    label: p.name,
                    value: p.name
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="jenisKontrol"
            label="Jenis Kontrol"
            rules={[{ required: true, message: 'Wajib dipilih' }]}
          >
            <Select
              options={JENIS_KONTROL_OPTIONS}
              placeholder="Contoh: Post Rawat Inap, Kontrol Rutin..."
            />
          </Form.Item>

          <Form.Item
            name="diagnosis"
            label="Diagnosis"
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <TextArea rows={2} placeholder="Diagnosis sesuai kunjungan terakhir..." />
          </Form.Item>

          <Form.Item name="notes" label="Catatan Dokter (Tindak Lanjut)">
            <TextArea rows={2} placeholder="Pemeriksaan lab yang harus dibawa, dll..." />
          </Form.Item>

          <Divider orientation="left" plain className="text-xs text-gray-400">
            Tanda Tangan Digital (Opsional)
          </Divider>
          <Row gutter={16}>
            <Col span={8}>{signatureBox('doctor', 'Dokter Pemeriksa')}</Col>
          </Row>

          <Form.Item className="mb-0! mt-4!">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsFormModalOpen(false)}>Batal</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createFollowUp.isPending}
                icon={<SaveOutlined />}
              >
                Simpan & Cetak
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <SignaturePadModal
        title={sigModal.title}
        visible={sigModal.visible}
        onClose={() => setSigModal({ ...sigModal, visible: false })}
        onSave={saveSignature}
      />

      <Modal
        title="Preview Rencana Kontrol"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsPreviewOpen(false)}>
            Tutup
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Cetak / Simpan PDF
          </Button>
        ]}
        centered
        styles={{
          body: { padding: 0, background: '#f0f2f5', maxHeight: '80vh', overflow: 'auto' }
        }}
      >
        <div className="p-4 flex justify-center">
          {previewData && (
            <FollowUpLetter ref={printRef} data={previewData} patientData={patientData} />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default FollowUpForm
