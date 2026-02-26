import { ArrowLeftOutlined, CloudDownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Radio, Select, Spin, Typography, Upload, message } from 'antd'
import { useLocation, useNavigate } from 'react-router'
import { useLaboratoryActions } from '@renderer/pages/Laboratory/useLaboratoryActions'
import { client } from '@renderer/utils/client'
import { useEffect, useState } from 'react'

type DicomSourceMode = 'upload' | 'modality'


const { Title, Text } = Typography

export default function RecordResultPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const record = location.state as Record<string, unknown> | null
    const [form] = Form.useForm()
    const [dicomSourceMode, setDicomSourceMode] = useState<DicomSourceMode>('modality')
    const [selectedStudyUid, setSelectedStudyUid] = useState<string | undefined>(undefined)

    // Terminology Data for Unit and Domain Check
    const { data: terminologyData } = client.laboratoryManagement.searchTerminology.useQuery(
        {
            query: (record?.test as any).code || '',
            // domain: 'laboratory', // Search all domains to find if it is radiology
            limit: 1
        },
        {
            enabled: !!(record?.test as any)?.code,
            queryKey: ['search-terminology', { query: (record?.test as any)?.code, limit: 1 }]
        }
    )

    const terminologyItem = (terminologyData as Record<string, unknown>)?.result as Record<string, unknown> | undefined
    const firstTermItem = Array.isArray(terminologyItem) ? terminologyItem[0] as Record<string, unknown> | undefined : undefined

    // PACS study search — generic, autofills with patientId on mount
    const patientId = (record as Record<string, unknown>)?.patientId as string | undefined
    const [pacsSearchParams, setPacsSearchParams] = useState<{ patientId?: string; patientName?: string }>({ patientId })
    const { data: pacsStudiesData, isLoading: isLoadingPacsStudies } = client.laboratoryManagement.searchPacsStudies.useQuery(
        pacsSearchParams,
        {
            enabled: dicomSourceMode === 'modality' && Object.values(pacsSearchParams).some(Boolean),
            queryKey: ['searchPacsStudies', pacsSearchParams]
        }
    )
    const pacsStudies = ((pacsStudiesData as Record<string, unknown>)?.result as Record<string, unknown>[]) || []



    useEffect(() => {
        if (firstTermItem) {
            if (firstTermItem.loinc === (record as Record<string, unknown>)?.test && (firstTermItem as Record<string, string>).ucum) {
                form.setFieldsValue({
                    unit: (firstTermItem as Record<string, string>).ucum
                })
            }
        }
    }, [firstTermItem, form, record])

    const { handleRecordResult, loading } = useLaboratoryActions(() => {
        message.success('Result recorded successfully')
        navigate('/dashboard/laboratory-management/requests')
    })
    
    // Add Radiology findings RPC
    const { mutateAsync: recordRadiology, isPending: isSavingFindings } = client.laboratoryManagement.recordRadiologyResult.useMutation({
        onSuccess: () => {
            message.success('Radiology result recorded successfully')
            navigate('/dashboard/laboratory-management/requests')
        },
        onError: (err) => {
            message.error(err.message)
        }
    })

    // Add Radiology DICOM Upload RPC
    const { mutateAsync: uploadRadiologyDicom, isPending: isUploading } = client.laboratoryManagement.uploadRadiologyDicom.useMutation({
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
    const rec = record as Record<string, unknown>
    const testObj = rec?.test as Record<string, string> | undefined
    const isRadiology = 
        testObj?.category === 'RADIOLOGY' || 
        firstTermItem?.domain === 'radiology' ||
        testObj?.name?.toLowerCase().includes('x-ray') ||
        testObj?.name?.toLowerCase().includes('ct scan') ||
        testObj?.code?.startsWith('RAD') ||
        rec?.modality
        
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (isRadiology) {
                // Radiology Logic
                let returnedStudyInstanceUid: string | undefined = selectedStudyUid;

                if (dicomSourceMode === 'upload') {
                    // Upload flow
                    const fileList = (values.files || []) as { originFileObj?: File }[]
                    const filesBase64: string[] = []
                    
                    if (fileList.length > 0) {
                        for (const fileItem of fileList) {
                            const fileObj = fileItem.originFileObj
                            if (fileObj) {
                                const base64 = await new Promise<string>((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.readAsDataURL(fileObj);
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.onerror = error => reject(error);
                                });
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

                            const data = await uploadRadiologyDicom(uploadParams) as Record<string, unknown>
                            
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
                    serviceRequestId: rec.id as string,
                    encounterId: rec.encounterId as string,
                    patientId: rec.patientId as string,
                    modalityCode: values.modalityCode as string,
                    started: new Date().toISOString(),
                    findings: values.findings as string,
                    studyInstanceUid: returnedStudyInstanceUid
                })

            } else {
                // Lab Logic
                await handleRecordResult({
                    serviceRequestId: rec.id as string,
                    encounterId: rec.encounterId as string,
                    patientId: rec.patientId as string,
                    observations: [{
                        observationCodeId: (rec.testCodeId as string) || testObj?.id || '',
                        value: values.value as string,
                        unit: values.unit as string,
                        referenceRange: values.referenceRange as string,
                        interpretation: (values.interpretation as string) || 'NORMAL',
                        observedAt: new Date().toISOString()
                    }]
                })
            }
        } catch (error) {
            console.error(error)
        }
    } 

    if (!record) {
        return (
            <div className="p-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
                <div className="mt-4">No record selected</div>
            </div>
        )
    }
    console.log("RECORD", record)

    return (
        <div className="p-4">
            <div className="mb-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
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

                <Form form={form} layout="vertical">
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
                                <Radio.Group value={dicomSourceMode} onChange={(e) => { setDicomSourceMode(e.target.value); setSelectedStudyUid(undefined) }}>
                                    <Radio.Button value="modality"><CloudDownloadOutlined /> Select from Modality</Radio.Button>
                                    <Radio.Button value="upload"><UploadOutlined /> Upload File</Radio.Button>
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
                                        <div className="text-center py-4"><Spin /></div>
                                    ) : pacsStudies.length > 0 ? (
                                     <div className="mb-4">
                                         <Card title="Result from PACS">   <Radio.Group
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
                                                                    {' · '}{study.numberOfInstances as number} images
                                                                </Text>
                                                            </div>
                                                        </Radio>
                                                    ))}
                                                </div>
                                            </Radio.Group></Card>
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

                            <div className="grid grid-cols-3 gap-4">
                                <Form.Item
                                    name="unit"
                                    label="Satuan"
                                >
                                    <Input placeholder="Satuan" />
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
                        <Button type="primary" onClick={handleSubmit} loading={loading === 'record-result' || isSavingFindings || isUploading}>
                            Simpan Hasil
                        </Button>
                        <Button onClick={() => navigate(-1)}>
                            Batal
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    )
}

