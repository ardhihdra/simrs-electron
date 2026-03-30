import { SaveOutlined } from '@ant-design/icons'
import { useBulkCreateObservation, useQueryObservationByEncounter } from '@renderer/hooks/query/use-observation'
import {
  createObservation,
  OBSERVATION_CATEGORIES,
  OBSERVATION_SYSTEMS
} from '@renderer/utils/builders/observation-builder'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Form, Radio, Spin } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'

interface FallRiskAssessmentFormProps {
  encounterId: string
  patientId: string
}

export const FallRiskAssessmentForm = ({ encounterId, patientId }: FallRiskAssessmentFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [scaleType, setScaleType] = useState('Morse Fall Scale')
  const [totalScore, setTotalScore] = useState(0)
  const [riskLevel, setRiskLevel] = useState('')
  const [interpretationCode, setInterpretationCode] = useState({ code: '', display: '' })

  const { data: observationRaw, isLoading } = useQueryObservationByEncounter(encounterId)
  const observationData = useMemo(
    () => observationRaw?.result || { all: [], grouped: { vitalSigns: [], anamnesis: [], physicalExam: [], other: [] } },
    [observationRaw]
  )

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

  const calculateRisk = useCallback(
    (type = scaleType) => {
      const values = form.getFieldsValue()
      let score = 0
      let level = ''
      let interpCode = { code: '', display: '' }

      if (type === 'Morse Fall Scale') {
        score =
          (values.history_falling || 0) +
          (values.secondary_diagnosis || 0) +
          (values.ambulatory_aid || 0) +
          (values.iv_therapy || 0) +
          (values.gait || 0) +
          (values.mental_status || 0)

        // Asumsi interpretasi berdasarkan standar Kemkes OI0000xx
        if (score >= 45) {
          level = 'Risiko tinggi'
          interpCode = { code: 'OI000028', display: '≥ 45 (Risiko tinggi)' }
        } else if (score >= 25) {
          level = 'Risiko sedang'
          interpCode = { code: 'OI000027', display: '25 - 44 (Risiko sedang)' }
        } else {
          level = 'Risiko rendah'
          interpCode = { code: 'OI000026', display: '0 - 24 (Risiko rendah)' }
        }
      } else if (type === 'Humpty Dumpty Scale') {
        score =
          (values.hd_age || 0) +
          (values.hd_gender || 0) +
          (values.hd_diagnosis || 0) +
          (values.hd_cognitive || 0) +
          (values.hd_environmental || 0) +
          (values.hd_surgery || 0) +
          (values.hd_medication || 0)

        if (score >= 12) {
          level = 'Risiko tinggi'
          interpCode = { code: 'OI000022', display: '≥ 12 (Risiko tinggi)' }
        } else {
          level = 'Risiko rendah'
          interpCode = { code: 'OI000021', display: '7 - 11 (Risiko rendah)' }
        }
      } else if (type === 'Edmonson Scale') {
        score =
          (values.ed_age || 0) +
          (values.ed_mental || 0) +
          (values.ed_elimination || 0) +
          (values.ed_medication || 0) +
          (values.ed_diagnosis || 0) +
          (values.ed_ambulation || 0) +
          (values.ed_nutrition || 0) +
          (values.ed_sleep || 0)

        if (score >= 90) {
          level = 'Risiko tinggi'
          interpCode = { code: 'OI000024', display: '≥ 90 (Risiko tinggi)' }
        } else {
          level = 'Tidak Berisiko / Risiko Rendah'
          interpCode = { code: 'OI000023', display: '0 - 89 (Risiko rendah)' }
        }
      }

      setTotalScore(score)
      setRiskLevel(level)
      setInterpretationCode(interpCode)
    },
    [form, scaleType]
  )

  useEffect(() => {
    const result = observationData ? observationData?.all : []
    if (result && result.length > 0) {
      const sortedObs = [...result].sort(
        (a: any, b: any) =>
          dayjs(b.effectiveDateTime || b.issued || b.createdAt).valueOf() -
          dayjs(a.effectiveDateTime || a.issued || a.createdAt).valueOf()
      )

      // Find the main fall risk observation
      const relevantObs = sortedObs.filter(
        (obs: any) =>
          obs.category === OBSERVATION_CATEGORIES.EXAM &&
          ['59461-4', 'OC000035', 'OC000036'].includes(obs.code)
      )

      if (relevantObs.length > 0) {
        const firstObs = relevantObs[0] as any
        const preloadedPerformerId = firstObs?.performers?.[0]?.practitionerId
        const preloadedDate = firstObs?.effectiveDateTime

        form.setFieldsValue({
          assessment_date: preloadedDate ? dayjs(preloadedDate) : dayjs(),
          ...(preloadedPerformerId ? { performerId: Number(preloadedPerformerId) } : {})
        })

        // Just guess scale based on which code they used last
        if (firstObs.code === '59461-4') setScaleType('Morse Fall Scale')
        else if (firstObs.code === 'OC000035') setScaleType('Humpty Dumpty Scale')
        else if (firstObs.code === 'OC000036') setScaleType('Edmonson Scale')

        // Let use calculation trigger reset of displays safely later
      } else {
        form.setFieldsValue({ assessment_date: dayjs() })
      }
    } else {
      form.setFieldsValue({
        assessment_date: dayjs()
      })
    }
  }, [observationData, form])

  const handleValuesChange = () => {
    calculateRisk()
  }

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const assessmentDate = data.assessment_date || dayjs()
      const obsToCreate: any[] = []

      const baseInterpretation = {
        code: interpretationCode.code,
        display: interpretationCode.display,
        system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
        text: riskLevel
      }

      const scorePayload = {
        value: totalScore,
        unit: '{score}',
        system: 'http://unitsofmeasure.org',
        code: '{score}'
      }

      if (scaleType === 'Morse Fall Scale') {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: '59461-4',
          display: 'Fall risk level [Morse Fall Scale]',
          system: OBSERVATION_SYSTEMS.LOINC,
          codeCoding: [
            {
              system: OBSERVATION_SYSTEMS.LOINC,
              code: '59461-4',
              display: 'Fall risk level [Morse Fall Scale]'
            }
          ],
          valueQuantity: scorePayload,
          interpretations: [baseInterpretation]
        })
      } else if (scaleType === 'Humpty Dumpty Scale') {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: 'OC000035',
          display: 'Humpty Dumpty Scale',
          system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
          codeCoding: [
            {
              system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
              code: 'OC000035',
              display: 'Humpty Dumpty Scale'
            }
          ],
          valueQuantity: scorePayload,
          interpretations: [baseInterpretation]
        })
      } else if (scaleType === 'Edmonson Scale') {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: 'OC000036',
          display: 'Edmonson Psychiatric Fall Risk Assessment',
          system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
          codeCoding: [
            {
              system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
              code: 'OC000036',
              display: 'Edmonson Psychiatric Fall Risk Assessment'
            }
          ],
          valueQuantity: scorePayload,
          interpretations: [baseInterpretation]
        })
      }

      const observations = obsToCreate.map((obs) => {
        const wrapped = createObservation({ ...obs, effectiveDateTime: assessmentDate })
        wrapped.interpretations = obs.interpretations.map((interp) => ({
          ...interp,
          coding: [
            {
              system: interp.system,
              code: interp.code,
              display: interp.display
            }
          ],
          text: interp.text
        }))
        return wrapped
      })

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
      message.success('Data Risiko Jatuh berhasil disimpan')
      queryClient.invalidateQueries({ queryKey: ['observations', encounterId] })
      form.resetFields(['performerId'])
      form.setFieldValue('assessment_date', dayjs())
    },
    onError: (err) => {
      console.error('Failed to save fall risk assessment:', err)
      message.error(`Gagal menyimpan data: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  })

  const renderTable = (label, name, items) => {
    return (
      <div className="mb-8">
        <h4 className="font-bold  mb-3 ml-1">{label}</h4>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <Form.Item name={name} className="mb-0">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-600 font-semibold border-b border-white/10 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 border-r border-white/10 w-1/3">Keterangan</th>
                  <th className="p-4 border-r border-white/10 w-1/3">Pilih</th>
                  <th className="p-4 w-1/6 text-center">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 ">
                {items.map((item) => {
                  const isSelected = form.getFieldValue(name) === item.score
                  return (
                    <tr
                      key={`${item.score}-${item.label}`}
                      className={`cursor-pointer transition-all duration-200`}
                      onClick={() => {
                        form.setFieldValue(name, item.score)
                        calculateRisk()
                      }}
                    >
                      <td className="p-4 border-r border-white/10 font-medium">{item.criteria}</td>
                      <td className="p-4 border-r border-white/10">
                        <Radio checked={isSelected} value={item.score} className="font-semibold ">
                          {item.label}
                        </Radio>
                      </td>
                      <td className="p-4 text-center">
                        <Card
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {item.score}
                        </Card>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Form.Item>
        </div>
      </div>
    )
  }

  if (isLoading)
    return (
      <div className="p-12 text-center">
        <Spin tip="Memuat data..." />
      </div>
    )

  return (
    <Form
      form={form}
      layout="vertical"
      className="flex flex-col gap-4"
      onValuesChange={handleValuesChange}
      onFinish={(values) => {
        saveMutation.mutate(values)
      }}
      onFinishFailed={() => {
        message.error('Mohon lengkapi semua field yang wajib diisi')
      }}
    >
      <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

      <Card title={`Parameter Risiko Jatuh (${scaleType})`}>
        <div className="mb-6">
          <Form.Item label="Pilih Skala Risiko Jatuh" className="mb-0">
            <Radio.Group
              value={scaleType}
              onChange={(e) => {
                form.resetFields()
                setScaleType(e.target.value)
                setTotalScore(0)
                setRiskLevel('')
              }}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="Morse Fall Scale">Morse Fall Scale (Dewasa)</Radio.Button>
              <Radio.Button value="Humpty Dumpty Scale">Humpty Dumpty Scale (Anak)</Radio.Button>
              <Radio.Button value="Edmonson Scale">Edmonson Scale (Jiwa)</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </div>

        {scaleType === 'Morse Fall Scale' && (
          <div className="mt-6">
            {renderTable(
              '1. Riwayat jatuh: apakah lansia pernah jatuh dalam 3 bulan terakhir?',
              'history_falling',
              [
                { score: 0, criteria: 'Tidak pernah jatuh', label: 'Tidak' },
                { score: 25, criteria: 'Pernah jatuh', label: 'Ya' }
              ]
            )}
            {renderTable(
              '2. Diagnosis sekunder: apakah lansia memiliki lebih dari satu penyakit?',
              'secondary_diagnosis',
              [
                { score: 0, criteria: 'Tidak ada diagnosis sekunder', label: 'Tidak' },
                { score: 15, criteria: 'Ada diagnosis sekunder', label: 'Ya' }
              ]
            )}
            {renderTable('3. Alat bantu jalan:', 'ambulatory_aid', [
              { score: 0, criteria: 'Bed rest / dibantu perawat', label: 'Bed Rest' },
              { score: 15, criteria: 'Kruk / tongkat / walker', label: 'Kruk/Tongkat' },
              {
                score: 30,
                criteria: 'Berpegangan pada benda-benda sekitar (Furniture)',
                label: 'Furniture'
              }
            ])}
            {renderTable('4. Terpasang infus / heparin lock:', 'iv_therapy', [
              { score: 0, criteria: 'Tidak terpasang', label: 'Tidak' },
              { score: 20, criteria: 'Terpasang infus', label: 'Ya' }
            ])}
            {renderTable('5. Gaya berjalan / cara berpindah:', 'gait', [
              { score: 0, criteria: 'Normal / Bed rest / Immobile', label: 'Normal' },
              { score: 10, criteria: 'Lemah', label: 'Lemah' },
              { score: 20, criteria: 'Terganggu', label: 'Terganggu' }
            ])}
            {renderTable('6. Status Mental:', 'mental_status', [
              { score: 0, criteria: 'Menyadari kondisi sendiri', label: 'Sadar' },
              { score: 15, criteria: 'Dimensia / Keterbatasan daya ingat', label: 'Keterbatasan' }
            ])}
          </div>
        )}

        {scaleType === 'Humpty Dumpty Scale' && (
          <div className="mt-6">
            {renderTable('1. Usia', 'hd_age', [
              { score: 4, criteria: '< 3 Tahun', label: '< 3 Thn' },
              { score: 3, criteria: '3 - 7 Tahun', label: '3-7 Thn' },
              { score: 2, criteria: '7 - 13 Tahun', label: '7-13 Thn' },
              { score: 1, criteria: '> 13 Tahun', label: '> 13 Thn' }
            ])}
            {renderTable('2. Jenis Kelamin', 'hd_gender', [
              { score: 2, criteria: 'Laki-laki', label: 'Laki-laki' },
              { score: 1, criteria: 'Perempuan', label: 'Perempuan' }
            ])}
            {renderTable('3. Diagnosis', 'hd_diagnosis', [
              { score: 4, criteria: 'Diagnosis neurologi', label: 'Neurologi' },
              {
                score: 3,
                criteria:
                  'Perubahan oksigenasi (respiratorik, dehidrasi, anemia, anoreksia, sinkop, sakit kepala, dll)',
                label: 'Oksigenasi'
              },
              { score: 2, criteria: 'Gangguan perilaku / psikiatri', label: 'Psikiatri' },
              { score: 1, criteria: 'Diagnosis lain', label: 'Lainnya' }
            ])}
            {renderTable('4. Gangguan Kognitif', 'hd_cognitive', [
              { score: 3, criteria: 'Tidak menyadari keterbatasan dirinya', label: 'Tdk Sadar' },
              { score: 2, criteria: 'Lupa akan adanya keterbatasan', label: 'Lupa' },
              {
                score: 1,
                criteria: 'Orientasi baik terhadap diri sendiri',
                label: 'Orientasi Baik'
              }
            ])}
            {renderTable('5. Faktor Lingkungan', 'hd_environmental', [
              {
                score: 4,
                criteria: 'Riwayat jatuh / bayi diletakkan di tempat tidur dewasa',
                label: 'Riwayat Jatuh'
              },
              {
                score: 3,
                criteria: 'Pasien menggunakan alat bantu / bayi diletakkan dalam tempat tidur bayi',
                label: 'Alat Bantu'
              },
              { score: 2, criteria: 'Pasien diletakkan di tempat tidur', label: 'Bed' },
              { score: 1, criteria: 'Area di luar rumah sakit', label: 'Luar RS' }
            ])}
            {renderTable('6. Respon thd Operasi/Sedasi/Anestesi', 'hd_surgery', [
              { score: 3, criteria: 'Dalam 24 jam', label: '< 24 Jam' },
              { score: 2, criteria: 'Dalam 48 jam', label: '< 48 Jam' },
              {
                score: 1,
                criteria: '> 48 jam / tidak menjalani pembedahan/sedasi/anestesi',
                label: '> 48 Jam / Tdk Ada'
              }
            ])}
            {renderTable('7. Penggunaan Obat', 'hd_medication', [
              {
                score: 3,
                criteria:
                  'Penggunaan multipel: sedatif, obat hipnosis, barbiturat, fenotiazin, antidepresan, pencahar, diuretik, narkotik',
                label: 'Multipel/High Risk'
              },
              { score: 2, criteria: 'Penggunaan salah satu obat di atas', label: 'Satu Obat' },
              {
                score: 1,
                criteria: 'Penggunaan medikasi lainnya / tidak ada medikasi',
                label: 'Lainnya / Tdk Ada'
              }
            ])}
          </div>
        )}

        {scaleType === 'Edmonson Scale' && (
          <div className="mt-6">
            {renderTable('1. Usia', 'ed_age', [
              { score: 8, criteria: 'Kurang dari 50 tahun', label: '< 50 Thn' },
              { score: 10, criteria: '50 - 79 tahun', label: '50-79 Thn' },
              { score: 26, criteria: 'Lebih dari 80 tahun', label: '> 80 Thn' }
            ])}
            {renderTable('2. Status Mental', 'ed_mental', [
              {
                score: 4,
                criteria: 'Sadar penuh / orientasi baik sepanjang waktu',
                label: 'Sadar'
              },
              { score: 12, criteria: 'Agitasi / Gelisah', label: 'Gelisah' },
              { score: 13, criteria: 'Kadang-kadang bingung', label: 'Bingung' },
              { score: 14, criteria: 'Bingung / Disorientasi', label: 'Disorientasi' }
            ])}
            {renderTable('3. Eliminasi', 'ed_elimination', [
              { score: 8, criteria: 'Mandiri dan mampu mengontrol BAB/BAK', label: 'Mandiri' },
              { score: 12, criteria: 'Dower Catheter / Colostomy', label: 'Kateter' },
              { score: 10, criteria: 'Eliminasi dengan bantuan', label: 'Bantuan' },
              {
                score: 12,
                criteria: 'Gangguan eliminasi (Inkontinensia/Enuresis/Diare)',
                label: 'Gangguan'
              },
              {
                score: 12,
                criteria: 'Inkontinensia tetapi mampu bergerak mandiri',
                label: 'Inkon. Mandiri'
              }
            ])}
            {renderTable('4. Pengobatan', 'ed_medication', [
              { score: 10, criteria: 'Tanpa obat-obatan', label: 'No Meds' },
              { score: 10, criteria: 'Obat Jantung', label: 'Jantung' },
              {
                score: 8,
                criteria: 'Obat-obat psikotropika (termasuk Benzodiazepin & Antidepresan)',
                label: 'Psikotropika'
              },
              {
                score: 12,
                criteria: 'Peningkatan dosis obat / obat baru (dalam 24 jam)',
                label: 'Dosis Naik/Baru'
              }
            ])}
            {renderTable('5. Diagnosa', 'ed_diagnosis', [
              { score: 10, criteria: 'Bipolar / Gangguan Schizoaffective', label: 'Bipolar' },
              { score: 8, criteria: 'Penggunaan zat / alkohol', label: 'Zat/Alkohol' },
              { score: 10, criteria: 'Depresi Mayor', label: 'Depresi' },
              { score: 12, criteria: 'Dimensia / Delirium', label: 'Dimensia' }
            ])}
            {renderTable('6. Ambulasi / Keseimbangan', 'ed_ambulation', [
              { score: 7, criteria: 'Mandiri / Langkah mantap', label: 'Mandiri' },
              { score: 8, criteria: 'Menggunakan alat bantu', label: 'Alat Bantu' },
              { score: 10, criteria: 'Vertigo / kelemahan', label: 'Vertigo' },
              {
                score: 8,
                criteria: 'Goyah / membutuhkan bantuan dan menyadari kemampuan',
                label: 'Goyah'
              },
              {
                score: 15,
                criteria: 'Goyah tapi tidak menyadari keterbatasan',
                label: 'Goyah (Tdk Sadar)'
              }
            ])}
            {renderTable('7. Nutrisi', 'ed_nutrition', [
              {
                score: 12,
                criteria: 'Mengkonsumsi sedikit makanan / minuman (dalam 24 jam)',
                label: 'Sedikit'
              },
              { score: 0, criteria: 'Tidak ada kelainan nafsu makan', label: 'Normal' }
            ])}
            {renderTable('8. Gangguan Tidur', 'ed_sleep', [
              { score: 8, criteria: 'Tidak ada gangguan tidur', label: 'Tidak Ada' },
              {
                score: 12,
                criteria: 'Ada gangguan tidur (dilaporkan pasien/keluarga/staf)',
                label: 'Ada Gangguan'
              }
            ])}
          </div>
        )}

        <div
          className={`mt-8 p-6 rounded-xl border flex items-center justify-between transition-all duration-300 border-white/10`}
        >
          <div className="flex flex-col gap-1">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Total Skor {scaleType}
            </div>
            <div
              className={`text-4xl font-black ${
                riskLevel.includes('tinggi')
                  ? 'text-red-700'
                  : riskLevel.includes('sedang')
                    ? 'text-orange-700'
                    : 'text-green-700'
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
                riskLevel.includes('tinggi')
                  ? 'bg-red-600 text-white'
                  : riskLevel.includes('sedang')
                    ? 'bg-orange-500 text-white'
                    : 'bg-green-600 text-white'
              }`}
            >
              {riskLevel || 'Pilih Kriteria'}
            </div>
            {riskLevel.includes('tinggi') && (
              <div className="text-[11px] text-red-600 font-bold mt-1 animate-pulse italic">
                * Implementasi protokol pencegahan jatuh risiko tinggi!
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
            Simpan Penilaian
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}
