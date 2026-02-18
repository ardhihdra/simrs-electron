import { ArrowLeftOutlined } from '@ant-design/icons'
import { useLaboratoryActions } from '@renderer/pages/Laboratory/useLaboratoryActions'
import { Button, Card, Form, Select, Typography, message } from 'antd'
import { useLocation, useNavigate } from 'react-router'


const { Title, Text } = Typography

export default function CollectSpecimenPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const record = location.state as any
    const [form] = Form.useForm()

    const { handleCollectSpecimen, loading } = useLaboratoryActions(() => {
        message.success('Specimen collected successfully')
        navigate('/dashboard/laboratory-management/requests')
    })

    if (!record) {
        return (
            <div className="p-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
                <div className="mt-4">No record selected</div>
            </div>
        )
    }

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields()
            await handleCollectSpecimen({
                serviceRequestId: record.id,
                typeCodeId: values.typeCodeId
            })
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="p-4">
            <div className="mb-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
            </div>
            
            <Card title="Pengambilan Sampel">
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
                    <Form.Item name="typeCodeId" label="Jenis Sampel" rules={[{ required: true }]}>
                        <Select
                            placeholder="Pilih Jenis Sampel"
                            options={[
                                { label: 'Darah (Blood)', value: 'BLOOD' },
                                { label: 'Urin (Urine)', value: 'URINE' },
                                { label: 'Swab', value: 'SWAB' },
                                { label: 'Sputum', value: 'SPUTUM' },
                                { label: 'Feces', value: 'FECES' }
                            ]}
                        />
                    </Form.Item>

                    <div className="flex gap-2">
                        <Button type="primary" onClick={handleSubmit} loading={loading === 'collect-specimen'}>
                            Simpan Sampel
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
