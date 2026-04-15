import { PlusOutlined } from '@ant-design/icons'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import CreatePatientModal from '@renderer/components/organisms/visit-management/CreatePatientModal'
import { client } from '@renderer/utils/client'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, Button, DatePicker, Descriptions, Form, Input, Modal, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

export type ConfirmQueueModalProps = {
  open: boolean
  onClose: () => void
  queue?: any // Typed as any for now, should be GetActiveQueueResult
  onSuccess?: () => void
}

const ConfirmQueueModal = ({ open, onClose, queue, onSuccess }: ConfirmQueueModalProps) => {
  const [form] = Form.useForm()
  const confirmMutation = client.visitManagement.confirmAttendance.useMutation()
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()
  const [createPatientModalOpen, setCreatePatientModalOpen] = useState(false)
  const { message, modal } = App.useApp()
  const paymentMethod = Form.useWatch('paymentMethod', form)
  const needsMitra =
    paymentMethod === 'INSURANCE' || paymentMethod === 'COMPANY' || paymentMethod === 'BPJS'

  const mitraQueryInput = useMemo(
    () => ({
      type:
        paymentMethod === 'COMPANY'
          ? ('company' as const)
          : paymentMethod === 'BPJS'
            ? ('bpjs' as const)
            : ('insurance' as const),
      status: 'active'
    }),
    [paymentMethod]
  )

  const mitraQuery = client.visitManagement.getMitra.useQuery(mitraQueryInput, {
    enabled: needsMitra,
    queryKey: ['confirmQueueMitra', mitraQueryInput]
  })

  const mitraOptions = useMemo(() => {
    const data = mitraQuery.data as any
    const rows = data?.result || data?.data || []

    return rows.map((item: any) => ({
      value: item.id,
      label: item.name || item.nama || `Mitra ${item.id}`
    }))
  }, [mitraQuery.data])

  useEffect(() => {
    if (open && queue) {
      form.setFieldsValue({
        patientId: queue.patientId || undefined,
        paymentMethod: queue.paymentMethod ? String(queue.paymentMethod).toUpperCase() : 'CASH',
        mitraId: queue.mitraId || undefined,
        mitraCodeNumber: queue.mitraCodeNumber || undefined,
        mitraCodeExpiredDate: queue.mitraCodeExpiredDate
          ? dayjs(queue.mitraCodeExpiredDate)
          : undefined
      })
    }
  }, [open, queue, form])

  useEffect(() => {
    if (needsMitra) return

    form.setFieldsValue({
      mitraId: undefined,
      mitraCodeNumber: undefined,
      mitraCodeExpiredDate: undefined
    })
  }, [needsMitra, form])

  const submitConfirmation = async (values: any) => {
    if (!queue) return

    try {
      const queueId = queue.queueId ?? queue.id
      if (queueId === undefined || queueId === null) {
        message.error('ID antrian tidak ditemukan')
        return
      }

      await confirmMutation.mutateAsync({
        queueId: String(queueId),
        patientId: values.patientId,
        paymentMethod: values.paymentMethod,
        mitraId: needsMitra ? Number(values.mitraId) : undefined,
        mitraCodeNumber: needsMitra ? values.mitraCodeNumber || undefined : undefined,
        mitraCodeExpiredDate:
          needsMitra && values.mitraCodeExpiredDate
            ? dayjs(values.mitraCodeExpiredDate).format('YYYY-MM-DD')
            : undefined,
        mitraCode: needsMitra ? values.mitraCodeNumber || undefined : undefined,
        mitraExpiredAt:
          needsMitra && values.mitraCodeExpiredDate
            ? dayjs(values.mitraCodeExpiredDate).format('YYYY-MM-DD')
            : undefined
      })

      message.success('Kehadiran dikonfirmasi')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      message.error(error.message || 'Gagal memproses konfirmasi antrian')
    }
  }

  const handleSubmit = async (values: any) => {
    modal.confirm({
      title: 'Konfirmasi Kehadiran Pasien',
      content: 'Pasien dan cara bayar akan disimpan ke antrian ini. Lanjutkan?',
      okText: 'Ya, Konfirmasi',
      okType: 'primary',
      cancelText: 'Batal',
      onOk: async () => submitConfirmation(values)
    })
  }

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields()
      await handleSubmit(values)
    } catch {
      // validation feedback is handled by form
    }
  }

  const handleSkip = () => {
    if (!queue) return

    const queueId = queue.queueId ?? queue.id
    if (!queueId) {
      message.error('ID antrian tidak ditemukan')
      return
    }

    modal.confirm({
      title: 'Skip Antrian',
      content: `Antrian ${queue.formattedQueueNumber} akan langsung di-skip. Lanjutkan?`,
      okText: 'Ya, Skip',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await updateStatusMutation.mutateAsync({
            queueId: String(queueId),
            action: 'SKIP' as any
          })
          message.success(`Antrian ${queue.formattedQueueNumber} berhasil di-skip`)
          onSuccess?.()
          onClose()
        } catch (error: any) {
          message.error(error.message || 'Gagal melewati antrian')
        }
      }
    })
  }

  const handlePatientCreated = (data: any) => {
    message.success(`Pasien ${data?.result?.name} dibuat. Silakan pilih.`)

    // If data.result.id is compliant
    if (data?.result?.id) {
      form.setFieldsValue({ patientId: data.result.id })
    }
  }

  return (
    <Modal
      title="Konfirmasi Kehadiran"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Batal
        </Button>,
        <Button
          danger
          key="skip"
          loading={confirmMutation.isPending || updateStatusMutation.isPending}
          onClick={handleSkip}
        >
          Skip
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={confirmMutation.isPending || updateStatusMutation.isPending}
          onClick={handleConfirm}
        >
          Konfirmasi
        </Button>
      ]}
      destroyOnClose
    >
      {queue && (
        <div className="mb-4">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Nomor Antrian">
              {queue.formattedQueueNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Poli">
              {queue.poli?.name || queue.poliName || queue.serviceUnitName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Dokter">
              {queue.practitioner?.name ||
                queue.practitioner?.namaLengkap ||
                queue.doctorName ||
                '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinishFailed={(errorInfo) =>
          notifyFormValidationError(
            form,
            message,
            errorInfo,
            'Pilih pasien terlebih dahulu sebelum konfirmasi.'
          )
        }
      >
        <Form.Item label="Pasien" required className="-mb-2!">
          <Space className="w-full" align="start" style={{ marginBottom: 0 }}>
            <Form.Item
              name="patientId"
              rules={[{ required: true, message: 'Harap pilih pasien' }]}
              className="flex-1 mb-0 w-full"
            >
              <SelectAsync
                entity="patient"
                display="name"
                output="id"
                // disabled={!!queue?.patientId}
                placeHolder="Cari Data Pasien"
                className="w-full"
              />
            </Form.Item>
            {!queue?.patientId && (
              <Button icon={<PlusOutlined />} onClick={() => setCreatePatientModalOpen(true)}>
                Buat Pasien
              </Button>
            )}
          </Space>
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="Cara Bayar"
          rules={[{ required: true, message: 'Harap pilih cara bayar' }]}
        >
          <Select
            options={[
              { value: 'CASH', label: 'Tunai' },
              { value: 'INSURANCE', label: 'Asuransi' },
              { value: 'BPJS', label: 'BPJS' },
              { value: 'COMPANY', label: 'Perusahaan' }
            ]}
          />
        </Form.Item>

        {needsMitra && (
          <>
            <Form.Item
              name="mitraId"
              label="Mitra"
              rules={[{ required: true, message: 'Harap pilih mitra' }]}
            >
              <Select
                options={mitraOptions}
                loading={mitraQuery.isLoading || mitraQuery.isRefetching}
                placeholder="Pilih mitra"
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item
              name="mitraCodeNumber"
              label="Nomor Kartu"
              rules={[{ required: true, message: 'Harap isi nomor kartu' }]}
            >
              <Input placeholder="Nomor kartu/nomor mitra" />
            </Form.Item>

            <Form.Item
              name="mitraCodeExpiredDate"
              label="Expired At"
              rules={[{ required: true, message: 'Harap pilih tanggal expired' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        {needsMitra &&
          !mitraQuery.isLoading &&
          !mitraQuery.isRefetching &&
          mitraOptions.length === 0 && (
            <div style={{ color: '#a8071a' }}>
              Data mitra tidak ditemukan untuk metode pembayaran ini.
            </div>
          )}
      </Form>

      <CreatePatientModal
        open={createPatientModalOpen}
        onClose={() => setCreatePatientModalOpen(false)}
        onSuccess={handlePatientCreated}
      />
    </Modal>
  )
}

export default ConfirmQueueModal
