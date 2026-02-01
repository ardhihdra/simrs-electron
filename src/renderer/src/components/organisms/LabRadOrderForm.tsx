import { useEffect, useState } from 'react'
import { Form, Button, Card, App, Spin, Tag, Space, Checkbox, Input, Select, Divider, Table } from 'antd'
import { SaveOutlined, ExperimentOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import { useServiceRequestByEncounter, useBulkCreateServiceRequest } from '../../hooks/query/use-service-request'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import dayjs from 'dayjs'

const { TextArea } = Input

interface LabRadOrderFormProps {
    encounterId: string
    patientData: PatientWithMedicalRecord
}

const LAB_TESTS = [
    { code: 'CBC', display: 'Complete Blood Count (Darah Lengkap)' },
    { code: 'FBG', display: 'Fasting Blood Glucose (Gula Darah Puasa)' },
    { code: 'RBG', display: 'Random Blood Glucose (Gula Darah Sewaktu)' },
    { code: 'LIPID', display: 'Lipid Profile (Kolesterol Total, LDL, HDL, Trigliserida)' },
    { code: 'LFT', display: 'Liver Function Test (SGOT, SGPT)' },
    { code: 'RFT', display: 'Kidney Function Test (Ureum, Kreatinin)' },
    { code: 'URINE', display: 'Urine Analysis (Urinalisis)' },
    { code: 'HBA1C', display: 'HbA1c (Gula Darah 3 Bulan)' },
    { code: 'ESR', display: 'ESR (Laju Endap Darah)' },
    { code: 'ELECTROLYTE', display: 'Elektrolit (Na, K, Cl)' }
]

const RAD_TESTS = [
    { code: 'CHEST-XRAY', display: 'Chest X-Ray AP/Lateral (Foto Thorax)' },
    { code: 'ABDOMEN-XRAY', display: 'Abdominal X-Ray (Foto Abdomen)' },
    { code: 'SKULL-XRAY', display: 'Skull X-Ray (Foto Kepala)' },
    { code: 'CT-HEAD', display: 'CT Scan Head (CT Kepala)' },
    { code: 'CT-CHEST', display: 'CT Scan Chest (CT Thorax)' },
    { code: 'CT-ABDOMEN', display: 'CT Scan Abdomen' },
    { code: 'MRI-BRAIN', display: 'MRI Brain (MRI Otak)' },
    { code: 'USG-ABDOMEN', display: 'USG Abdomen' },
    { code: 'USG-PELVIS', display: 'USG Pelvis' },
    { code: 'USG-OBSTETRIC', display: 'USG Obstetrik (Kehamilan)' }
]

const PRIORITY_OPTIONS = [
    { value: 'routine', label: 'Routine (Rutin)' },
    { value: 'urgent', label: 'Urgent (Mendesak)' },
    { value: 'asap', label: 'ASAP (Secepat Mungkin)' },
    { value: 'stat', label: 'STAT (Segera/Emergensi)' }
]

export const LabRadOrderForm = ({ encounterId, patientData }: LabRadOrderFormProps) => {
    const { message } = App.useApp()
    const [form] = Form.useForm()

    const [selectedLab, setSelectedLab] = useState<string[]>([])
    const [selectedRad, setSelectedRad] = useState<string[]>([])

    const { data: serviceRequestData, isLoading } = useServiceRequestByEncounter(encounterId)
    const bulkCreateMutation = useBulkCreateServiceRequest()

    useEffect(() => {
        if (serviceRequestData?.result) {
            const labOrders: string[] = []
            const radOrders: string[] = []

            serviceRequestData.result.forEach((sr: any) => {
                const category = sr.categories?.[0]?.code
                const code = sr.codes?.[0]?.code

                if (category === 'laboratory' && code) {
                    labOrders.push(code)
                } else if (category === 'imaging' && code) {
                    radOrders.push(code)
                }
            })

            setSelectedLab(labOrders)
            setSelectedRad(radOrders)
        }
    }, [serviceRequestData])

    const handleSubmit = async (values: any) => {
        const serviceRequests: any[] = []

        selectedLab.forEach(code => {
            const test = LAB_TESTS.find(t => t.code === code)
            if (test) {
                serviceRequests.push({
                    category: 'laboratory',
                    code: test.code,
                    display: test.display,
                    priority: values.priority || 'routine',
                    patientInstruction: values.labInstruction || null,
                    system: 'http://loinc.org'
                })
            }
        })

        selectedRad.forEach(code => {
            const test = RAD_TESTS.find(t => t.code === code)
            if (test) {
                serviceRequests.push({
                    category: 'imaging',
                    code: test.code,
                    display: test.display,
                    priority: values.priority || 'routine',
                    patientInstruction: values.radInstruction || null,
                    system: 'http://loinc.org'
                })
            }
        })

        if (serviceRequests.length === 0) {
            message.warning('Pilih minimal satu pemeriksaan lab atau radiologi')
            return
        }

        try {
            await bulkCreateMutation.mutateAsync({
                encounterId,
                patientId: patientData.patient.id,
                doctorId: 1, // TODO: Get from auth
                serviceRequests
            })

            message.success(`Berhasil membuat ${serviceRequests.length} permintaan pemeriksaan`)
        } catch (error) {
            console.error('Error saving service requests:', error)
            message.error('Gagal menyimpan permintaan pemeriksaan')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spin size="large" tip="Memuat Order Lab/Radiologi..." />
            </div>
        )
    }

    const existingOrders = serviceRequestData?.result || []
    const tableData = existingOrders.map((sr: any, index: number) => ({
        key: index,
        category: sr.categories?.[0]?.display || '-',
        test: sr.codes?.[0]?.display || '-',
        priority: sr.priority || 'routine',
        status: sr.status || 'active',
        instruction: sr.patientInstruction || '-',
        createdAt: sr.createdAt ? dayjs(sr.createdAt).format('DD/MM/YYYY HH:mm') : '-'
    }))

    const columns = [
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            render: (cat: string) => (
                <Tag color={cat === 'Laboratory' ? 'blue' : 'green'}>{cat}</Tag>
            )
        },
        {
            title: 'Pemeriksaan',
            dataIndex: 'test',
            key: 'test'
        },
        {
            title: 'Prioritas',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority: string) => {
                const colors: any = { routine: 'default', urgent: 'orange', asap: 'red', stat: 'red' }
                return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: any = { active: 'processing', completed: 'success', 'on-hold': 'warning' }
                return <Tag color={colors[status]}>{status}</Tag>
            }
        },
        {
            title: 'Instruksi Pasien',
            dataIndex: 'instruction',
            key: 'instruction'
        },
        {
            title: 'Waktu Order',
            dataIndex: 'createdAt',
            key: 'createdAt'
        }
    ]

    return (
        <div className="flex flex-col gap-4">
            {existingOrders.length > 0 && (
                <Card title="Order Pemeriksaan yang Sudah Ada">
                    <Table
                        dataSource={tableData}
                        columns={columns}
                        pagination={false}
                        size="small"
                    />
                </Card>
            )}

            <Form form={form} layout="vertical" onFinish={handleSubmit} className="flex flex-col gap-4">
                <Card
                    title={
                        <Space>
                            <ExperimentOutlined />
                            <span>Pemeriksaan Laboratorium</span>
                        </Space>
                    }
                >
                    <Checkbox.Group
                        value={selectedLab}
                        onChange={setSelectedLab as any}
                        className="w-full"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {LAB_TESTS.map(test => (
                                <Checkbox key={test.code} value={test.code}>
                                    {test.display}
                                </Checkbox>
                            ))}
                        </div>
                    </Checkbox.Group>

                    <Divider />

                    <Form.Item label="Instruksi untuk Pasien (Lab)" name="labInstruction">
                        <TextArea
                            rows={2}
                            placeholder="Contoh: Puasa 8-12 jam sebelum pengambilan darah"
                        />
                    </Form.Item>
                </Card>

                <Card
                    title={
                        <Space>
                            <MedicineBoxOutlined />
                            <span>Pemeriksaan Radiologi</span>
                        </Space>
                    }
                >
                    <Checkbox.Group
                        value={selectedRad}
                        onChange={setSelectedRad as any}
                        className="w-full"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {RAD_TESTS.map(test => (
                                <Checkbox key={test.code} value={test.code}>
                                    {test.display}
                                </Checkbox>
                            ))}
                        </div>
                    </Checkbox.Group>

                    <Divider />

                    <Form.Item label="Instruksi untuk Pasien (Radiologi)" name="radInstruction">
                        <TextArea
                            rows={2}
                            placeholder="Contoh: Lepaskan semua perhiasan logam"
                        />
                    </Form.Item>
                </Card>

                <Card title="Pengaturan Umum">
                    <Form.Item
                        label="Prioritas"
                        name="priority"
                        initialValue="routine"
                        tooltip="Tentukan seberapa mendesak pemeriksaan ini"
                    >
                        <Select options={PRIORITY_OPTIONS} />
                    </Form.Item>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={bulkCreateMutation.isPending}
                        size="large"
                        disabled={selectedLab.length === 0 && selectedRad.length === 0}
                    >
                        Simpan Order Lab/Radiologi ({selectedLab.length + selectedRad.length})
                    </Button>
                </div>
            </Form>
        </div>
    )
}
