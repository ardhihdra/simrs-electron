import { ArrowLeftOutlined, CloudDownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { useLaboratoryActions } from '@renderer/pages/Laboratory/useLaboratoryActions'
import { client, rpc } from '@renderer/utils/client'
import { hasValidationErrors, notifyFormValidationError } from '@renderer/utils/form-feedback'
import {
  buildReferenceRangeString,
  getAgeInDays,
  getInterpretationFromReferenceRange,
  type NilaiRujukanEntry,
  pickBestNilaiRujukan
} from '@renderer/utils/laboratory-interpretation'
import { App, Button, Card, Form, Input, Radio, Select, Spin, Tag, Typography, Upload } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { resolveAncillaryRouteBase } from '../section-config'

type DicomSourceMode = 'upload' | 'modality'

//  Do we actually need Abnormal, Critical High/Low? if so add it as
const interpretationMap: Record<string, string> = {
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  LOW: 'LOW',
  ABNORMAL: 'CRITICAL',
  CRITICAL_HIGH: 'CRITICAL',
  CRITICAL_LOW: 'CRITICAL'
}

const { Title, Text } = Typography

export default function RecordResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const record = location.state as Record<string, unknown> | null
  const sectionRouteBase =
    String(record?.sectionRouteBase || '') || resolveAncillaryRouteBase(location.pathname)
  const rec = record as Record<string, unknown>
  const testObj = rec?.test as Record<string, string> | undefined
  const [form] = Form.useForm()
  const [dicomSourceMode, setDicomSourceMode] = useState<DicomSourceMode>('modality')
  const [selectedStudyUid, setSelectedStudyUid] = useState<string | undefined>(undefined)

  // Terminology Data for Unit and Domain Check
  const { data: terminologyData } = client.laboratoryManagement.getServiceRequestCodes.useQuery(
    { loincCode: (record?.test as any)?.code || '' },
    {
      enabled: !!(record?.test as any)?.code,
      queryKey: ['service-request-code-by-loinc', (record?.test as any)?.code]
    }
  )

  const terminologyResult = (terminologyData as Record<string, unknown>)?.result as
    | { laboratory?: Record<string, unknown>[]; radiology?: Record<string, unknown>[] }
    | undefined
  const firstTermItem = terminologyResult?.laboratory?.[0] ?? terminologyResult?.radiology?.[0]
  const terminologyDomain = (
    (firstTermItem?.domain as string | undefined) === 'radiology' ? 'radiology' : 'laboratory'
  ) as 'laboratory' | 'radiology'

  const { data: unitData, isLoading: isLoadingUnits } =
    client.laboratoryManagement.getUnits.useQuery(
      {
        loincCode: (record?.test as any)?.code || '',
        domain: terminologyDomain
      },
      {
        enabled: !!(record?.test as any)?.code,
        queryKey: [
          'terminology-units-by-loinc',
          { loincCode: (record?.test as any)?.code, domain: terminologyDomain }
        ]
      }
    )

  const unitOptions = (
    ((unitData as Record<string, unknown>)?.result as Record<string, string>[] | undefined) ?? []
  ).map((item) => ({
    value: item.code,
    label: item.display
  }))
  const defaultUnit =
    (typeof (firstTermItem as Record<string, unknown> | undefined)?.ucum === 'string'
      ? ((firstTermItem as Record<string, string>).ucum as string)
      : undefined) || unitOptions[0]?.value
  const resultValue = Form.useWatch('value', form) as string | undefined
  const referenceRangeValue = Form.useWatch('referenceRange', form) as string | undefined

  const patientId = (record as Record<string, unknown>)?.patientId as string | undefined

  // Nilai Rujukan — fetch by masterServiceRequestCodeId (= firstTermItem.id)
  const masterServiceRequestCodeId = (firstTermItem as Record<string, unknown> | undefined)?.id as
    | number
    | undefined

  const { data: nilaiRujukanData } = client.laboratoryManagement.getNilaiRujukan.useQuery(
    { masterServiceRequestCodeId },
    {
      enabled: masterServiceRequestCodeId !== undefined,
      queryKey: ['nilai-rujukan', { masterServiceRequestCodeId }]
    }
  )

  // Fetch patient to get gender + birthDate for demographic filtering
  const { data: patientData } = client.patient.getById.useQuery(
    { id: patientId },
    { enabled: !!patientId, queryKey: ['patient-by-id', patientId] }
  )
  const patientRecord = (patientData as Record<string, unknown>)?.result as
    | Record<string, string>
    | undefined
  const patientGender = patientRecord?.gender
  const patientAgeInDays = getAgeInDays(patientRecord?.birthDate)

  const matchedNilaiRujukan = useMemo(() => {
    const all: NilaiRujukanEntry[] =
      ((nilaiRujukanData as Record<string, unknown>)?.result as NilaiRujukanEntry[]) ?? []
    return pickBestNilaiRujukan(all, patientGender, patientAgeInDays)
  }, [nilaiRujukanData, patientGender, patientAgeInDays])

  const matchedReferenceRange = matchedNilaiRujukan
    ? buildReferenceRangeString(matchedNilaiRujukan)
    : undefined
  const matchedUnit = matchedNilaiRujukan?.unit ?? undefined

  // PACS study search — generic, autofills with patientId on mount
  const [pacsSearchParams, setPacsSearchParams] = useState<{
    patientId?: string
    patientName?: string
  }>({ patientId })
  const { data: pacsStudiesData, isLoading: isLoadingPacsStudies } =
    client.laboratoryManagement.searchPacsStudies.useQuery(pacsSearchParams, {
      enabled: dicomSourceMode === 'modality' && Object.values(pacsSearchParams).some(Boolean),
      queryKey: ['searchPacsStudies', pacsSearchParams]
    })
  const pacsStudies =
    ((pacsStudiesData as Record<string, unknown>)?.result as Record<string, unknown>[]) || []

  const { handleRecordResult, loading } = useLaboratoryActions(() => {
    message.success('Result recorded successfully')
    navigate(`${sectionRouteBase}/requests`)
  })

  // Add Radiology findings RPC
  const { mutateAsync: recordRadiology, isPending: isSavingFindings } =
    client.laboratoryManagement.recordRadiologyResult.useMutation({
      onError: (err) => {
        message.error(err.message)
      }
    })

  // Add Radiology DICOM Upload RPC
  const { mutateAsync: uploadRadiologyDicom, isPending: isUploading } =
    client.laboratoryManagement.uploadRadiologyDicom.useMutation({
      onError: (err) => {
        message.error(err.message)
      }
    })

  // Helper for Upload in Form
  const normFile = (e: { fileList?: unknown[] } | unknown[]) => {
    if (Array.isArray(e)) {
      return e
    }
    return (e as { fileList?: unknown[] })?.fileList
  }

  const beforeUpload = () => {
    return false // Prevent automatic upload
  }

  // Determine if Radiology based on context/props.
  // Try multiple indicators: category, name, or code prefix
  const isRadiology =
    testObj?.category === 'RADIOLOGY' ||
    firstTermItem?.domain === 'radiology' ||
    testObj?.name?.toLowerCase().includes('x-ray') ||
    testObj?.name?.toLowerCase().includes('ct scan') ||
    testObj?.code?.startsWith('RAD') ||
    rec?.modality

  useEffect(() => {
    if (isRadiology) return

    const currentUnit = form.getFieldValue('unit') as string | undefined
    if (currentUnit) return

    const unitToSet = matchedUnit || defaultUnit
    if (unitToSet) {
      form.setFieldsValue({ unit: unitToSet })
    }
  }, [defaultUnit, form, isRadiology, matchedUnit])

  // Prefill referenceRange from nilai rujukan when the field is empty
  useEffect(() => {
    if (isRadiology || !matchedReferenceRange) return

    const current = form.getFieldValue('referenceRange') as string | undefined
    if (!current) {
      form.setFieldsValue({ referenceRange: matchedReferenceRange })
    }
  }, [form, isRadiology, matchedReferenceRange])

  useEffect(() => {
    if (isRadiology) {
      return
    }

    const nextInterpretation = getInterpretationFromReferenceRange(resultValue, referenceRangeValue)
    if (!nextInterpretation) {
      return
    }

    const currentInterpretation = form.getFieldValue('interpretation') as string | undefined
    if (currentInterpretation !== nextInterpretation) {
      form.setFieldValue('interpretation', nextInterpretation)
    }
  }, [form, isRadiology, referenceRangeValue, resultValue])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const serviceRequestId = String(rec.requestId || rec.id || '')
      const encounterId = String(rec.encounterId || '')

      const ensureEncounterInProgress = async () => {
        if (!encounterId) return

        const encounterResponse = await rpc.query.entity({
          model: 'encounter',
          path: encounterId,
          method: 'get'
        })

        if (!encounterResponse?.success) {
          return
        }

        const currentStatus = String(encounterResponse?.result?.status || '').toUpperCase()
        if (currentStatus !== 'PLANNED') {
          return
        }

        await rpc.query.entity({
          model: 'encounter',
          path: encounterId,
          method: 'put',
          body: {
            status: 'IN_PROGRESS'
          }
        })
      }

      if (isRadiology) {
        // Radiology Logic
        let returnedStudyInstanceUid: string | undefined = selectedStudyUid

        if (dicomSourceMode === 'upload') {
          // Upload flow
          const fileList = (values.files || []) as { originFileObj?: File }[]
          const filesBase64: string[] = []

          if (fileList.length > 0) {
            for (const fileItem of fileList) {
              const fileObj = fileItem.originFileObj
              if (fileObj) {
                const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader()
                  reader.readAsDataURL(fileObj)
                  reader.onload = () => resolve(reader.result as string)
                  reader.onerror = (error) => reject(error)
                })
                filesBase64.push(base64)
              }
            }

            try {
              const uploadParams = {
                patientId: rec.patientId as string,
                encounterId: rec.encounterId as string,
                uploadedBy: 'user-system',
                source: 'MANUAL',
                files: filesBase64
              }

              const data = (await uploadRadiologyDicom(uploadParams)) as Record<string, unknown>

              if (data && data.success === false) {
                message.error((data.message as string) || 'Failed to upload DICOM files')
                return
              }

              returnedStudyInstanceUid = (data.result as Record<string, string>)?.studyInstanceUID
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Upload failed'
              message.error(errorMessage)
              return
            }
          }
        }

        // Record the findings
        await recordRadiology({
          serviceRequestId,
          encounterId,
          patientId: rec.patientId as string,
          modalityCode: values.modalityCode as string,
          started: new Date().toISOString(),
          findings: values.findings as string,
          studyInstanceUid: returnedStudyInstanceUid
        })

        await ensureEncounterInProgress()
        message.success('Radiology result recorded successfully')
        navigate(`${sectionRouteBase}/requests`)
      } else {
        // Lab Logic
        const observationCodeId = String(rec.testCodeId || testObj?.code || '')

        if (!serviceRequestId) {
          message.error('Service request ID tidak ditemukan')
          return
        }

        if (!observationCodeId) {
          message.error('Kode pemeriksaan tidak ditemukan')
          return
        }

        await handleRecordResult({
          serviceRequestId,
          encounterId,
          patientId: rec.patientId as string,
          observations: [
            {
              observationCodeId,
              value: values.value as string,
              unit: values.unit as string,
              referenceRange: values.referenceRange as string,
              interpretation:
                (interpretationMap[String(values.interpretation || 'NORMAL')] as any) || 'NORMAL',
              observedAt: new Date().toISOString()
            }
          ]
        })
      }
    } catch (error: any) {
      console.error(error)
      if (hasValidationErrors(error)) {
        notifyFormValidationError(form, message, error, 'Form hasil pemeriksaan belum lengkap.')
        return
      }
      message.error(error?.message || 'Gagal menyimpan hasil pemeriksaan')
    }
  }

  if (!record) {
    return (
      <div className="p-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div className="mt-4">No record selected</div>
      </div>
    )
  }

  console.log(nilaiRujukanData)
  return (
    <div className="p-4">
      <div className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      <Card title="Input Hasil Pemeriksaan">
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <Text type="secondary">Pasien</Text>
            <Title level={5}>{(rec.patient as Record<string, string>)?.name}</Title>
            <Text>{(rec.patient as Record<string, string>)?.mrn}</Text>
          </div>
          <div>
            <Text type="secondary">Pemeriksaan</Text>
            <Title level={5}>{(rec.testDisplay as string) || testObj?.name}</Title>
            <Text>{testObj?.code}</Text>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFinishFailed={(errorInfo) =>
            notifyFormValidationError(
              form,
              message,
              errorInfo,
              'Form hasil pemeriksaan belum lengkap.'
            )
          }
        >
          {isRadiology ? (
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

              {/* DICOM Source Toggle */}
              <Form.Item label="DICOM Source">
                <Radio.Group
                  value={dicomSourceMode}
                  onChange={(e) => {
                    setDicomSourceMode(e.target.value)
                    setSelectedStudyUid(undefined)
                  }}
                >
                  <Radio.Button value="modality">
                    <CloudDownloadOutlined /> Select from Modality
                  </Radio.Button>
                  <Radio.Button value="upload">
                    <UploadOutlined /> Upload File
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              {dicomSourceMode === 'modality' ? (
                <div>
                  <Form.Item label="Search PACS Studies">
                    <Input.Search
                      placeholder="Search by patient name..."
                      allowClear
                      onSearch={(value) => {
                        if (value.trim()) {
                          setPacsSearchParams({ patientName: value.trim() })
                        } else {
                          setPacsSearchParams({ patientId })
                        }
                      }}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setPacsSearchParams({ patientId })
                        }
                      }}
                      enterButton
                      loading={isLoadingPacsStudies}
                    />
                  </Form.Item>

                  {isLoadingPacsStudies ? (
                    <div className="text-center py-4">
                      <Spin />
                    </div>
                  ) : pacsStudies.length > 0 ? (
                    <div className="mb-4">
                      <Card title="Result from PACS">
                        {' '}
                        <Radio.Group
                          value={selectedStudyUid}
                          onChange={(e) => setSelectedStudyUid(e.target.value)}
                          className="w-full"
                        >
                          <div className="flex flex-col gap-2">
                            {pacsStudies.map((study: Record<string, unknown>) => (
                              <Radio
                                key={study.studyInstanceUID as string}
                                value={study.studyInstanceUID as string}
                                className="w-full"
                              >
                                <div>
                                  <Text strong>{study.modality as string}</Text>
                                  {' — '}
                                  <Text>{study.studyDate as string}</Text>
                                  {' — '}
                                  <Text>{(study.patientName as string) || 'Unknown'}</Text>
                                  <br />
                                  <Text type="secondary">
                                    {(study.studyDescription as string) || 'No description'}
                                    {' · '}
                                    {study.numberOfInstances as number} images
                                  </Text>
                                </div>
                              </Radio>
                            ))}
                          </div>
                        </Radio.Group>
                      </Card>
                    </div>
                  ) : (
                    <Text type="secondary">No studies found in PACS</Text>
                  )}
                </div>
              ) : (
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
                    multiple
                    maxCount={10}
                  >
                    <Button icon={<UploadOutlined />}>Click to select file</Button>
                  </Upload>
                </Form.Item>
              )}
            </>
          ) : (
            <>
              {/* Single Observation Entry for the requested Test */}
              <Form.Item
                name="value"
                label="Nilai / Hasil"
                rules={[{ required: true, message: 'Missing value' }]}
              >
                <Input placeholder="Nilai" />
              </Form.Item>

              {matchedNilaiRujukan && (
                <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200 text-sm text-blue-700 flex flex-wrap gap-2 items-center">
                  <span className="font-medium">Nilai Rujukan:</span>
                  <span>{matchedReferenceRange}</span>
                  {matchedUnit && <Tag color="blue">{matchedUnit}</Tag>}
                  {matchedNilaiRujukan.gender && (
                    <Tag color="purple">
                      {matchedNilaiRujukan.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                    </Tag>
                  )}
                  {matchedNilaiRujukan.note && (
                    <span className="text-blue-500 italic">{matchedNilaiRujukan.note}</span>
                  )}
                  <span>Brand: {matchedNilaiRujukan.machineBrand ?? '-'}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Form.Item name="unit" label="Satuan">
                  <Select
                    showSearch
                    allowClear
                    loading={isLoadingUnits}
                    placeholder={isLoadingUnits ? 'Memuat satuan...' : 'Pilih satuan'}
                    options={unitOptions}
                    optionFilterProp="label"
                    notFoundContent={
                      isLoadingUnits ? <Spin size="small" /> : 'Satuan tidak tersedia'
                    }
                  />
                </Form.Item>
                <Form.Item name="referenceRange" label="Nilai Rujukan">
                  <Input placeholder="Nilai Rujukan" />
                </Form.Item>
                <Form.Item name="interpretation" label="Interpretasi">
                  <Select
                    placeholder="Interpretasi"
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
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading === 'record-result' || isSavingFindings || isUploading}
            >
              Simpan Hasil
            </Button>
            <Button onClick={() => navigate(-1)}>Batal</Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
