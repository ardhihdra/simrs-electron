import { Card, Descriptions, Alert, Spin, Tag } from 'antd'
import { useObservationByEncounter } from '../../hooks/query/use-observation'
import { useConditionByEncounter } from '../../hooks/query/use-condition'
import { useAllergyByEncounter } from '../../hooks/query/use-allergy'
import { useFamilyHistoryByPatient } from '../../hooks/query/use-family-history'
import { formatObservationSummary } from '../../utils/observation-helpers'

interface NurseAssessmentSummaryProps {
  encounterId: string
  patientId?: string
  mode?: 'inpatient' | 'outpatient'
}

export const NurseAssessmentSummary = ({
  encounterId,
  patientId: propPatientId,
  mode = 'inpatient'
}: NurseAssessmentSummaryProps) => {
  const {
    data: obsData,
    isLoading: obsLoading,
    isError: obsError
  } = useObservationByEncounter(encounterId)
  const { data: condData, isLoading: condLoading } = useConditionByEncounter(encounterId)
  const { data: allergyData, isLoading: allergyLoading } = useAllergyByEncounter(encounterId)

  const patientId = propPatientId || obsData?.result?.all?.[0]?.subject?.id || ''
  const { data: familyData, isLoading: familyLoading } = useFamilyHistoryByPatient(patientId)

  const isLoading = obsLoading || condLoading || allergyLoading || familyLoading

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" tip="Memuat data pemeriksaan..." />
      </div>
    )
  }

  if (obsError) {
    return <Alert message="Gagal memuat data pemeriksaan awal" type="error" showIcon />
  }

  const observations = obsData?.result?.all || []
  const conditions = condData?.result || []

  // Check if we have ANY data (either obs or conditions)
  if ((!observations || observations.length === 0) && (!conditions || conditions.length === 0)) {
    return <Alert message="Belum ada data pemeriksaan awal perawat" type="warning" showIcon />
  }

  const summary = formatObservationSummary(observations, conditions)
  const {
    vitalSigns,
    anamnesis,
    physicalExamination,
    painAssessment,
    fallRisk,
    functionalStatus,
    psychosocialHistory,
    screening,
    conclusion,
    performerName,
    examinationDate
  } = summary

  const getBMIColor = (category?: string): string => {
    if (!category) return 'default'
    const cat = category.toLowerCase()
    if (cat.includes('kurus')) return 'blue'
    if (cat.includes('normal')) return 'green'
    if (cat.includes('gemuk')) return 'orange'
    if (cat.includes('obesitas')) return 'red'
    return 'default'
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Tanda Vital (Vital Signs)" size="small">
        <Descriptions column={3} size="small" bordered>
          <Descriptions.Item label="Tekanan Darah">
            {vitalSigns.systolicBloodPressure && vitalSigns.diastolicBloodPressure ? (
              <div>
                <div>
                  {vitalSigns.systolicBloodPressure}/{vitalSigns.diastolicBloodPressure} mmHg
                </div>
                {(vitalSigns.bloodPressureBodySite || vitalSigns.bloodPressurePosition) && (
                  <div className="text-xs text-gray-500 mt-1">
                    {[vitalSigns.bloodPressureBodySite, vitalSigns.bloodPressurePosition]
                      .filter(Boolean)
                      .join(' - ')}
                  </div>
                )}
              </div>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Nadi">
            {vitalSigns.pulseRate ? (
              <div>
                <div>{vitalSigns.pulseRate} x/menit</div>
                {vitalSigns.pulseRateBodySite && (
                  <div className="text-xs text-gray-500 mt-1">{vitalSigns.pulseRateBodySite}</div>
                )}
              </div>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Pernafasan">
            {vitalSigns.respiratoryRate ? `${vitalSigns.respiratoryRate} x/menit` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Suhu">
            {vitalSigns.temperature ? (
              <div>
                <div>{vitalSigns.temperature} °C</div>
                {vitalSigns.temperatureMethod && (
                  <div className="text-xs text-gray-500 mt-1">{vitalSigns.temperatureMethod}</div>
                )}
              </div>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Tinggi Badan">
            {vitalSigns.height ? `${vitalSigns.height} cm` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Berat Badan">
            {vitalSigns.weight ? `${vitalSigns.weight} kg` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Saturasi Oksigen">
            {vitalSigns.oxygenSaturation ? `${vitalSigns.oxygenSaturation} %` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="IMT (BMI)">
            {vitalSigns.bmi ? (
              <div className="flex items-center gap-2">
                <span>{vitalSigns.bmi} kg/m²</span>
                {vitalSigns.bmiCategory && (
                  <Tag color={getBMIColor(vitalSigns.bmiCategory)}>{vitalSigns.bmiCategory}</Tag>
                )}
              </div>
            ) : (
              '-'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Anamnesis" size="small">
        <Descriptions column={1} size="small" bordered className="bg-gray-50">
          <Descriptions.Item label="Keluhan Utama">
            <span className="font-semibold">{anamnesis.chiefComplaint || '-'}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Keluhan Penyerta">
            {anamnesis.associatedSymptoms || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Riwayat Penyakit">
            {anamnesis.historyOfIllness || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Riwayat Penyakit Keluarga">
            {familyData?.result &&
            Array.isArray(familyData.result) &&
            familyData.result.length > 0 ? (
              <span>
                {familyData.result
                  .map((fh: any) => fh.note)
                  .filter(Boolean)
                  .join(', ')}
              </span>
            ) : anamnesis.familyHistory ? (
              <span>{anamnesis.familyHistory}</span>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Alergi">
            {allergyData?.result &&
            Array.isArray(allergyData.result) &&
            allergyData.result.length > 0 ? (
              <span className="text-red-600 font-medium">
                {allergyData.result
                  .map((a: any) => a.note)
                  .filter(Boolean)
                  .join(', ')}
              </span>
            ) : anamnesis.allergyHistory ? (
              <span className="text-red-600 font-medium">{anamnesis.allergyHistory}</span>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Riwayat Pengobatan">
            {anamnesis.medicationHistory || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Pemeriksaan Fisik Awal" size="small">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Kesadaran">
            {physicalExamination.consciousness || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Keadaan Umum">
            {physicalExamination.generalCondition || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Catatan Tambahan">
            {physicalExamination.additionalNotes || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {mode === 'inpatient' && (
        <>
          <Card title="Status Fungsional" size="small">
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="Alat Bantu">
                {functionalStatus.aids_check || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Cacat Tubuh">
                {functionalStatus.disability_check || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="ADL">{functionalStatus.adl_check || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Riwayat Psiko-Sosial, Spiritual & Budaya" size="small">
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Status Psikologis">
                {psychosocialHistory.psychological_status || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Hubungan Keluarga">
                {psychosocialHistory.family_relation_note || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tinggal Dengan">
                {psychosocialHistory.living_with_note || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Agama">
                {psychosocialHistory.religion || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Budaya/Kepercayaan">
                {psychosocialHistory.culture_values || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Bahasa">
                {psychosocialHistory.daily_language || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}

      {mode === 'inpatient' && (
        <Card title="Skrining & Pemeriksaan Lanjutan" size="small">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Kesadaran (Skrining)">
              {screening.consciousness_level || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Pernapasan (Skrining)">
              {screening.breathing_status || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Risiko Jatuh (GUG A)">
              {fallRisk.gugA || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Risiko Jatuh (GUG B)">
              {fallRisk.gugB || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Skala Nyeri (Wong-Baker)">
              {painAssessment.painScore ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Nyeri Dada">
              {painAssessment.chestPain || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Skrining Batuk">
              {screening.cough_screening_status || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {mode === 'inpatient' && (
        <Card title="Keputusan" size="small">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Keputusan Tindak Lanjut">
              <Tag color="blue">{conclusion.decision || '-'}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {(performerName || examinationDate) && (
        <div className="text-right text-xs text-gray-400">
          {performerName && <>Pemeriksaan oleh: {performerName}</>}
          {performerName && examinationDate && <> pada </>}
          {examinationDate && <>{new Date(examinationDate).toLocaleString('id-ID')}</>}
        </div>
      )}
    </div>
  )
}
