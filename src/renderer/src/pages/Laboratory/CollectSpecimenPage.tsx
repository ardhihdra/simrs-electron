import { client } from '@renderer/utils/client'
import { Button, Card, Form, Select, Spin, message } from 'antd'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLaboratoryActions } from './useLaboratoryActions'

export default function CollectSpecimenPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const { data, isLoading } = client.laboratory.listEncounters.useQuery({ id })
  const encounter = data?.result?.[0] || data?.result || data

  const { handleCollectSpecimen, loading } = useLaboratoryActions(() => {
    message.success('Specimen collected successfully')
    navigate('/dashboard/laboratory/list')
  })

  // Set default values when encounter loads
  useEffect(() => {
    if (encounter) {
      const requests = encounter.labServiceRequests || []
      if (requests.length > 0) {
        form.setFieldsValue({
          serviceRequestId: requests[0].id
        })
      }
    }
  }, [encounter, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await handleCollectSpecimen({
        serviceRequestId: values.serviceRequestId,
        typeCodeId: values.typeCodeId
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
      <Card title={`Collect Specimen for ${encounter.patient?.name || 'Patient'}`}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="serviceRequestId"
            label="Lab Order"
            rules={[{ required: true, message: 'Select an order' }]}
          >
            <Select
              options={requests.map((r: any) => ({
                label: `${r.testCode?.display || r.testCode?.name || r.testCodeId} (${r.priority})`,
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

          <Button type="primary" onClick={handleSubmit} loading={loading === 'collect-specimen'}>
            Submit Specimen
          </Button>
          <Button onClick={() => navigate('/dashboard/laboratory/list')} className="ml-2">
            Cancel
          </Button>
        </Form>
      </Card>
    </div>
  )
}
