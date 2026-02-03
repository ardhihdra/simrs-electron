import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Radio, Select, Spin } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NUTRITION_MAP } from '../../config/observation-maps'
import {
  createObservationBatch,
  mapRiskLevelToHL7Code,
  OBSERVATION_CATEGORIES
} from '../../utils/observation-builder'
import { AssessmentHeader } from './Assessment/AssessmentHeader'
import { useBulkCreateObservation } from '../../hooks/query/use-observation'

const WEIGHT_LOSS_OPTIONS = [
  { score: 0, criteria: 'Tidak ada penurunan berat badan', label: 'no' },
  { score: 2, criteria: 'Tidak yakin / Tidak tahu / Terasa baju lebih longgar', label: 'unsure' },
  { score: 1, criteria: 'Ya, penurunan 1 - 5 kg', label: '1-5' },
  { score: 2, criteria: 'Ya, penurunan 6 - 10 kg', label: '6-10' },
  { score: 3, criteria: 'Ya, penurunan 11 - 15 kg', label: '11-15' },
  { score: 4, criteria: 'Ya, penurunan > 15 kg', label: '>15' }
]

const EATING_POORLY_OPTIONS = [
  { score: 0, criteria: 'Tidak', label: 'no' },
  { score: 1, criteria: 'Ya', label: 'yes' }
]

