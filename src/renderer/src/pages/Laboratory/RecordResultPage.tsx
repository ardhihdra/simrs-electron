import { MinusCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import {
  buildReferenceRangeString,
  getAgeInDays,
  getInterpretationFromReferenceRange,
  type NilaiRujukanEntry,
  pickBestNilaiRujukan
} from '@renderer/utils/laboratory-interpretation'
import { Button, Card, Form, Input, Select, Space, Spin, Tag, Upload, message } from 'antd'
import { useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useLaboratoryActions } from './useLaboratoryActions'

export default function RecordResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const selectedRequestId = Form.useWatch('serviceRequestId', form)
  const observations = Form.useWatch('observations', form)

  const { data, isLoading } = client.laboratory.listEncounters.useQuery({ id })
  const encounter = data?.result?.[0] || data?.result || data
  const requests = encounter?.labServiceRequests || []
  const selectedRequest = requests.find((r: any) => r.id === selectedRequestId)

  const masterServiceRequestCodeId: number | undefined =
    selectedRequest?.serviceCode?.masterServiceRequestCodeId

  const patientGender: string | undefined = encounter?.patient?.gender
  const patientAgeInDays: number | undefined = getAgeInDays(encounter?.patient?.birthDate)

  // Fetch nilai rujukan for the selected test code
  const { data: nilaiRujukanData } = client.laboratoryManagement.getNilaiRujukan.useQuery(
    { masterServiceRequestCodeId },
    {
      enabled: masterServiceRequestCodeId !== undefined,
      queryKey: ['nilai-rujukan', { masterServiceRequestCodeId }]
    }
  )

  // Pick the best matching entry for this patient
  const matchedEntry = useMemo(() => {
    const all: NilaiRujukanEntry[] = (nilaiRujukanData as any)?.result ?? []
    return pickBestNilaiRujukan(all, patientGender, patientAgeInDays)
  }, [nilaiRujukanData, patientGender, patientAgeInDays])

  const matchedReferenceRange = matchedEntry
    ? buildReferenceRangeString(matchedEntry)
    : undefined
  const matchedUnit = matchedEntry?.unit ?? undefined

  const { handleRecordResult, loading } = useLaboratoryActions(() => {
    message.success('Result recorded successfully')
    navigate('/dashboard/laboratory/list')
  })

  // Auto-interpret observations based on value and reference range
  useEffect(() => {
    if (!observations?.length) return

    let hasChanges = false
    const updated = observations.map((obs: any) => {
      if (!obs) return obs
      const nextInterpretation = getInterpretationFromReferenceRange(obs.value, obs.referenceRange)
      if (!nextInterpretation || obs.interpretation === nextInterpretation) return obs
      hasChanges = true
      return { ...obs, interpretation: nextInterpretation }
    })

    if (hasChanges) {
      form.setFieldValue('observations', updated)
    }
  }, [form, observations])

  // Helper for Upload in Form
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e
    }
    return e?.fileList
  }

  const beforeUpload = () => {
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
          ...fileData
        })
      } else {
        await handleRecordResult({
          serviceRequestId: values.serviceRequestId,
          encounterId: encounter.id,
          patientId: encounter.patientId,
          observations: values.observations.map((obs: any) => ({
            ...obs,
            interpretation: obs.interpretation || 'NORMAL'
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

  return (
    <div className="p-4">
      <Card title={`Record Result for ${encounter.patient?.name || 'Patient'}`}>
        <Form form={form} layout="vertical">
          <Form.Item name="serviceRequestId" label="Lab Order" rules={[{ required: true }]}>
            <Select
              options={requests
                .filter((r: any) => r.status !== 'COMPLETED')
                .map((r: any) => ({
                  label: `${r.serviceCode?.display || r.serviceCode?.name || r.serviceCodeId || r.testCodeId} (${r.priority})`,
                  value: r.id
                }))}
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
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>Click to select file</Button>
                </Upload>
              </Form.Item>
            </>
          ) : (
            <>
              {matchedEntry && (
                <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200 text-sm text-blue-700 flex flex-wrap gap-2 items-center">
                  <span className="font-medium">Nilai Rujukan:</span>
                  <span>{matchedReferenceRange}</span>
                  {matchedUnit && <Tag color="blue">{matchedUnit}</Tag>}
                  {matchedEntry.gender && (
                    <Tag color="purple">{matchedEntry.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</Tag>
                  )}
                  {matchedEntry.note && (
                    <span className="text-blue-500 italic">{matchedEntry.note}</span>
                  )}
                </div>
              )}

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
                            placeholder="Interpretasi"
                            style={{ width: 130 }}
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
                      <Button
                        type="dashed"
                        onClick={() =>
                          add({
                            referenceRange: matchedReferenceRange,
                            unit: matchedUnit
                          })
                        }
                        block
                        icon={<PlusOutlined />}
                      >
                        Add Observation
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </>
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
