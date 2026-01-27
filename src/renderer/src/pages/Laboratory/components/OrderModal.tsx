import { SelectAsync } from '@renderer/components/dynamic/SelectAsync'
import { Form, Modal, Select } from 'antd'
import { useLaboratoryActions } from '../useLaboratoryActions'

interface OrderModalProps {
  visible: boolean
  encounter: any
  onCancel: () => void
  onSuccess: () => void
}

export function OrderModal({ visible, encounter, onCancel, onSuccess }: OrderModalProps) {
  const [form] = Form.useForm()
  const { handleCreateOrder, loading } = useLaboratoryActions(onSuccess)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await handleCreateOrder({
        encounterId: encounter.id,
        patientId: encounter.patientId,
        items: [
          {
            testCodeId: values.testCodeId,
            priority: values.priority
          }
        ],
        // TODO: Mocking requester for now - ideally from auth context
        requesterPractitionerId: 'practitioner-uuid',
        requesterOrganizationId: encounter.serviceUnitId
      })
      form.resetFields()
      onCancel()
    } catch (error) {
      // Error handled in hook
    }
  }

  return (
    <Modal
      title="Create Lab Order"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading === 'create-order'}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="testCodeId"
          label="Test"
          rules={[{ required: true, message: 'Please select a test' }]}
        >
          {/* @ts-ignore: SelectAsync props injected by Form.Item */}
          <SelectAsync
            entity={'referencecode'}
            display={'display'}
            output={'id'}
            placeHolder="Select Lab Test"
            filters={{
              category: 'LAB_TEST'
            }}
          />
        </Form.Item>
        <Form.Item name="priority" label="Priority" initialValue="ROUTINE">
          <Select
            options={[
              { label: 'Routine', value: 'ROUTINE' },
              { label: 'Urgent', value: 'URGENT' },
              { label: 'Stat', value: 'STAT' }
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
