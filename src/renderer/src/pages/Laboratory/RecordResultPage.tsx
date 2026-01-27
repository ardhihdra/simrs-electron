import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Button, Card, Form, Input, Select, Space, Spin, message } from 'antd'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLaboratoryActions } from './useLaboratoryActions'

export default function RecordResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const { data, isLoading } = client.laboratory.listEncounters.useQuery({ id })
  const encounter = data?.result?.[0] || data?.result || data

  const { handleRecordResult, loading } = useLaboratoryActions(() => {
    message.success('Result recorded successfully')
    navigate('/dashboard/laboratory/list')
  })

  // Set default values when encounter loads
  useEffect(() => {
    if (encounter) {
      // You could pre-fill info here if needed
    }
  }, [encounter])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await handleRecordResult({
        serviceRequestId: values.serviceRequestId,
        encounterId: encounter.id,
        patientId: encounter.patientId,
        observations: values.observations.map((obs: any) => ({
          ...obs,
          interpretation: obs.interpretation || 'NORMAL' // Default to NORMAL if not selected
        }))
      })
    } catch (error) {
      console.error(error)
    }
  }

  if (isLoading || !encounter) {
    return <Spin />
  }

  const requests = encounter?.labServiceRequests || []

  return (
    <div className="p-4">
      <Card title={`Record Result for ${encounter.patient?.name || 'Patient'}`}>
        <Form form={form} layout="vertical">
          <Form.Item name="serviceRequestId" label="Lab Order" rules={[{ required: true }]}>
            <Select
              options={requests.map((r: any) => ({
                label: `${r.testCode?.display || r.testCode?.name || r.testCodeId} (${r.priority})`,
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
                    <Form.Item {...restField} name={[name, 'referenceRange']}>
                      <Input placeholder="Ref. Range" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'interpretation']}>
                      <Select
                        placeholder="Interpretation"
                        style={{ width: 120 }}
                        options={[
                          { value: 'NORMAL', label: 'Normal' },
                          { value: 'HIGH', label: 'High' },
                          { value: 'LOW', label: 'Low' },
                          { value: 'ABNORMAL', label: 'Abnormal' },
                          { value: 'CRITICAL_HIGH', label: 'Critical High' },
                          { value: 'CRITICAL_LOW', label: 'Critical Low' }
                        ]}
                      />
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

          <Space>
            <Button type="primary" onClick={handleSubmit} loading={loading === 'record-result'}>
              Submit Result
            </Button>
            <Button onClick={() => navigate('/dashboard/laboratory/list')}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}
