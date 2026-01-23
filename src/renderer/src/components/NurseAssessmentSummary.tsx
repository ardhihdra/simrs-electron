import { Card, Descriptions, Alert, Spin, Tag } from 'antd'
import { useObservationByEncounter } from '../hooks/query/use-observation'
import { formatObservationSummary } from '../utils/observation-helpers'

interface NurseAssessmentSummaryProps {
  encounterId: string
}

export const NurseAssessmentSummary = ({ encounterId }: NurseAssessmentSummaryProps) => {
  const { data, isLoading, isError } = useObservationByEncounter(encounterId)

  // Temporary debug
  console.log('🔍 Full data object:', JSON.stringify(data, null, 2))
  console.log('🔍 data?.result:', data?.result)
  console.log('🔍 data?.result?.all:', data?.result?.all)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spin size="large" tip="Memuat data pemeriksaan..." />
      </div>
    )
  }

  if (isError) {
    return <Alert message="Gagal memuat data pemeriksaan awal" type="error" showIcon />
  }

  // Check if we have observation data
  const observations = data?.result?.all || []
  if (!observations || observations.length === 0) {
    console.log('🔍 No observations found - showing warning')
    return <Alert message="Belum ada data pemeriksaan awal perawat" type="warning" showIcon />
  }

  const summary = formatObservationSummary(observations)
  const { vitalSigns, anamnesis, physicalExamination, performerName, examinationDate } = summary

  // Helper to get BMI category color
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
    <div className="space-y-4">
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
          <Descriptions.Item label="Riwayat Penyakit Sekarang">
            {anamnesis.historyOfPresentIllness || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Riwayat Penyakit Dahulu">
            {anamnesis.historyOfPastIllness || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Alergi">
            {anamnesis.allergyHistory ? (
              <span className="text-red-600 font-medium">{anamnesis.allergyHistory}</span>
            ) : (
              '-'
            )}
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
