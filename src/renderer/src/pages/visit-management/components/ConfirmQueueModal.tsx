import { PlusOutlined } from '@ant-design/icons'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { client } from '@renderer/utils/client'
import { Button, Descriptions, Form, Modal, Space, message } from 'antd'
import { useEffect, useState } from 'react'
import CreatePatientModal from './CreatePatientModal'

export type ConfirmQueueModalProps = {
  open: boolean
  onClose: () => void
  queue?: any // Typed as any for now, should be GetActiveQueueResult
  onSuccess?: () => void
}

const ConfirmQueueModal = ({ open, onClose, queue, onSuccess }: ConfirmQueueModalProps) => {
  const [form] = Form.useForm()
  const confirmMutation = client.visitManagement.confirmAttendance.useMutation()
  const [createPatientModalOpen, setCreatePatientModalOpen] = useState(false)
  
  // Track manually selected patient to force update SelectAsync if needed
  // (SelectAsync primarily relies on its internal query, but we can pass value prop)

  useEffect(() => {
    if (open && queue) {
      if (queue.patientId) {
        form.setFieldsValue({ patientId: queue.patientId })
      } else {
        form.resetFields()
      }
    }
  }, [open, queue, form])

  const handleSubmit = async (values: any) => {
    if (!queue) return

    try {
      await confirmMutation.mutateAsync({
        queueId: queue.id,
        patientId: values.patientId
      })
      message.success('Kehadiran dikonfirmasi')
      onSuccess?.()
      onClose()
    } catch (error: any) {
        console.error(error)
        message.error(error.message || 'Gagal mengkonfirmasi kehadiran')
    }
  }

  const handlePatientCreated = (data: any) => {
      // Assuming data.result contains the created patient object with id and name
      // We set the form value. 
      // Note: SelectAsync might need a way to inject "initial options" or we rely on it fetching logic
     
      // Ideally SelectAsync would re-fetch or we manually set value. 
      // Since SelectAsync is simple, setting form value usually works if the ID exists.
      // But passing the 'option' to Select is trickier without modifying SelectAsync.
      // For now, we assume the user can search for the NEW patient name, or we try to set it.
      
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
      onOk={() => form.submit()}
      confirmLoading={confirmMutation.isPending}
      destroyOnClose
    >
      {queue && (
        <div className="mb-4">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Nomor Antrian">{queue.formattedQueueNumber}</Descriptions.Item>
            <Descriptions.Item label="Poli">{queue.poli?.name}</Descriptions.Item>
            <Descriptions.Item label="Dokter">{queue.practitioner?.name || '-'}</Descriptions.Item>
          </Descriptions>
        </div>
      )}
      
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Pasien"
          required
          className="mb-0"
        >
            <Space className="w-full" align="start">
                <Form.Item
                    name="patientId"
                    rules={[{ required: true, message: 'Harap pilih pasien' }]}
                    className="flex-1 mb-0 w-full"
                >
                    <SelectAsync
                        entity="patient"
                        display="name"
                        output="id"
                        disabled={!!queue?.patientId} 
                        placeHolder="Cari Pasien"
                        className="w-full"
                    />
                </Form.Item>
                {!queue?.patientId && (
                    <Button 
                        icon={<PlusOutlined />} 
                        onClick={() => setCreatePatientModalOpen(true)}
                    >
                        Buat Pasien
                    </Button>
                )}
            </Space>
        </Form.Item>
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
