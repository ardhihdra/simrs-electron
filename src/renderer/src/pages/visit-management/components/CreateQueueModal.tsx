import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { client } from '@renderer/utils/client'
import { PatientAttributes } from '@shared/patient'
import { Button, DatePicker, Drawer, Form, message, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'

export type CreateQueueModalProps = {
  open: boolean
  onClose: () => void
  patient?: PatientAttributes
  onSuccess?: () => void
}

const CreateQueueModal = ({ open, onClose, patient, onSuccess }: CreateQueueModalProps) => {
  const [form] = Form.useForm()
  const createQueue = client.visitManagement.register.useMutation()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        queueDate: dayjs(),
        isOnline: !patient // If no patient, default to PRE_RESERVED (isOnline=true)
      })
    } else {
      form.resetFields()
      createQueue.reset()
    }
  }, [open, form, patient])

  const handleSubmit = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        queueDate: values.queueDate ? dayjs(values.queueDate).format('YYYY-MM-DD') : undefined,
        patientId: patient?.id,
        isOnline: !patient ? true : values.isOnline // Ensure PRE_RESERVED if no patient
      }
      
      await createQueue.mutateAsync(formattedValues)
      message.success('Antrian berhasil dibuat')
      onSuccess?.()
      onClose()
    } catch (error: any) {
        // Error handling is managed by react-query/client usually, but we can show message here too
        console.error(error)
        message.error(error.message || 'Gagal membuat antrian')
    }
  }

  return (
    <Drawer
      title={patient ? `Pendaftaran Pasien: ${patient.name}` : 'Buat Antrian (Pre-Reserved)'}
      width={600}
      open={open}
      onClose={onClose}
      maskClosable={false}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={createQueue.isPending}>
            {patient ? 'Daftar' : 'Buat Antrian'}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          queueDate: dayjs(),
          registrationChannelCodeId: 'OFFLINE'
        }}
      >
        <Form.Item
          name="queueDate"
          label="Tanggal Antrian"
          rules={[{ required: true, message: 'Harap pilih tanggal' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="serviceUnitCodeId"
          label="Unit Layanan"
          rules={[{ required: true, message: 'Harap pilih unit layanan' }]}
        >
          <SelectAsync
            entity="referencecode"
            display="display"
            output="code"
            filters={{ category: 'SERVICE_UNIT' }}
          />
        </Form.Item>

        <Form.Item
          name="poliCodeId"
          label="Sub-Poli / Ruangan"
          rules={[{ required: true, message: 'Harap pilih sub-poli' }]}
        >
          <SelectAsync entity="poli" />
        </Form.Item>

        <Form.Item
          name="registrationChannelCodeId"
          label="Registrasi"
          rules={[{ required: true, message: 'Harap pilih registrasi' }]}
        >
          <SelectAsync
            entity="referencecode"
            display="display"
            output="code"
            filters={{ category: 'REGISTRATION_CHANNEL' }}
            disabled
          />
        </Form.Item>

        <Form.Item
          name="assuranceCodeId"
          label="Asuransi"
          rules={[{ required: true, message: 'Harap pilih asuransi' }]}
        >
          <SelectAsync
            entity={'referencecode'}
            display="display"
            output="code"
            filters={{ category: 'ASSURANCE' }}
          />
        </Form.Item>

        <Form.Item
          name="practitionerId"
          label="Dokter"
          rules={[{ required: true, message: 'Harap pilih dokter' }]}
        >
          <SelectAsync
            display="namaLengkap"
            entity="kepegawaian"
            output="id"
            filters={{
              hakAksesId: 'doctor'
            }}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

export default CreateQueueModal
