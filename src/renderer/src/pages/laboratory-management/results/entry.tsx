import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Select, Typography, Upload, message, Space } from 'antd'
import { useLocation, useNavigate } from 'react-router'
import { useLaboratoryActions } from '@renderer/pages/Laboratory/useLaboratoryActions'
import { client } from '@renderer/utils/client'
import { useEffect } from 'react'


const { Title, Text } = Typography

export default function RecordResultPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const record = location.state as any
    const [form] = Form.useForm()

    // Terminology Data for Unit and Domain Check
    const { data: terminologyData } = client.laboratoryManagement.searchTerminology.useQuery(
        {
            query: record.test?.code || '',
            // domain: 'laboratory', // Search all domains to find if it is radiology
            limit: 1
        },
        {
            enabled: !!record.test?.code,
            queryKey: ['search-terminology', { query: record.test?.code, limit: 1 }]
        }
    )

    const terminologyItem = terminologyData?.result?.[0] as any

    useEffect(() => {
        if (terminologyItem) {
             // Verify exact match if possible, though search by code should be specific enough
            if (terminologyItem.loinc === record.test?.code && terminologyItem.ucum) {
                form.setFieldsValue({
                    unit: terminologyItem.ucum
                })
            }
        }
    }, [terminologyItem, form, record.test?.code])

    const { handleRecordResult, loading } = useLaboratoryActions(() => {
        message.success('Result recorded successfully')
        navigate('/dashboard/laboratory-management/requests')
    })
    
    // Add Radiology RPC
    const { mutateAsync: recordRadiology, isPending: isUploading } = client.laboratoryManagement.recordRadiologyResult.useMutation({
        onSuccess: () => {
            message.success('Radiology result recorded successfully')
            navigate('/dashboard/laboratory-management/requests')
        },
        onError: (err) => {
            message.error(err.message)
        }
    })

    // Helper for Upload in Form
    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e
        }
        return e?.fileList
    }

    const beforeUpload = () => {
        return false // Prevent automatic upload
    }
    
    // Determine if Radiology based on context/props.
    // Try multiple indicators: category, name, or code prefix
    const isRadiology = 
        record?.test?.category === 'RADIOLOGY' || 
        terminologyItem?.domain === 'radiology' || // Check from terminology
        record?.test?.name?.toLowerCase().includes('x-ray') ||
        record?.test?.name?.toLowerCase().includes('ct scan') ||
        record?.test?.code?.startsWith('RAD') ||
        record?.modality // In case we passed it explicitly
        
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()

            if (isRadiology) {
                // Radiology Logic
                 const fileList = values.files || []
                 const filesBase64: string[] = []
                 
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
                
                await recordRadiology({
                    serviceRequestId: record.id,
                    encounterId: record.encounterId,
                    patientId: record.patientId,
                    modalityCode: values.modalityCode,
                    started: new Date().toISOString(), // Or from input
                    findings: values.findings,
                    files: filesBase64
                })

            } else {
                // Lab Logic
                await handleRecordResult({
                    serviceRequestId: record.id,
                    encounterId: record.encounterId,
                    patientId: record.patientId,
                    observations: [{
                        observationCodeId: record.testCodeId || record.test?.id,
                        value: values.value,
                        unit: values.unit,
                        referenceRange: values.referenceRange,
                        interpretation: values.interpretation || 'NORMAL',
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
                        <Title level={5}>{record.patient?.name}</Title>
                        <Text>{record.patient?.mrn}</Text>
                    </div>
                    <div>
                        <Text type="secondary">Pemeriksaan</Text>
                        <Title level={5}>{record.testDisplay || record.test?.name}</Title>
                        <Text>{record.test?.code}</Text>
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
                        <Button type="primary" onClick={handleSubmit} loading={loading === 'record-result' || isUploading}>
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

