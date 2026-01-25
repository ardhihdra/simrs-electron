import { useState, useEffect } from 'react'
import { Card, Descriptions, Space, Tag } from 'antd'
import { useObservationByEncounter } from '../../hooks/query/use-observation'

interface VitalSigns {
    systolicBloodPressure?: number
    diastolicBloodPressure?: number
    bloodPressureBodySite?: string
    bloodPressurePosition?: string
    temperature?: number
    temperatureMethod?: string
    pulseRate?: number
    pulseRateBodySite?: string
    respiratoryRate?: number
    height?: number
    weight?: number
    bmi?: number
    oxygenSaturation?: number
}

interface Anamnesis {
    chiefComplaint?: string
    historyOfPresentIllness?: string
    historyOfPastIllness?: string
    allergyHistory?: string
}

interface PhysicalExamination {
    consciousness?: string
    generalCondition?: string
    additionalNotes?: string
}

interface DoctorMedicalRecordDetailProps {
    encounterId: string
}

export const DoctorMedicalRecordDetail = ({ encounterId }: DoctorMedicalRecordDetailProps) => {
    const [vitalSigns, setVitalSigns] = useState<VitalSigns>({})
    const [anamnesis, setAnamnesis] = useState<Anamnesis>({})
    const [physicalExamination, setPhysicalExamination] = useState<PhysicalExamination>({})

    // Fetch observations
    const { data: observationsData, isLoading: observationsLoading } =
        useObservationByEncounter(encounterId)

    useEffect(() => {
        if (observationsData?.success && observationsData?.result) {
            transformObservations(observationsData.result)
        }
    }, [observationsData])

    const transformObservations = (result: any) => {
        const { grouped } = result
        const vital: VitalSigns = {}
        const anam: Anamnesis = {}
        const physExam: PhysicalExamination = {}

        // Transform vital signs
        if (grouped?.vitalSigns) {
            grouped.vitalSigns.forEach((obs: any) => {
                const code = obs.codeCoding?.[0]?.code

                switch (code) {
                    case '8480-6': // Systolic BP
                        vital.systolicBloodPressure = obs.valueQuantity?.value
                        break
                    case '8462-4': // Diastolic BP
                        vital.diastolicBloodPressure = obs.valueQuantity?.value
                        break
                    case '8310-5': // Temperature
                        vital.temperature = obs.valueQuantity?.value
                        break
                    case '8867-4': // Heart rate
                        vital.pulseRate = obs.valueQuantity?.value
                        break
                    case '9279-1': // Respiratory rate
                        vital.respiratoryRate = obs.valueQuantity?.value
                        break
                    case '8302-2': // Height
                        vital.height = obs.valueQuantity?.value
                        break
                    case '29463-7': // Weight
                        vital.weight = obs.valueQuantity?.value
                        break
                    case '39156-5': // BMI
                        vital.bmi = obs.valueQuantity?.value
                        break
                    case '2708-6': // Oxygen saturation
                        vital.oxygenSaturation = obs.valueQuantity?.value
                        break
                }
            })
        }

        // Transform anamnesis
        if (grouped?.anamnesis) {
            grouped.anamnesis.forEach((obs: any) => {
                const code = obs.codeCoding?.[0]?.code

                switch (code) {
                    case 'chief-complaint':
                        anam.chiefComplaint = obs.valueString
                        break
                    case 'history-present-illness':
                        anam.historyOfPresentIllness = obs.valueString
                        break
                    case 'history-past-illness':
                        anam.historyOfPastIllness = obs.valueString
                        break
                    case 'allergy-history':
                        anam.allergyHistory = obs.valueString
                        break
                }
            })
        }

        // Transform physical examination
        if (grouped?.physicalExam) {
            grouped.physicalExam.forEach((obs: any) => {
                const code = obs.codeCoding?.[0]?.code

                switch (code) {
                    case 'consciousness':
                        physExam.consciousness = obs.valueString
                        break
                    case 'general-condition':
                        physExam.generalCondition = obs.valueString
                        break
                    case 'physical-exam-notes':
                        physExam.additionalNotes = obs.valueString
                        break
                }
            })
        }

        setVitalSigns(vital)
        setAnamnesis(anam)
        setPhysicalExamination(physExam)
    }

    const getBMICategory = (bmi: number): { text: string; color: string } => {
        if (bmi < 18.5) return { text: 'Kurus', color: 'blue' }
        if (bmi < 25) return { text: 'Normal', color: 'green' }
        if (bmi < 30) return { text: 'Gemuk', color: 'orange' }
        return { text: 'Obesitas', color: 'red' }
    }

    if (observationsLoading) {
        return <Card loading />
    }

    return (
        <div className="space-y-4">
            {/* Vital Signs Card */}
            <Card title="Tanda Vital (Vital Signs)">
                <Descriptions bordered column={3}>
                    {vitalSigns.systolicBloodPressure && vitalSigns.diastolicBloodPressure && (
                        <Descriptions.Item label="Tekanan Darah">
                            <strong>
                                {vitalSigns.systolicBloodPressure}/{vitalSigns.diastolicBloodPressure} mmHg
                            </strong>
                        </Descriptions.Item>
                    )}
                    {vitalSigns.temperature && (
                        <Descriptions.Item label="Suhu Tubuh">
                            <strong>{vitalSigns.temperature}°C</strong>
                        </Descriptions.Item>
                    )}
                    {vitalSigns.pulseRate && (
                        <Descriptions.Item label="Nadi">
                            <strong>{vitalSigns.pulseRate} bpm</strong>
                        </Descriptions.Item>
                    )}
                    {vitalSigns.respiratoryRate && (
                        <Descriptions.Item label="Pernapasan">
                            <strong>{vitalSigns.respiratoryRate} /menit</strong>
                        </Descriptions.Item>
                    )}
                    {vitalSigns.height && (
                        <Descriptions.Item label="Tinggi Badan">
                            <strong>{vitalSigns.height} cm</strong>
                        </Descriptions.Item>
                    )}
                    {vitalSigns.weight && (
                        <Descriptions.Item label="Berat Badan">
                            <strong>{vitalSigns.weight} kg</strong>
                        </Descriptions.Item>
                    )}
                    {vitalSigns.bmi && (
                        <Descriptions.Item label="BMI (Body Mass Index)" span={2}>
                            <Space>
                                <strong>{vitalSigns.bmi}</strong>
                                <Tag color={getBMICategory(vitalSigns.bmi).color}>
                                    {getBMICategory(vitalSigns.bmi).text}
                                </Tag>
                            </Space>
                        </Descriptions.Item>
                    )}
                    {vitalSigns.oxygenSaturation && (
                        <Descriptions.Item label="SpO2">
                            <strong>{vitalSigns.oxygenSaturation}%</strong>
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </Card>

            {/* Anamnesis Card */}
            <Card title="Anamnesis">
                <Descriptions bordered column={1}>
                    {anamnesis.chiefComplaint && (
                        <Descriptions.Item label="Keluhan Utama">{anamnesis.chiefComplaint}</Descriptions.Item>
                    )}
                    {anamnesis.historyOfPresentIllness && (
                        <Descriptions.Item label="Riwayat Penyakit Sekarang">
                            {anamnesis.historyOfPresentIllness}
                        </Descriptions.Item>
                    )}
                    {anamnesis.historyOfPastIllness && (
                        <Descriptions.Item label="Riwayat Penyakit Dahulu">
                            {anamnesis.historyOfPastIllness}
                        </Descriptions.Item>
                    )}
                    {anamnesis.allergyHistory && (
                        <Descriptions.Item label="Riwayat Alergi">{anamnesis.allergyHistory}</Descriptions.Item>
                    )}
                </Descriptions>
            </Card>

            {/* Physical Examination Card */}
            <Card title="Pemeriksaan Fisik">
                <Descriptions bordered column={2}>
                    {physicalExamination.consciousness && (
                        <Descriptions.Item label="Kesadaran">
                            <strong>{physicalExamination.consciousness}</strong>
                        </Descriptions.Item>
                    )}
                    {physicalExamination.generalCondition && (
                        <Descriptions.Item label="Keadaan Umum">
                            <strong>{physicalExamination.generalCondition}</strong>
                        </Descriptions.Item>
                    )}
                    {physicalExamination.additionalNotes && (
                        <Descriptions.Item label="Catatan Tambahan" span={2}>
                            {physicalExamination.additionalNotes}
                        </Descriptions.Item>
                    )}
                </Descriptions>
            </Card>
        </div>
    )
}
