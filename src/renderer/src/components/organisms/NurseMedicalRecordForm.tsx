import { useState } from 'react'
import {
    Form,
    Input,
    InputNumber,
    Button,
    Card,
    Row,
    Col,
    App,
    Space,
    Select,
    Tag
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { VitalSigns, Anamnesis, PhysicalExamination, PatientQueue } from '../../types/nurse.types'
import { useBulkCreateObservation } from '../../hooks/query/use-observation'
import { useBulkCreateCondition } from '../../hooks/query/use-condition'

const { TextArea } = Input
const { Option } = Select

interface NurseMedicalRecordFormProps {
    encounterId: string
    patientData: PatientQueue
}

export const NurseMedicalRecordForm = ({ encounterId, patientData }: NurseMedicalRecordFormProps) => {
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [bmi, setBmi] = useState<number | null>(null)

    const bulkCreateObservation = useBulkCreateObservation()
    const bulkCreateCondition = useBulkCreateCondition()

    const calculateBMI = () => {
        const height = form.getFieldValue(['vitalSigns', 'height'])
        const weight = form.getFieldValue(['vitalSigns', 'weight'])

        if (height && weight && height > 0) {
            const heightInMeters = height / 100
            const calculatedBMI = weight / (heightInMeters * heightInMeters)
            const roundedBMI = Math.round(calculatedBMI * 100) / 100
            setBmi(roundedBMI)
            form.setFieldValue(['vitalSigns', 'bmi'], roundedBMI)
        }
    }

    const getBMICategory = (bmiValue: number): { text: string; color: string } => {
        if (bmiValue < 18.5) return { text: 'Kurus', color: 'blue' }
        if (bmiValue < 25) return { text: 'Normal', color: 'green' }
        if (bmiValue < 30) return { text: 'Gemuk', color: 'orange' }
        return { text: 'Obesitas', color: 'red' }
    }

    const onFinish = async (values: {
        vitalSigns: VitalSigns
        anamnesis: Anamnesis
        physicalExamination: PhysicalExamination
        notes?: string
    }) => {
        try {
            // TODO: Get real logged in user
            const currentUser = {
                id: 'nurse-001',
                name: 'Perawat Demo'
            }

            // 1. Prepare Observations (Vital Signs & Physical Exam)
            const observations: Array<{
                category: string
                code: string
                display?: string
                system?: string
                valueQuantity?: any
                valueString?: string
                valueBoolean?: boolean
                performers?: { performerId: string; performerName: string }[]
                bodySites?: { code: string; display: string; system?: string }[]
                methods?: { code: string; display: string; system?: string }[]
                interpretations?: { code: string; display: string; system?: string }[]
                notes?: (string | { text: string })[]
            }> = []

            // Vital Signs Logic
            if (values.vitalSigns.systolicBloodPressure) {
                observations.push({
                    category: 'vital-signs',
                    code: '8480-6',
                    display: 'Systolic blood pressure',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.systolicBloodPressure, unit: 'mmHg' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }],
                    bodySites: [
                        values.vitalSigns.bloodPressureBodySite
                            ? {
                                code: values.vitalSigns.bloodPressureBodySite,
                                display: values.vitalSigns.bloodPressureBodySite,
                                system: 'http://snomed.info/sct'
                            }
                            : null,
                        values.vitalSigns.bloodPressurePosition
                            ? {
                                code: values.vitalSigns.bloodPressurePosition,
                                display: values.vitalSigns.bloodPressurePosition,
                                system: 'http://snomed.info/sct'
                            }
                            : null
                    ].filter(Boolean) as any
                })
            }

            if (values.vitalSigns.diastolicBloodPressure) {
                observations.push({
                    category: 'vital-signs',
                    code: '8462-4',
                    display: 'Diastolic blood pressure',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.diastolicBloodPressure, unit: 'mmHg' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }],
                    bodySites: [
                        values.vitalSigns.bloodPressureBodySite
                            ? {
                                code: values.vitalSigns.bloodPressureBodySite,
                                display: values.vitalSigns.bloodPressureBodySite,
                                system: 'http://snomed.info/sct'
                            }
                            : null,
                        values.vitalSigns.bloodPressurePosition
                            ? {
                                code: values.vitalSigns.bloodPressurePosition,
                                display: values.vitalSigns.bloodPressurePosition,
                                system: 'http://snomed.info/sct'
                            }
                            : null
                    ].filter(Boolean) as any
                })
            }

            if (values.vitalSigns.temperature) {
                observations.push({
                    category: 'vital-signs',
                    code: '8310-5',
                    display: 'Body temperature',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.temperature, unit: 'Cel' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }],
                    methods: values.vitalSigns.temperatureMethod
                        ? [
                            {
                                code: values.vitalSigns.temperatureMethod,
                                display: values.vitalSigns.temperatureMethod,
                                system: 'http://snomed.info/sct'
                            }
                        ]
                        : undefined
                })
            }

            if (values.vitalSigns.pulseRate) {
                observations.push({
                    category: 'vital-signs',
                    code: '8867-4',
                    display: 'Heart rate',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.pulseRate, unit: '/min' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }],
                    bodySites: values.vitalSigns.pulseRateBodySite
                        ? [
                            {
                                code: values.vitalSigns.pulseRateBodySite,
                                display: values.vitalSigns.pulseRateBodySite,
                                system: 'http://snomed.info/sct'
                            }
                        ]
                        : undefined
                })
            }

            if (values.vitalSigns.respiratoryRate) {
                observations.push({
                    category: 'vital-signs',
                    code: '9279-1',
                    display: 'Respiratory rate',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.respiratoryRate, unit: '/min' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }]
                })
            }

            if (values.vitalSigns.height) {
                observations.push({
                    category: 'vital-signs',
                    code: '8302-2',
                    display: 'Body height',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.height, unit: 'cm' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }]
                })
            }

            if (values.vitalSigns.weight) {
                observations.push({
                    category: 'vital-signs',
                    code: '29463-7',
                    display: 'Body weight',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.weight, unit: 'kg' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }]
                })
            }

            if (values.vitalSigns.bmi) {
                observations.push({
                    category: 'vital-signs',
                    code: '39156-5',
                    display: 'Body mass index (BMI)',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.bmi, unit: 'kg/m2' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }],
                    interpretations: [
                        {
                            code: getBMICategory(values.vitalSigns.bmi).text.toUpperCase(),
                            display: getBMICategory(values.vitalSigns.bmi).text,
                            system: 'http://custom-bmi-category'
                        }
                    ]
                })
            }

            if (values.vitalSigns.oxygenSaturation) {
                observations.push({
                    category: 'vital-signs',
                    code: '2708-6',
                    display: 'Oxygen saturation',
                    system: 'http://loinc.org',
                    valueQuantity: { value: values.vitalSigns.oxygenSaturation, unit: '%' },
                    performers: [{ performerId: currentUser.id, performerName: currentUser.name }]
                })
            }

            // Physical Examination
            if (values.physicalExamination.consciousness) {
                observations.push({
                    category: 'exam',
                    code: 'consciousness',
                    display: 'Level of consciousness',
                    valueString: values.physicalExamination.consciousness
                })
            }

            if (values.physicalExamination.generalCondition) {
                observations.push({
                    category: 'exam',
                    code: 'general-condition',
                    display: 'General condition',
                    valueString: values.physicalExamination.generalCondition
                })
            }

            if (values.physicalExamination.additionalNotes) {
                observations.push({
                    category: 'exam',
                    code: 'physical-exam-notes',
                    display: 'Physical examination notes',
                    valueString: values.physicalExamination.additionalNotes
                })
            }

            if (values.notes) {
                observations.push({
                    category: 'exam',
                    code: 'additional-notes',
                    display: 'Additional notes',
                    valueString: values.notes
                })
            }

            // 2. Prepare Conditions (Anamnesis)
            const conditions: Array<{
                category: string
                notes: string
                diagnosisCodeId?: number
            }> = []

            if (values.anamnesis.chiefComplaint) {
                conditions.push({
                    category: 'chief-complaint',
                    notes: values.anamnesis.chiefComplaint
                })
            }

            if (values.anamnesis.associatedSymptoms) {
                conditions.push({
                    category: 'associated-symptoms',
                    notes: values.anamnesis.associatedSymptoms
                })
            }

            if (values.anamnesis.historyOfIllness) {
                conditions.push({
                    category: 'history-of-illness',
                    notes: values.anamnesis.historyOfIllness
                })
            }

            if (values.anamnesis.familyHistory) {
                conditions.push({
                    category: 'family-history',
                    notes: values.anamnesis.familyHistory
                })
            }

            if (values.anamnesis.allergyHistory) {
                conditions.push({
                    category: 'allergy-history',
                    notes: values.anamnesis.allergyHistory
                })
            }

            if (values.anamnesis.medicationHistory) {
                conditions.push({
                    category: 'medication-history',
                    notes: values.anamnesis.medicationHistory
                })
            }

            // Execute Mutations
            const promises: Promise<any>[] = []

            if (observations.length > 0) {
                promises.push(
                    bulkCreateObservation.mutateAsync({
                        encounterId,
                        patientId: patientData.patient.id,
                        observations,
                        performerId: 'nurse-001',
                        performerName: 'Perawat Demo'
                    })
                )
            }

            if (conditions.length > 0) {
                promises.push(
                    bulkCreateCondition.mutateAsync({
                        encounterId,
                        patientId: patientData.patient.id,
                        doctorId: 0, // 0 for Nurse? Or need nurse ID field in condition? Model checks recorder which is int. Maybe use 0 or safe default.
                        conditions
                    })
                )
            }

            await Promise.all(promises)

            message.success('Rekam medis berhasil disimpan')
            form.resetFields()
            setTimeout(() => {
                navigate('/dashboard/nurse-calling')
            }, 1500)

        } catch (error) {
            message.error('Gagal menyimpan rekam medis')
            console.error(error)
        }
    }

    return (
        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Card title="Vital Signs / Tanda Vital" className="mb-4">
                {/* Vital Signs Form Items reused */}
                <Row gutter={16}>
                    <Col span={6}>
                        <Form.Item
                            label="Tekanan Darah Sistolik (mmHg)"
                            name={['vitalSigns', 'systolicBloodPressure']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <InputNumber
                                min={0}
                                max={300}
                                placeholder="120"
                                className="w-full"
                                addonAfter="mmHg"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            label="Tekanan Darah Diastolik (mmHg)"
                            name={['vitalSigns', 'diastolicBloodPressure']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <InputNumber
                                min={0}
                                max={200}
                                placeholder="80"
                                className="w-full"
                                addonAfter="mmHg"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item label="Lokasi Pengukuran" name={['vitalSigns', 'bloodPressureBodySite']}>
                            <Select placeholder="Pilih lokasi">
                                <Option value="Left arm">Lengan Kiri</Option>
                                <Option value="Right arm">Lengan Kanan</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item label="Posisi" name={['vitalSigns', 'bloodPressurePosition']}>
                            <Select placeholder="Pilih posisi">
                                <Option value="Sitting position">Duduk</Option>
                                <Option value="Supine position">Berbaring</Option>
                                <Option value="Standing position">Berdiri</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="Suhu Tubuh (°C)"
                            name={['vitalSigns', 'temperature']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <InputNumber
                                min={30}
                                max={45}
                                step={0.1}
                                placeholder="36.5"
                                className="w-full"
                                addonAfter="°C"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="Metode Suhu" name={['vitalSigns', 'temperatureMethod']}>
                            <Select placeholder="Pilih metode">
                                <Option value="Axillary">Axilla (Ketiak)</Option>
                                <Option value="Oral">Oral (Mulut)</Option>
                                <Option value="Rectal">Rectal (Anus)</Option>
                                <Option value="Tympanic">Tympanic (Telinga)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Nadi (bpm)"
                            name={['vitalSigns', 'pulseRate']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <InputNumber
                                min={30}
                                max={200}
                                placeholder="80"
                                className="w-full"
                                addonAfter="bpm"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="Lokasi Nadi" name={['vitalSigns', 'pulseRateBodySite']}>
                            <Select placeholder="Pilih lokasi">
                                <Option value="Radial">Radial (Pergelangan Tangan)</Option>
                                <Option value="Carotid">Carotid (Leher)</Option>
                                <Option value="Brachial">Brachial (Siku)</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="Pernapasan (per menit)"
                            name={['vitalSigns', 'respiratoryRate']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <InputNumber
                                min={10}
                                max={60}
                                placeholder="20"
                                className="w-full"
                                addonAfter="/min"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="Tinggi Badan (cm)"
                            name={['vitalSigns', 'height']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <InputNumber
                                min={0}
                                max={250}
                                placeholder="170"
                                className="w-full"
                                onChange={calculateBMI}
                                addonAfter="cm"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Berat Badan (kg)"
                            name={['vitalSigns', 'weight']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <InputNumber
                                min={0}
                                max={300}
                                step={0.1}
                                placeholder="70"
                                className="w-full"
                                onChange={calculateBMI}
                                addonAfter="kg"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item label="BMI (Body Mass Index)" name={['vitalSigns', 'bmi']}>
                            <div className="flex items-center gap-2">
                                <InputNumber disabled className="w-full" value={bmi || undefined} />
                                {bmi && <Tag color={getBMICategory(bmi).color}>{getBMICategory(bmi).text}</Tag>}
                            </div>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="Saturasi Oksigen - SpO2 (%)"
                            name={['vitalSigns', 'oxygenSaturation']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <InputNumber min={0} max={100} placeholder="98" className="w-full" addonAfter="%" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="Anamnesis" className="mb-4">
                <Form.Item
                    label="Keluhan Utama"
                    name={['anamnesis', 'chiefComplaint']}
                    rules={[{ required: true, message: 'Wajib diisi' }]}
                >
                    <TextArea rows={3} placeholder="Masukkan keluhan utama pasien..." />
                </Form.Item>

                <Form.Item label="Keluhan Penyerta" name={['anamnesis', 'associatedSymptoms']}>
                    <TextArea rows={2} placeholder="Masukkan keluhan penyerta (jika ada)..." />
                </Form.Item>

                <Form.Item
                    label="Riwayat Penyakit"
                    name={['anamnesis', 'historyOfIllness']}
                    rules={[{ required: true, message: 'Wajib diisi' }]}
                >
                    <TextArea rows={3} placeholder="Masukkan riwayat penyakit..." />
                </Form.Item>

                <Form.Item label="Riwayat Penyakit Keluarga" name={['anamnesis', 'familyHistory']}>
                    <TextArea rows={2} placeholder="Masukkan riwayat penyakit keluarga (jika ada)..." />
                </Form.Item>

                <Form.Item label="Riwayat Alergi" name={['anamnesis', 'allergyHistory']}>
                    <TextArea rows={2} placeholder="Masukkan riwayat alergi (jika ada)..." />
                </Form.Item>

                <Form.Item label="Riwayat Pengobatan" name={['anamnesis', 'medicationHistory']}>
                    <TextArea rows={2} placeholder="Masukkan riwayat pengobatan sebelumnya (jika ada)..." />
                </Form.Item>
            </Card>

            <Card title="Pemeriksaan Fisik" className="mb-4">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Kesadaran"
                            name={['physicalExamination', 'consciousness']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <Select placeholder="Pilih tingkat kesadaran">
                                <Option value="Composmentis">Composmentis (Sadar Penuh)</Option>
                                <Option value="Apatis">Apatis</Option>
                                <Option value="Somnolen">Somnolen</Option>
                                <Option value="Sopor">Sopor</Option>
                                <Option value="Koma">Koma</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Keadaan Umum"
                            name={['physicalExamination', 'generalCondition']}
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                            <Select placeholder="Pilih keadaan umum">
                                <Option value="Baik">Baik</Option>
                                <Option value="Sedang">Sedang</Option>
                                <Option value="Buruk">Buruk</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Catatan Pemeriksaan Fisik"
                    name={['physicalExamination', 'additionalNotes']}
                >
                    <TextArea rows={4} placeholder="Masukkan catatan tambahan pemeriksaan fisik..." />
                </Form.Item>
            </Card>

            <Card title="Catatan Tambahan" className="mb-4">
                <Form.Item label="Catatan" name="notes">
                    <TextArea rows={3} placeholder="Masukkan catatan tambahan (opsional)..." />
                </Form.Item>
            </Card>

            <Form.Item>
                <Space>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        size="large"
                        loading={bulkCreateObservation.isPending || bulkCreateCondition.isPending}
                    >
                        Simpan Rekam Medis
                    </Button>
                    <Button size="large" onClick={() => navigate('/dashboard/nurse-calling')}>
                        Batal
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    )
}
