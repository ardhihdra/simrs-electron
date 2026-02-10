import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, Select, Space } from 'antd'
import { useLaboratoryActions } from '../useLaboratoryActions'

interface ResultModalProps {
  visible: boolean
  encounter: any
  onCancel: () => void
  onSuccess: () => void
}

export function ResultModal({ visible, encounter, onCancel, onSuccess }: ResultModalProps) {
  const [form] = Form.useForm()
  const { handleRecordResult, loading } = useLaboratoryActions(onSuccess)

  const requests = encounter?.labServiceRequests || []

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await handleRecordResult({
        serviceRequestId: values.serviceRequestId,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        observations: values.observations.map((obs: any) => ({
          ...obs,
          // Mocking interpretation logic or allowing manual entry if needed
          interpretation: 'NORMAL'
        }))
      })
      form.resetFields()
      onCancel()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Modal
      title="Record Lab Results"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading === 'record-result'}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="serviceRequestId" label="Lab Order" rules={[{ required: true }]}>
          <Select
            options={requests.map((r: any) => ({
              label: `${r.testCode.display} (${r.priority})`,
              value: r.id
            }))}
          />
        </Form.Item>

        <Form.List name="observations">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'observationCodeId']}
                    rules={[{ required: true, message: 'Missing code' }]}
                  >
                    <Input placeholder="Obs Code (e.g. HB)" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'value']}
                    rules={[{ required: true, message: 'Missing value' }]}
                  >
                    <Input placeholder="Value" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'unit']}
                    rules={[{ required: true, message: 'Missing unit' }]}
                  >
                    <Input placeholder="Unit" />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Observation
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}