export const NutritionScreeningForm = ({
  encounterId,
  patientId
}: {
  encounterId: string
  patientId: string
}) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [totalScore, setTotalScore] = useState(0)

  const { data: observationData, isLoading } = useQuery({
    queryKey: ['observations', encounterId, 'nutrition'],
    queryFn: async () => {
      const fn = window.api?.query?.observation?.getByEncounter
      if (!fn) throw new Error('API Unavailable')
      const res = await fn({ encounterId })
      return res?.result?.all || []
    }
  })

  const bulkCreateObservation = useBulkCreateObservation()

  const { data: performersData, isLoading: isLoadingPerformers } = useQuery({
    queryKey: ['kepegawaian', 'list', 'perawat'],
    queryFn: async () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      const res = await fn()
      if (res.success && res.result) {
        return res.result
          .filter((p: any) => p.hakAksesId === 'nurse')
          .map((p: any) => ({
            id: p.id,
            name: p.namaLengkap
          }))
      }
      return []
    }
  })

  const calculateScore = useCallback(() => {
    const values = form.getFieldsValue()

    const weightLossItem = WEIGHT_LOSS_OPTIONS.find((o) => o.criteria === values.mst_weight_loss)
    const eatingItem = EATING_POORLY_OPTIONS.find((o) => o.criteria === values.mst_eating_poorly)

    const score = (weightLossItem?.score || 0) + (eatingItem?.score || 0)
    setTotalScore(score)
    return score
  }, [form])

  // Auto-fill Logic
  useEffect(() => {
    if (observationData && observationData.length > 0) {
      const relevantObs = observationData.filter((obs: any) =>
        obs.codeCoding?.some((coding: any) => Object.keys(NUTRITION_MAP).includes(coding.code))
      )

      if (relevantObs.length > 0) {
        const initialValues: any = {}

        Object.entries(NUTRITION_MAP).forEach(([code, fieldName]) => {
          const found = relevantObs.find((obs: any) =>
            obs.codeCoding?.some((coding: any) => coding.code === code)
          )
          if (found) {
            if (found.valueString && fieldName !== 'mst_risk_level') {
              initialValues[fieldName] = found.valueString
            } else if (found.valueQuantity) {
              if (fieldName === 'mst_weight_loss') {
                const match = WEIGHT_LOSS_OPTIONS.find((o) => o.score === found.valueQuantity.value)
                if (match) initialValues[fieldName] = match.criteria
              } else if (fieldName === 'mst_eating_poorly') {
                const match = EATING_POORLY_OPTIONS.find(
                  (o) => o.score === found.valueQuantity.value
                )
                if (match) initialValues[fieldName] = match.criteria
              }
            }
          }
        })

        if (relevantObs[0].effectiveDateTime) {
          initialValues['screening_date'] = dayjs(relevantObs[0].effectiveDateTime)
          initialValues['assessment_date'] = dayjs(relevantObs[0].effectiveDateTime)
        }
        if (relevantObs[0].performers?.[0]?.reference) {
          initialValues['performerId'] = Number(relevantObs[0].performers[0].reference)
        }

        form.setFieldsValue(initialValues)
        setTimeout(calculateScore, 0)
      }
    } else {
      form.setFieldsValue({
        screening_date: dayjs(),
        assessment_date: dayjs()
      })
    }
  }, [observationData, form, calculateScore])

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const weightLossItem = WEIGHT_LOSS_OPTIONS.find((o) => o.criteria === data.mst_weight_loss)
      const eatingItem = EATING_POORLY_OPTIONS.find((o) => o.criteria === data.mst_eating_poorly)

      const score = (weightLossItem?.score || 0) + (eatingItem?.score || 0)

      let riskLevel = 'Risiko Rendah'
      if (score >= 2) {
        riskLevel = 'Risiko Tinggi'
      }

      const interpretation = mapRiskLevelToHL7Code(riskLevel)

      const screeningDate = data.assessment_date || data.screening_date || dayjs()
      const observations = createObservationBatch(
        [
          {
            category: OBSERVATION_CATEGORIES.NUTRITION,
            code: '44876-8',
            display: 'MST - Weight Loss Score',
            valueString: data.mst_weight_loss,
            valueQuantity: { value: weightLossItem?.score || 0, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.NUTRITION,
            code: '44875-0',
            display: 'MST - Eating Poorly Score',
            valueString: data.mst_eating_poorly,
            valueQuantity: { value: eatingItem?.score || 0, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.NUTRITION,
            code: '56078-9',
            display: 'MST - Total Score',
            valueQuantity: { value: score, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.NUTRITION,
            code: 'nutrition-risk',
            display: 'Malnutrition Risk Assessment',
            valueString: riskLevel,
            interpretations: [interpretation]
          }
        ],
        screeningDate
      )

      const performerName =
        performersData?.find((p: any) => p.id === data.performerId)?.name || 'Unknown'

      return bulkCreateObservation.mutateAsync({
        encounterId,
        patientId,
        observations,
        performerId: String(data.performerId),
        performerName: performerName
      })
    },
    onSuccess: () => {
      message.success('Skrining Gizi berhasil disimpan')
      queryClient.invalidateQueries({ queryKey: ['observations', encounterId] })
    },
    onError: () => {
      message.error('Gagal menyimpan data')
    }
  })

  const renderItem = (name: string, items: any[]) => {
    return (
      <Form.Item name={name} className="mb-0">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 border-r border-gray-200 w-2/3">Keterangan</th>
              <th className="p-4 border-r border-gray-200 w-1/6">Pilih</th>
              <th className="p-4 w-1/6 text-center">Skor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((item) => {
              const isSelected = form.getFieldValue(name) === item.criteria
              return (
                <tr
                  key={item.label}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    form.setFieldValue(name, item.criteria)
                    calculateScore()
                  }}
                >
                  <td className="p-4 border-r border-gray-100 text-gray-700 font-medium">
                    {item.criteria}
                  </td>
                  <td className="p-4 border-r border-gray-100">
                    <Radio
                      checked={isSelected}
                      value={item.criteria}
                      className="font-semibold text-gray-800"
                    >
                      Pilih
                    </Radio>
                  </td>
                  <td className="p-4 text-center">
                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {item.score}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Form.Item>
    )
  }

  if (isLoading)
    return (
      <div className="p-12 text-center">
        <Spin tip="Memuat..." />
      </div>
    )

  return (
    <Form
      form={form}
      layout="vertical"
      className="flex flex-col gap-4"
      onValuesChange={() => calculateScore()}
      onFinish={(values) => saveMutation.mutate(values)}
    >
      <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

      <Card title="MST (Malnutrition Screening Tool) - Parameter Skrining Gizi">
        <div className="mb-6">
          <h4 className="font-bold text-gray-700 mb-3 ml-1">
            1. Apakah pasien mengalami penurunan berat badan yang tidak direncanakan/diinginkan
            dalam 6 bulan terakhir?
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {renderItem('mst_weight_loss', WEIGHT_LOSS_OPTIONS)}
          </div>
        </div>
        <div className="mb-6">
          <h4 className="font-bold text-gray-700 mb-3 ml-1">
            2. Apakah asupan makan pasien berkurang karena tidak nafsu makan?
          </h4>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {renderItem('mst_eating_poorly', EATING_POORLY_OPTIONS)}
          </div>
        </div>
        <div
          className={`p-6 rounded-xl border flex items-center justify-between transition-all duration-300 ${
            totalScore >= 2
              ? 'bg-red-50 border-red-200  shadow-red-100'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex flex-col gap-1">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Total Skor MST
            </div>
            <div
              className={`text-4xl font-black ${
                totalScore >= 2 ? 'text-red-700' : 'text-green-700'
              }`}
            >
              {totalScore}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider text-right">
              Tingkat Risiko
            </div>
            <div
              className={`px-4 py-1.5 rounded-full text-sm font-bold  ${
                totalScore >= 2 ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}
            >
              {totalScore >= 2 ? 'Berisiko Malnutrisi (High Risk)' : 'Tidak Berisiko (Low Risk)'}
            </div>
            {totalScore >= 2 && (
              <div className="text-[11px] text-red-600 font-bold mt-1 animate-pulse italic">
                * Lapor ke Dietisien untuk asesmen gizi lanjut (NCP)!
              </div>
            )}
          </div>
        </div>
      </Card>

      <Form.Item>
        <div className="flex justify-end gap-2">
          <Button size="large">Reset</Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={saveMutation.isPending}
            onClick={() => form.submit()}
          >
            Simpan Skrining Gizi
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}
