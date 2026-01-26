import { useState, useEffect } from 'react'
import { Card, Descriptions, Space, Tag } from 'antd'
import { useObservationByEncounter } from '../../hooks/query/use-observation'
import { useConditionByEncounter } from '../../hooks/query/use-condition'
import { VITAL_SIGNS_MAP, PHYSICAL_EXAM_MAP } from '../../config/observation-maps'
import { ANAMNESIS_MAP } from '../../config/condition-maps'

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
  associatedSymptoms?: string
  familyHistory?: string
  medicationHistory?: string

  // Example Custom Field
  testAField?: string
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

  // Fetch observations (Vitals & Physical Exam)
  const { data: observationsData, isLoading: observationsLoading } =
    useObservationByEncounter(encounterId)

  // Fetch conditions (Anamnesis)
  const { data: conditionsData, isLoading: conditionsLoading } =
    useConditionByEncounter(encounterId)

  useEffect(() => {
    transformData()
  }, [observationsData, conditionsData])

  const transformData = () => {
    const vital: VitalSigns = {}
    const anam: Anamnesis = {}
    const physExam: PhysicalExamination = {}

    // 1. Process Observations (Vitals & Physical Exam)
    if (observationsData?.success && observationsData?.result) {
      const { grouped } = observationsData.result

      // Vital Signs
      if (grouped?.vitalSigns) {
        grouped.vitalSigns.forEach((obs: any) => {
          const code = obs.codeCoding?.[0]?.code
          const targetField = VITAL_SIGNS_MAP[code]
          if (targetField) {
            vital[targetField] = obs.valueQuantity?.value
          }
        })
      }

      // Physical Exam
      if (grouped?.physicalExam) {
        grouped.physicalExam.forEach((obs: any) => {
          const code = obs.codeCoding?.[0]?.code
          const targetField = PHYSICAL_EXAM_MAP[code]
          if (targetField) {
            physExam[targetField] = obs.valueString
          }
        })
      }
    }

    // 2. Process Conditions (Anamnesis)
    if (conditionsData?.success && Array.isArray(conditionsData.result)) {
      conditionsData.result.forEach((cond: any) => {
        // Check categories array for matches in ANAMNESIS_MAP
        if (cond.categories && Array.isArray(cond.categories)) {
          cond.categories.forEach((cat: any) => {
            const code = cat.code
            const targetField = ANAMNESIS_MAP[code]
            if (targetField) {
              anam[targetField] = cond.note
            }
          })
        }
        // Also check direct category property if flattened by backend
        else if (cond.category) {
          const targetField = ANAMNESIS_MAP[cond.category]
          if (targetField) {
            anam[targetField] = cond.note
          }
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

  if (observationsLoading || conditionsLoading) {
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
          {anamnesis.associatedSymptoms && (
            <Descriptions.Item label="Keluhan Penyerta">
              {anamnesis.associatedSymptoms}
            </Descriptions.Item>
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
          {anamnesis.familyHistory && (
            <Descriptions.Item label="Riwayat Penyakit Keluarga">
              {anamnesis.familyHistory}
            </Descriptions.Item>
          )}
          {anamnesis.allergyHistory && (
            <Descriptions.Item label="Riwayat Alergi">{anamnesis.allergyHistory}</Descriptions.Item>
          )}
          {anamnesis.medicationHistory && (
            <Descriptions.Item label="Riwayat Pengobatan">
              {anamnesis.medicationHistory}
            </Descriptions.Item>
          )}

          {/* Example Test A Field */}
          {anamnesis.testAField && (
            <Descriptions.Item label="Test A (Contoh Custom)">
              {anamnesis.testAField}
            </Descriptions.Item>
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
