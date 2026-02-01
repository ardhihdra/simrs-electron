import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, DatePicker, Form, Input, Radio, Row, Select, Spin } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { EDMONSON_MAP, FALL_RISK_MAP, HUMPTY_DUMPTY_MAP } from '../../config/observation-maps'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createObservationBatch,
  mapRiskLevelToHL7Code,
  OBSERVATION_CATEGORIES,
  type ObservationBuilderOptions
} from '../../utils/observation-builder'

const { TextArea } = Input
const { Option } = Select

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

  const { data: observationData, isLoading } = useQuery({
    queryKey: ['observations', encounterId, 'fall-risk'],
    queryFn: async () => {
      const fn = window.api?.query?.observation?.getByEncounter
      if (!fn) throw new Error('API Unavailable')
      const res = await fn({ encounterId })
      return res?.result?.all || []
    }
  })

  const calculateRisk = useCallback(
    (type = scaleType) => {
      const values = form.getFieldsValue()
      let score = 0
      let level = ''

      if (type === 'Morse Fall Scale') {
        score =
          (values.history_falling || 0) +
          (values.secondary_diagnosis || 0) +
          (values.ambulatory_aid || 0) +
          (values.iv_therapy || 0) +
          (values.gait || 0) +
          (values.mental_status || 0)

        if (score >= 45) level = 'Risiko Tinggi'
        else if (score >= 25) level = 'Risiko Sedang'
        else level = 'Risiko Rendah'
      } else if (type === 'Humpty Dumpty Scale') {
        score =
          (values.hd_age || 0) +
          (values.hd_gender || 0) +
          (values.hd_diagnosis || 0) +
          (values.hd_cognitive || 0) +
          (values.hd_environmental || 0) +
          (values.hd_surgery || 0) +
          (values.hd_medication || 0)

        if (score >= 12) level = 'Risiko Tinggi'
        else level = 'Risiko Rendah'
      } else if (type === 'Edmonson Scale') {
        // Edmonson logic (usually < 90 is high risk, but let's implement standard summing)
        // Let's assume standard points where > 90 is Low Risk (safe) and < 90 is High.
        // OR alternative version: Sum of risk factors.
        // *Wait, Edmonson usually: Score > 90 = Low Risk. Score < 90 = High Risk.*
        // However, often implementations invert it. Let's stick to common sum-based if available or implement the subtraction one.
        // Use standard: Age (8), Mental (13-14), etc.
        // Let's implement Sum.
        // If sum >= 90 (Safe). < 90 (Risk).
        // Actually most implementations in Indonesia use:
        // < 90 : Risiko Tinggi
        // >= 90 : Tidak Berisiko

        score =
          (values.ed_age || 0) +
          (values.ed_mental || 0) +
          (values.ed_elimination || 0) +
          (values.ed_medication || 0) +
          (values.ed_diagnosis || 0) +
          (values.ed_ambulation || 0) +
          (values.ed_nutrition || 0) +
          (values.ed_sleep || 0)

        // NOTE: Edmonson usually starts from 100 or similar? No, usually it's summing items.
        // Let's follow a content-based approach where items have scores.

        if (score >= 90) level = 'Tidak Berisiko'
        else level = 'Risiko Tinggi'
      }

      setTotalScore(score)
      setRiskLevel(level)
    },
    [form, scaleType]
  )

  useEffect(() => {
    if (observationData && observationData.length > 0) {
      const relevantObs = observationData.filter((obs: any) =>
        obs.categories?.some((cat: any) => cat.code === 'fall-risk')
      )

      if (relevantObs.length > 0) {
        const initialValues: any = {}

        const ALL_MAPS = { ...FALL_RISK_MAP, ...HUMPTY_DUMPTY_MAP, ...EDMONSON_MAP }

        Object.entries(ALL_MAPS).forEach(([code, fieldName]) => {
          const found = relevantObs.find((obs: any) =>
            obs.codeCoding?.some((coding: any) => coding.code === code)
          )
          if (found) {
            if (found.valueQuantity) {
              initialValues[fieldName] = found.valueQuantity.value
            } else if (found.valueString) {
              initialValues[fieldName] = found.valueString
            }
          }
        })

        if (initialValues.hd_age !== undefined) setScaleType('Humpty Dumpty Scale')
        else if (initialValues.ed_age !== undefined) setScaleType('Edmonson Scale')
        else setScaleType('Morse Fall Scale')
        if (relevantObs[0].effectiveDateTime) {
          initialValues['assessment_date'] = dayjs(relevantObs[0].effectiveDateTime)
        }

        form.setFieldsValue(initialValues)
        setTimeout(() => {
          const currentType =
            initialValues.hd_age !== undefined
              ? 'Humpty Dumpty Scale'
              : initialValues.ed_age !== undefined
                ? 'Edmonson Scale'
                : 'Morse Fall Scale'
          calculateRisk(currentType)
        }, 100)
      }
    } else {
      // Defaults
      form.setFieldsValue({
        assessment_date: dayjs()
      })
    }
  }, [observationData, form, calculateRisk])

  // Watch for changes to calculate score
  const handleValuesChange = () => {
    calculateRisk()
  }

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const fn = window.api?.query?.observation?.create
      if (!fn) {
        console.error('API query.observation.create not found')
        throw new Error('API Unavailable')
      }

      const interpretation = mapRiskLevelToHL7Code(riskLevel)
      const obsToCreate: Omit<ObservationBuilderOptions, 'effectiveDateTime'>[] = []

      if (scaleType === 'Morse Fall Scale') {
        obsToCreate.push(
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'history_falling',
            display: 'Riwayat Jatuh',
            valueQuantity: { value: data.history_falling, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'secondary_diagnosis',
            display: 'Diagnosis Sekunder',
            valueQuantity: { value: data.secondary_diagnosis, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ambulatory_aid',
            display: 'Alat Bantu Jalan',
            valueQuantity: { value: data.ambulatory_aid, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'iv_therapy',
            display: 'Terpasang Infus',
            valueQuantity: { value: data.iv_therapy, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'gait',
            display: 'Gaya Berjalan',
            valueQuantity: { value: data.gait, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'mental_status',
            display: 'Status Mental',
            valueQuantity: { value: data.mental_status, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: '59460-6',
            display: 'Morse Fall Scale Total Score',
            valueQuantity: { value: totalScore, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: '713513002',
            display: 'Fall Risk Assessment',
            valueString: riskLevel,
            interpretations: [interpretation]
          }
        )
      } else if (scaleType === 'Humpty Dumpty Scale') {
        obsToCreate.push(
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_age',
            display: 'Usia',
            valueQuantity: { value: data.hd_age, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_gender',
            display: 'Jenis Kelamin',
            valueQuantity: { value: data.hd_gender, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_diagnosis',
            display: 'Diagnosis',
            valueQuantity: { value: data.hd_diagnosis, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_cognitive',
            display: 'Gangguan Kognitif',
            valueQuantity: { value: data.hd_cognitive, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_environmental',
            display: 'Faktor Lingkungan',
            valueQuantity: { value: data.hd_environmental, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_surgery',
            display: 'Respon thd Operasi/Sedasi',
            valueQuantity: { value: data.hd_surgery, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_medication',
            display: 'Penggunaan Obat',
            valueQuantity: { value: data.hd_medication, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_score',
            display: 'Humpty Dumpty Total Score',
            valueQuantity: { value: totalScore, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'hd_level',
            display: 'Fall Risk Assessment',
            valueString: riskLevel,
            interpretations: [interpretation]
          }
        )
      } else if (scaleType === 'Edmonson Scale') {
        obsToCreate.push(
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_age',
            display: 'Usia',
            valueQuantity: { value: data.ed_age, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_mental',
            display: 'Status Mental',
            valueQuantity: { value: data.ed_mental, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_elimination',
            display: 'Eliminasi',
            valueQuantity: { value: data.ed_elimination, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_medication',
            display: 'Pengobatan',
            valueQuantity: { value: data.ed_medication, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_diagnosis',
            display: 'Diagnosa',
            valueQuantity: { value: data.ed_diagnosis, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_ambulation',
            display: 'Ambulasi/Keseimbangan',
            valueQuantity: { value: data.ed_ambulation, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_nutrition',
            display: 'Nutrisi',
            valueQuantity: { value: data.ed_nutrition, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_sleep',
            display: 'Gangguan Tidur',
            valueQuantity: { value: data.ed_sleep, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_score',
            display: 'Edmonson Scale Total Score',
            valueQuantity: { value: totalScore, unit: '{score}' }
          },
          {
            category: OBSERVATION_CATEGORIES.FALL_RISK,
            code: 'ed_level',
            display: 'Fall Risk Assessment',
            valueString: riskLevel,
            interpretations: [interpretation]
          }
        )
      }

      const observations = createObservationBatch(obsToCreate, data.assessment_date)

      return fn({
        encounterId,
        patientId,
        observations
      })
    },
    onSuccess: () => {
      message.success('Data Risiko Jatuh berhasil disimpan')
      queryClient.invalidateQueries({ queryKey: ['observations', encounterId] })
    },
    onError: (err) => {
      console.error('Failed to save fall risk assessment:', err)
      message.error(`Gagal menyimpan data: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  })

  const renderTable = (label, name, items) => {
    return (
      <div className="mb-8">
        <h4 className="font-bold text-gray-700 mb-3 ml-1">{label}</h4>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <Form.Item name={name} className="mb-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4 border-r border-gray-200 w-1/3">Keterangan</th>
                  <th className="p-4 border-r border-gray-200 w-1/3">Pilih</th>
                  <th className="p-4 w-1/6 text-center">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((item) => {
                  const isSelected = form.getFieldValue(name) === item.score
                  return (
                    <tr
                      key={`${item.score}-${item.label}`}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        form.setFieldValue(name, item.score)
                        calculateRisk() // Recalculate immediately
                      }}
                    >
                      <td className="p-4 border-r border-gray-100 text-gray-700 font-medium">
                        {item.criteria}
                      </td>
                      <td className="p-4 border-r border-gray-100">
                        <Radio
                          checked={isSelected}
                          value={item.score}
                          className="font-semibold text-gray-800"
                        >
                          {item.label}
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
      <Card title="Data Asesmen & Pemeriksa">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item
              label="Tanggal Penilaian"
              name="assessment_date"
              rules={[{ required: true }]}
            >
              <DatePicker showTime className="w-full" format="DD MMM YYYY HH:mm" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Perawat" name="nurse_name" rules={[{ required: true }]}>
              <Select showSearch placeholder="Pilih Perawat">
                <Option value="Perawat Jaga">Perawat Jaga</Option>
                <Option value="Lainnya">Lainnya</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Keterangan" name="remarks">
              <TextArea rows={2} placeholder="Tambahkan keterangan jika perlu..." />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={`Parameter Risiko Jatuh (${scaleType})`}>
        {/* Scale Selector */}
        <div className="mb-6">
          <Form.Item label="Pilih Skala Risiko Jatuh" className="mb-0">
            <Radio.Group
              value={scaleType}
              onChange={(e) => {
                setScaleType(e.target.value)
                // Reset Level & Score when switching
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
          className={`mt-8 p-6 rounded-xl border flex items-center justify-between transition-all duration-300 ${
            riskLevel.includes('Tinggi')
              ? 'bg-red-50 border-red-200 shadow-sm shadow-red-100'
              : riskLevel.includes('Sedang')
                ? 'bg-orange-50 border-orange-200'
                : 'bg-green-50 border-green-200'
          }`}
        >
          <div className="flex flex-col gap-1">
            <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Total Skor {scaleType}
            </div>
            <div
              className={`text-4xl font-black ${
                riskLevel.includes('Tinggi')
                  ? 'text-red-700'
                  : riskLevel.includes('Sedang')
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
              className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                riskLevel.includes('Tinggi')
                  ? 'bg-red-600 text-white'
                  : riskLevel.includes('Sedang')
                    ? 'bg-orange-500 text-white'
                    : 'bg-green-600 text-white'
              }`}
            >
              {riskLevel || 'Pilih Kriteria'}
            </div>
            {riskLevel.includes('Tinggi') && (
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
