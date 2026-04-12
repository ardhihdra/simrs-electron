import { PlusOutlined } from '@ant-design/icons'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import CreatePatientModal from '@renderer/components/organisms/visit-management/CreatePatientModal'
import { client } from '@renderer/utils/client'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, Button, Descriptions, Form, Modal, Select, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

export type RegistrationTicketRow = {
  ticketId?: string
  ticketNo?: string
  queueDate?: string
  status?: string
  patientId?: string | null
  patientName?: string | null
  issuedAt?: string
}

type DoctorScheduleOption = {
  doctorScheduleId: number
  doctorId: number
  doctorName?: string
  poliId: number
  poliName?: string
}

export type ConfirmRegistrationTicketModalProps = {
  open: boolean
  onClose: () => void
  ticket?: RegistrationTicketRow
  onSuccess?: () => void
}

export default function ConfirmRegistrationTicketModal({
  open,
  onClose,
  ticket,
  onSuccess
}: ConfirmRegistrationTicketModalProps) {
  const [form] = Form.useForm()
  const { message, modal } = App.useApp()
  const [createPatientModalOpen, setCreatePatientModalOpen] = useState(false)
  const [availableDoctors, setAvailableDoctors] = useState<DoctorScheduleOption[]>([])
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)

  const confirmMutation = client.registration.confirmRegistrationQueue.useMutation()

  const queueDate = ticket?.queueDate
    ? dayjs(ticket.queueDate).format('YYYY-MM-DD')
    : dayjs().format('YYYY-MM-DD')

  const availableDoctorsQuery = client.registration.getAvailableDoctors.useQuery(
    { date: queueDate },
    {
      enabled: open,
      queryKey: ['confirmRegTicket.doctors', queueDate] as any
    }
  )

  const doctorOptions = useMemo(() => {
    const result = availableDoctorsQuery.data as any
    const doctors: DoctorScheduleOption[] = result?.result?.doctors ?? result?.doctors ?? []
    return doctors.map((d) => ({
      value: d.doctorScheduleId,
      label: `${d.doctorName ?? 'Dokter'} – ${d.poliName ?? '-'}`,
      ...d
    }))
  }, [availableDoctorsQuery.data])

  useEffect(() => {
    if (!open) {
      form.resetFields()
    }
  }, [open, form])

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields()

      const selectedDoctor = doctorOptions.find(
        (d) => d.value === Number(values.doctorScheduleId)
      )

      if (!selectedDoctor) {
        message.error('Dokter tidak ditemukan')
        return
      }

      modal.confirm({
        title: 'Konfirmasi Antrian Pendaftaran',
        content: `Pasien akan dialihkan ke antrian poli ${selectedDoctor.poliName ?? ''} (${selectedDoctor.doctorName ?? ''}). Lanjutkan?`,
        okText: 'Ya, Konfirmasi',
        okType: 'primary',
        cancelText: 'Batal',
        onOk: async () => {
          try {
            await confirmMutation.mutateAsync({
              registrationTicketId: ticket!.ticketId!,
              patientId: values.patientId,
              practitionerId: selectedDoctor.doctorId,
              doctorScheduleId: selectedDoctor.doctorScheduleId,
              queueDate,
              paymentMethod: values.paymentMethod ?? 'CASH',
              reason: `Dialihkan dari antrian registrasi ${ticket!.ticketNo}`
            })

            message.success('Antrian berhasil dikonfirmasi dan dialihkan ke poli')
            onSuccess?.()
            onClose()
          } catch (error: any) {
            message.error(error?.message || 'Gagal mengkonfirmasi antrian registrasi')
          }
        }
      })
    } catch {
      // validation handled by form
    }
  }

  return (
    <Modal
      title={`Konfirmasi Antrian Pendaftaran – ${ticket?.ticketNo ?? '-'}`}
      open={open}
      onCancel={onClose}
      width={640}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          Batal
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={confirmMutation.isPending}
          onClick={handleConfirm}
        >
          Konfirmasi & Alihkan ke Poli
        </Button>
      ]}
    >
      {ticket && (
        <div className="mb-4">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="No. Antrian">
              <strong>{ticket.ticketNo ?? '-'}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="blue">{ticket.status ?? '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tanggal">{queueDate}</Descriptions.Item>
            <Descriptions.Item label="Dibuat">
              {ticket.issuedAt ? dayjs(ticket.issuedAt).format('HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinishFailed={(errorInfo) =>
          notifyFormValidationError(form, message, errorInfo, 'Lengkapi data sebelum konfirmasi.')
        }
      >
        <Form.Item label="Pasien" required className="-mb-2!">
          <Space className="w-full" align="start">
            <Form.Item
              name="patientId"
              rules={[{ required: true, message: 'Harap pilih pasien' }]}
              className="mb-0 flex-1 w-full"
            >
              <SelectAsync
                entity="patient"
                display="name"
                output="id"
                placeHolder="Cari Data Pasien"
                className="w-full"
              />
            </Form.Item>
            <Button icon={<PlusOutlined />} onClick={() => setCreatePatientModalOpen(true)}>
              Buat Pasien
            </Button>
          </Space>
        </Form.Item>

        <Form.Item
          name="doctorScheduleId"
          label="Dokter / Poli Tujuan"
          rules={[{ required: true, message: 'Harap pilih dokter' }]}
        >
          <Select
            options={doctorOptions}
            loading={availableDoctorsQuery.isLoading}
            placeholder="Pilih dokter dan poli tujuan"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item name="paymentMethod" label="Cara Bayar" initialValue="CASH">
          <Select
            options={[
              { value: 'CASH', label: 'Tunai' },
              { value: 'BPJS', label: 'BPJS' },
              { value: 'INSURANCE', label: 'Asuransi' },
              { value: 'COMPANY', label: 'Perusahaan' }
            ]}
          />
        </Form.Item>
      </Form>

      <CreatePatientModal
        open={createPatientModalOpen}
        onClose={() => setCreatePatientModalOpen(false)}
        onSuccess={(data: any) => {
          if (data?.result?.id) {
            form.setFieldsValue({ patientId: data.result.id })
          }
        }}
      />
    </Modal>
  )
}
