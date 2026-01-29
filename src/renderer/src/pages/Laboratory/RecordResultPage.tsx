import { MinusCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Button, Card, Form, Input, Select, Space, Spin, Upload, message } from 'antd'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLaboratoryActions } from './useLaboratoryActions'

export default function RecordResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const selectedRequestId = Form.useWatch('serviceRequestId', form)

  const { data, isLoading } = client.laboratory.listEncounters.useQuery({ id })
  const encounter = data?.result?.[0] || data?.result || data
  const requests = encounter?.labServiceRequests || []
  const selectedRequest = requests.find((r: any) => r.id === selectedRequestId)

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

  // Helper for Upload in Form
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e
    }
    return e?.fileList
  }

  // We no longer need customUploadRequest because the RPC handles the upload.
  // We just need to keep the file in the form state as a JS File object.
  const beforeUpload = () => {
    // Return false to prevent automatic upload
    return false
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (selectedRequest?.category === 'RADIOLOGY') {
        const fileObj = values.files && values.files[0] ? values.files[0].originFileObj : null

        let fileData: any = {}
        if (fileObj) {
          fileData = {
            file: await fileObj.arrayBuffer().then((buff: ArrayBuffer) => new Uint8Array(buff)),
            filename: fileObj.name,
            mimetype: fileObj.type
          }
        }

        await handleRecordResult({
          serviceRequestId: values.serviceRequestId,
          encounterId: encounter.id,
          patientId: encounter.patientId,
          modalityCode: values.modalityCode,
          started: values.started,
          findings: values.findings,
          // If we have a file, pass it to the RPC which will upload it and add the path to payload
          ...fileData
          // filePaths: ... // This will be populated by the RPC internally if file exists
        })
      } else {
        await handleRecordResult({
          serviceRequestId: values.serviceRequestId,
          encounterId: encounter.id,
          patientId: encounter.patientId,
          observations: values.observations.map((obs: any) => ({
            ...obs,
            interpretation: obs.interpretation || 'NORMAL' // Default to NORMAL if not selected
          }))
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  if (isLoading || !encounter) {
    return <Spin />
  }

  // const requests defined above but depends on encounter which is loaded after isLoading check
  // Moving requests definition down or handle undefined safely.
  // Actually requests need to be defined before return.
  // I will redefine it after loading check to be safe, or just use the one above if safe.
  // The 'requests' used in return is the one defined above?
  // Wait, I defined 'requests' above but 'encounter' is potentially null/undefined there.
  // Just rely on empty array fallback.

  return (
    <div className="p-4">
      <Card title={`Record Result for ${encounter.patient?.name || 'Patient'}`}>
        <Form form={form} layout="vertical">
          <Form.Item name="serviceRequestId" label="Lab Order" rules={[{ required: true }]}>
            <Select
              options={requests
                .filter((r: any) => r.status !== 'COMPLETED')
                .map((r: any) => {
                  return {
                    label: `${r.serviceCode?.display || r.serviceCode?.name || r.serviceCodeId || r.testCodeId} (${r.priority})`,
                    value: r.id
                  }
                })}
            />
          </Form.Item>

          {selectedRequest?.category === 'RADIOLOGY' ? (
            <>
              <Form.Item
                name="modalityCode"
                label="Modality"
                rules={[{ required: true, message: 'Missing modality' }]}
              >
                <Input placeholder="e.g. DX, CT, MR" />
              </Form.Item>
              <Form.Item
                name="findings"
                label="Findings / Conclusion"
                rules={[{ required: true, message: 'Missing findings' }]}
              >
                <Input.TextArea rows={6} placeholder="Enter radiology report findings..." />
              </Form.Item>
              <Form.Item name="started" label="Started At" initialValue={new Date().toISOString()}>
                <Input />
              </Form.Item>
              <Form.Item
                name="files"
                label="Images / Documents"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  name="file"
                  beforeUpload={beforeUpload}
                  listType="picture"
                  maxCount={1} // RPC only supports 1 file for now based on implementation
                >
                  <Button icon={<UploadOutlined />}>Click to select file</Button>
                </Upload>
              </Form.Item>
            </>
          ) : (
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
          )}

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
