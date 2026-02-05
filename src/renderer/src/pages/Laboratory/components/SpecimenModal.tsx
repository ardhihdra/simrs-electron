import { Form, Modal, Select } from 'antd'
import { useLaboratoryActions } from '../useLaboratoryActions'

interface SpecimenModalProps {
  visible: boolean
  encounter: any
  onCancel: () => void
  onSuccess: () => void
}

export function SpecimenModal({ visible, encounter, onCancel, onSuccess }: SpecimenModalProps) {
  const [form] = Form.useForm()
  const { handleCollectSpecimen, loading } = useLaboratoryActions(onSuccess)

  // Filter pending requests? For now just showing all associated requests
  const requests = encounter?.labServiceRequests || []

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await handleCollectSpecimen({
        serviceRequestId: values.serviceRequestId,
        typeCodeId: values.typeCodeId
      })
      form.resetFields()
      onCancel()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Modal
      title="Collect Specimen"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading === 'collect-specimen'}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="serviceRequestId"
          label="Lab Order"
          rules={[{ required: true, message: 'Select an order' }]}
        >
          <Select
            options={requests.map((r: any) => ({
              label: `${r.testCode.display} (${r.priority})`,
              value: r.id
            }))}
            placeholder={requests.length === 0 ? 'No orders found' : 'Select order'}
          />
        </Form.Item>
        <Form.Item name="typeCodeId" label="Specimen Type" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'Blood', value: 'BLOOD' },
              { label: 'Urine', value: 'URINE' },
              { label: 'Swab', value: 'SWAB' }
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
