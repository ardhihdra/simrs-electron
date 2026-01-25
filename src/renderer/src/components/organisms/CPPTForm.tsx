import { useEffect } from 'react'
import { Form, Input, Button, Card, App, Spin, Tag, Space } from 'antd'
import { SaveOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useCompositionByEncounter, useUpsertComposition } from '../../hooks/query/use-composition'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import dayjs from 'dayjs'

const { TextArea } = Input

interface CPPTFormProps {
    encounterId: string
    patientData: PatientWithMedicalRecord
    onSaveSuccess?: () => void
}

export const CPPTForm = ({ encounterId, patientData, onSaveSuccess }: CPPTFormProps) => {
    const { message } = App.useApp()
    const [form] = Form.useForm()

    const { data: compositionData, isLoading } = useCompositionByEncounter(encounterId)
    const upsertMutation = useUpsertComposition()

    useEffect(() => {
        if (compositionData?.result && compositionData.result.length > 0) {
            const cppt = compositionData.result[0]
            form.setFieldsValue({
                soapSubjective: cppt.soapSubjective || '',
                soapObjective: cppt.soapObjective || '',
                soapAssessment: cppt.soapAssessment || '',
                soapPlan: cppt.soapPlan || ''
            })
        }
    }, [compositionData, form])

    const handleSubmit = async (values: any) => {
        try {
            await upsertMutation.mutateAsync({
                encounterId,
                patientId: patientData.patient.id,
                doctorId: 1, // TODO: Get from auth
                title: 'CPPT - Catatan Perkembangan Pasien Terintegrasi',
                soapSubjective: values.soapSubjective,
                soapObjective: values.soapObjective,
                soapAssessment: values.soapAssessment,
                soapPlan: values.soapPlan
            })

            message.success('CPPT berhasil disimpan')
            onSaveSuccess?.()
        } catch (error) {
            console.error('Error saving CPPT:', error)
            message.error('Gagal menyimpan CPPT')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spin size="large" tip="Memuat CPPT..." />
            </div>
        )
    }

    const existingCPPT = compositionData?.result?.[0]
    const lastUpdated = existingCPPT?.updatedAt
        ? dayjs(existingCPPT.updatedAt).format('DD MMM YYYY, HH:mm')
        : null
    const status = existingCPPT?.status || 'preliminary'

    return (
        <div className="flex flex-col gap-4">
            <Card size="small">
                <Space>
                    {lastUpdated && (
                        <>
                            <ClockCircleOutlined />
                            <span className="text-gray-600">Terakhir diupdate: {lastUpdated}</span>
                        </>
                    )}
                    <Tag color={status === 'final' ? 'green' : status === 'amended' ? 'blue' : 'orange'}>
                        {status === 'final' ? 'Final' : status === 'amended' ? 'Direvisi' : 'Draft'}
                    </Tag>
                </Space>
            </Card>

            <Form form={form} layout="vertical" onFinish={handleSubmit} className="flex flex-col gap-4">
                <Card>
                    <h3 className="text-lg font-semibold mb-4">S - Subjective (Keluhan Pasien)</h3>
                    <Form.Item
                        name="soapSubjective"
                        label="Anamnesis / Keluhan Utama"
                        rules={[{ required: false }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Tuliskan keluhan pasien, riwayat penyakit sekarang, dll..."
                        />
                    </Form.Item>
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold mb-4">O - Objective (Pemeriksaan Fisik)</h3>
                    <Form.Item
                        name="soapObjective"
                        label="Hasil Pemeriksaan Fisik & Vital Signs"
                        rules={[{ required: false }]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Tuliskan hasil pemeriksaan fisik, tanda vital, dll..."
                        />
                    </Form.Item>
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold mb-4">A - Assessment (Diagnosis)</h3>
                    <Form.Item
                        name="soapAssessment"
                        label="Diagnosis / Penilaian Klinis"
                        rules={[{ required: false }]}
                        tooltip="Data diagnosis dari tab 'Diagnosis & Tindakan' dapat digunakan sebagai referensi"
                    >
                        <TextArea
                            rows={4}
                            placeholder="Tuliskan diagnosis kerja, diagnosis banding, interpretasi hasil pemeriksaan..."
                        />
                    </Form.Item>
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold mb-4">P - Plan (Rencana Tindakan)</h3>
                    <Form.Item
                        name="soapPlan"
                        label="Rencana Terapi & Tindak Lanjut"
                        rules={[{ required: false }]}
                        tooltip="Data tindakan dari tab 'Diagnosis & Tindakan' dan resep dari tab 'E-Resep' dapat digunakan sebagai referensi"
                    >
                        <TextArea
                            rows={4}
                            placeholder="Tuliskan rencana terapi, edukasi, rencana tindakan lanjutan..."
                        />
                    </Form.Item>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={upsertMutation.isPending}
                        size="large"
                    >
                        Simpan CPPT
                    </Button>
                </div>
            </Form>
        </div>
    )
}
