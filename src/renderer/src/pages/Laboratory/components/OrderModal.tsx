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
  const category = Form.useWatch('category', form)

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
        requesterOrganizationId: encounter.serviceUnitId,
        category: values.category
      })
      form.resetFields()
      onCancel()
    } catch (error) {
      // Error handled in hook
    }
  }

  return (
    <Modal
      title="Create Order"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading === 'create-order'}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ category: 'LABORATORY', priority: 'ROUTINE' }}
      >
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'Laboratory', value: 'LABORATORY' },
              { label: 'Radiology', value: 'RADIOLOGY' }
            ]}
            onChange={() => form.setFieldValue('testCodeId', undefined)}
          />
        </Form.Item>
        <Form.Item
          name="testCodeId"
          label="Test / Exam"
          rules={[{ required: true, message: 'Please select a test/exam' }]}
        >
          {/* @ts-ignore: SelectAsync props injected by Form.Item */}
          <SelectAsync
            key={category} // Force re-render when category changes
            entity={'referencecode'}
            display={'display'}
            output={'id'}
            placeHolder={category === 'RADIOLOGY' ? 'Select Radiology Exam' : 'Select Lab Test'}
            filters={{
              category: category === 'RADIOLOGY' ? 'RADIOLOGY_EXAM' : 'LAB_TEST'
            }}
          />
        </Form.Item>
        <Form.Item name="priority" label="Priority">
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
