import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, DatePicker, Form, Radio, Row, Select } from 'antd'
import dayjs from 'dayjs'
import { useState, useEffect } from 'react'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '../../hooks/query/use-observation'
import { formatVitalSigns } from '../../utils/observation-helpers'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES,
  type ObservationBuilderOptions
} from '../../utils/observation-builder'
import { AssessmentHeader } from './Assessment/AssessmentHeader'
import { usePerformers } from '../../hooks/query/use-performers'

const { Option } = Select

interface GCSAssessmentFormProps {
  encounterId?: string
  patientData?: any
}

export const GCSAssessmentForm = ({ encounterId, patientData }: GCSAssessmentFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const [gcsEye, setGcsEye] = useState<number>(0)
  const [gcsVerbal, setGcsVerbal] = useState<number>(0)
  const [gcsMotor, setGcsMotor] = useState<number>(0)

  const gcsTotal = gcsEye + gcsVerbal + gcsMotor

  const { data: response } = useObservationByEncounter(encounterId)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['nurse'])

  useEffect(() => {
    const observations = response?.result?.all
    if (response?.success && observations && Array.isArray(observations)) {
      const sortedObs = [...observations].sort(
        (a: any, b: any) =>
          dayjs(b.effectiveDateTime || b.issued || b.createdAt).valueOf() -
          dayjs(a.effectiveDateTime || a.issued || a.createdAt).valueOf()
      )

      const vitalSigns = formatVitalSigns(sortedObs)
      const { gcsEye, gcsVerbal, gcsMotor } = vitalSigns

      if (gcsEye) setGcsEye(gcsEye)
      if (gcsVerbal) setGcsVerbal(gcsVerbal)
      if (gcsMotor) setGcsMotor(gcsMotor)
    }
  }, [response, form])

  const bulkCreateObservation = useBulkCreateObservation()

  const getGCSConclusion = (total: number) => {
    if (total >= 14) return 'Composmentis'
    if (total >= 12) return 'Apatis'
    if (total >= 10) return 'Delirium'
    if (total >= 7) return 'Somnolen'
    if (total >= 5) return 'Sopor'
    if (total >= 3) return 'Semi-Coma / Coma'
    return total > 0 ? 'Coma' : '-'
  }

  const handleFinish = async (values: any) => {
    if (!encounterId) {
      message.error('Data kunjungan tidak ditemukan')
      return
    }

    try {
      const obsToCreate: Omit<ObservationBuilderOptions, 'effectiveDateTime'>[] = []

      if (gcsEye > 0) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: '9267-5',
          display: 'Glasgow coma score eye opening',
          valueQuantity: {
            value: gcsEye,
            unit: 'score'
          },
          valueString: `E${gcsEye}`
        })
      }
      if (gcsVerbal > 0) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: '9270-9',
          display: 'Glasgow coma score verbal',
          valueQuantity: {
            value: gcsVerbal,
            unit: 'score'
          },
          valueString: `V${gcsVerbal}`
        })
      }
      if (gcsMotor > 0) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: '9268-3',
          display: 'Glasgow coma score motor',
          valueQuantity: {
            value: gcsMotor,
            unit: 'score'
          },
          valueString: `M${gcsMotor}`
        })
      }
      if (gcsTotal > 0) {
        let interpretationCode = 'N'
        let interpretationDisplay = 'Sadar baik'

        if (gcsTotal <= 8) {
          interpretationCode = 'H'
          interpretationDisplay = 'Penurunan kesadaran berat'
        } else if (gcsTotal <= 12) {
          interpretationCode = 'M'
          interpretationDisplay = 'Penurunan kesadaran sedang'
        }

        obsToCreate.push(
          {
            category: OBSERVATION_CATEGORIES.EXAM,
            code: '9269-1',
            display: 'Glasgow coma score total',
            valueQuantity: {
              value: gcsTotal,
              unit: 'score'
            },
            valueString: `GCS ${gcsTotal}`,
            interpretations: [
              {
                code: interpretationCode,
                display: interpretationDisplay
              }
            ]
          },
          {
            category: OBSERVATION_CATEGORIES.EXAM,
            code: 'consciousness',
            display: 'Level of consciousness',
            valueString: getGCSConclusion(gcsTotal),
            interpretations: [
              {
                code: interpretationCode,
                display: interpretationDisplay
              }
            ]
          }
        )
      }

      if (obsToCreate.length > 0) {
        const assessmentDate = values.assessment_date || dayjs()
        const observations = createObservationBatch(obsToCreate, assessmentDate)
        const performerName =
          performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'

        await bulkCreateObservation.mutateAsync({
          encounterId,
          patientId: patientData?.patient?.id || patientData?.id,
          observations,
          performerId: String(values.performerId),
          performerName: performerName
        })
        message.success('Data Skrining Nyeri & GCS berhasil disimpan')
        form.setFieldValue('assessment_date', dayjs())
      } else {
        message.warning('Tidak ada data yang disimpan')
      }
    } catch (error) {
      console.error('Error saving GCS/Pain assessment:', error)
      message.error('Gagal menyimpan data')
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      className="flex flex-col gap-4"
      onFinish={handleFinish}
      initialValues={{
        assessment_date: dayjs(),
        nurse_name: 'Perawat Jaga',
        pain_scale_score: 0
      }}
    >
      <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

      <Card title="Pemeriksaan GCS (Glasgow Coma Scale)" className="py-4">
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-2">Respon Mata (Eye)</h4>
          <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-2 text-left w-2/3">Kriteria</th>
                <th className="p-2 text-center w-1/6">Skor</th>
                <th className="p-2 text-center w-1/6">Pilih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { score: 4, label: 'Spontan (Membuka mata spontan)' },
                { score: 3, label: 'Terhadap Suara (Membuka dengan perintah)' },
                { score: 2, label: 'Terhadap Nyeri (Membuka dengan rangsang nyeri)' },
                { score: 1, label: 'Tidak Ada Respon' }
              ].map((item) => (
                <tr
                  key={item.score}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${gcsEye === item.score ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setGcsEye(item.score)
                  }}
                >
                  <td className="p-2">{item.label}</td>
                  <td className="p-2 text-center font-bold text-gray-500">{item.score}</td>
                  <td className="p-2 text-center">
                    <Radio checked={gcsEye === item.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-2">Respon Verbal (Verbal)</h4>
          <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-2 text-left w-2/3">Kriteria</th>
                <th className="p-2 text-center w-1/6">Skor</th>
                <th className="p-2 text-center w-1/6">Pilih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { score: 5, label: 'Orientasi Baik (Menjawab dengan benar)' },
                { score: 4, label: 'Bingung (Kalimat membingungkan)' },
                { score: 3, label: 'Kata Tidak Tepat (Kata-kata tidak nyambung)' },
                { score: 2, label: 'Suara Tidak Jelas (Mengerang)' },
                { score: 1, label: 'Tidak Ada Respon' }
              ].map((item) => (
                <tr
                  key={item.score}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${gcsVerbal === item.score ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setGcsVerbal(item.score)
                  }}
                >
                  <td className="p-2">{item.label}</td>
                  <td className="p-2 text-center font-bold text-gray-500">{item.score}</td>
                  <td className="p-2 text-center">
                    <Radio checked={gcsVerbal === item.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Motor Response */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">Respon Motorik (Motor)</h4>
          <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="p-2 text-left w-2/3">Kriteria</th>
                <th className="p-2 text-center w-1/6">Skor</th>
                <th className="p-2 text-center w-1/6">Pilih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { score: 6, label: 'Mengikuti Perintah' },
                { score: 5, label: 'Melokalisir Nyeri' },
                { score: 4, label: 'Fleksi Normal (Menghindar nyeri)' },
                { score: 3, label: 'Fleksi Abnormal (Dekortikasi)' },
                { score: 2, label: 'Ekstensi Abnormal (Deserebrasi)' },
                { score: 1, label: 'Tidak Ada Respon' }
              ].map((item) => (
                <tr
                  key={item.score}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${gcsMotor === item.score ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setGcsMotor(item.score)
                  }}
                >
                  <td className="p-2">{item.label}</td>
                  <td className="p-2 text-center font-bold text-gray-500">{item.score}</td>
                  <td className="p-2 text-center">
                    <Radio checked={gcsMotor === item.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-sm font-medium">Total Skor GCS (E+V+M)</div>
            <div className="text-3xl font-bold text-blue-600">{gcsTotal > 0 ? gcsTotal : '-'}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-sm font-medium">Kesimpulan</div>
            <div className="text-xl font-bold text-gray-800">{getGCSConclusion(gcsTotal)}</div>
          </div>
        </div>
      </Card>

      <Form.Item>
        <div className="flex justify-end">
          <Button type="primary" size="large" icon={<SaveOutlined />} onClick={() => form.submit()}>
            Simpan Skrining Nyeri & GCS
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}
