import { useState } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  App,
  Spin,
  Tag,
  Space,
  Avatar,
  Modal,
  Table,
  Tooltip,
  InputNumber
} from 'antd'
import {
  SaveOutlined,
  PlusOutlined,
  UserOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  FormOutlined
} from '@ant-design/icons'
import { useCompositionByEncounter, useUpsertComposition } from '../../hooks/query/use-composition'
import { useObservationByEncounter } from '../../hooks/query/use-observation'
import { useConditionByEncounter } from '../../hooks/query/use-condition'
import { formatObservationSummary } from '../../utils/observation-helpers'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import { COMPOSITION_STATUS_MAP, COMPOSITION_STATUS_COLOR_MAP } from '../../config/composition-maps'
import { AssessmentHeader } from './Assessment/AssessmentHeader'
import { useQuery } from '@tanstack/react-query'
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
  const [isAddingNew, setIsAddingNew] = useState(false)

  const { data: compositionData, isLoading, refetch } = useCompositionByEncounter(encounterId)
  const { data: obsData } = useObservationByEncounter(encounterId)
  const { data: condData } = useConditionByEncounter(encounterId)
  const upsertMutation = useUpsertComposition()

  const { data: performersData, isLoading: isLoadingPerformers } = useQuery({
    queryKey: ['kepegawaian', 'list', 'all'],
    queryFn: async () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      const res = await fn()
      if (res.success && res.result) {
        return res.result
          .filter((p: any) => p.hakAksesId === 'doctor' || p.hakAksesId === 'nurse')
          .map((p: any) => ({
            id: p.id,
            name: p.namaLengkap,
            role: p.hakAksesId
          }))
      }
      return []
    }
  })

  const selectedPerformerId = Form.useWatch('performerId', form)
  const selectedPerformer = performersData?.find((p: any) => p.id === selectedPerformerId)
  const currentRole = selectedPerformer?.role

  const handleSubmit = async (values: any) => {
    try {
      const assessmentDate = values.assessment_date ? dayjs(values.assessment_date) : dayjs()

      await upsertMutation.mutateAsync({
        encounterId,
        patientId: patientData.patient.id,
        doctorId: Number(values.performerId),
        title: 'CPPT - Catatan Perkembangan Pasien Terintegrasi',
        soapSubjective: values.soapSubjective,
        soapObjective: values.soapObjective,
        soapAssessment: values.soapAssessment,
        soapPlan: values.soapPlan,
        status: values.status,
        date: assessmentDate.toISOString()
      })

      const statusMsg = values.status === 'final' ? 'Final' : 'Draft'
      message.success(`CPPT berhasil disimpan (${statusMsg})`)
      form.resetFields()
      setIsAddingNew(false)
      refetch()
      onSaveSuccess?.()
    } catch (error) {
      console.error('Error saving CPPT:', error)
      message.error('Gagal menyimpan CPPT')
    }
  }

  const handleFetchVitals = () => {
    if (!obsData?.result?.all && !condData?.result) {
      message.warning('Tidak ada data asesmen perawat ditemukan')
      return
    }

    const rawObs = obsData?.result?.all || []
    const sortedObs = [...rawObs].sort(
      (a: any, b: any) =>
        dayjs(b.effectiveDateTime || b.issued).valueOf() -
        dayjs(a.effectiveDateTime || a.issued).valueOf()
    )

    const summary = formatObservationSummary(sortedObs, condData?.result || [])
    const { vitalSigns, physicalExamination } = summary

    form.setFieldsValue({
      systolic: vitalSigns.systolicBloodPressure,
      diastolic: vitalSigns.diastolicBloodPressure,
      heartRate: vitalSigns.pulseRate,
      respRate: vitalSigns.respiratoryRate,
      temperature: vitalSigns.temperature,
      consciousness: physicalExamination.consciousness,
      gcs_e: summary.vitalSigns?.gcsEye,
      gcs_v: summary.vitalSigns?.gcsVerbal,
      gcs_m: summary.vitalSigns?.gcsMotor,
      gcs:
        (summary.vitalSigns?.gcsEye || 0) +
          (summary.vitalSigns?.gcsVerbal || 0) +
          (summary.vitalSigns?.gcsMotor || 0) || undefined
    })

    const vitalsParts: string[] = []

    if (vitalSigns.systolicBloodPressure && vitalSigns.diastolicBloodPressure) {
      vitalsParts.push(
        `TD: ${vitalSigns.systolicBloodPressure}/${vitalSigns.diastolicBloodPressure} mmHg`
      )
    }
    if (vitalSigns.pulseRate) vitalsParts.push(`N: ${vitalSigns.pulseRate} x/m`)
    if (vitalSigns.respiratoryRate) vitalsParts.push(`RR: ${vitalSigns.respiratoryRate} x/m`)
    if (vitalSigns.temperature) vitalsParts.push(`S: ${vitalSigns.temperature} °C`)

    const observations = obsData?.result?.all || []
    const findObs = (code: string) => observations.find((o: any) => o.code === code)
    const gcsEye = findObs('9267-5')?.valueQuantity?.value
    const gcsVerbal = findObs('9270-9')?.valueQuantity?.value
    const gcsMotor = findObs('9268-3')?.valueQuantity?.value

    if (gcsEye || gcsVerbal || gcsMotor) {
      const total = (gcsEye || 0) + (gcsVerbal || 0) + (gcsMotor || 0)
      vitalsParts.push(`GCS: E${gcsEye || '-'}V${gcsVerbal || '-'}M${gcsMotor || '-'} (${total})`)
    }

    if (physicalExamination.consciousness) {
      vitalsParts.push(`Kesadaran: ${physicalExamination.consciousness}`)
    }

    if (vitalsParts.length === 0) {
      message.warning('Data TTV kosong')
      return
    }

    const ttvString = `[TTV] ${vitalsParts.join(' | ')} [/TTV]`
    const currentObjective = form.getFieldValue('soapObjective') || ''
    const cleanObjective = currentObjective.replace(/\[TTV\].*?\[\/TTV\]/s, '').trim()

    form.setFieldValue('soapObjective', `${ttvString}\n\n${cleanObjective}`.trim())
    message.success('Data TTV berhasil diambil ke kolom Objective')
  }

  const parseVitals = (text: string) => {
    const match = text.match(/\[TTV\](.*?)\[\/TTV\]/s)
    if (match) {
      const vitalsText = match[1]
      const remainingText = text.replace(/\[TTV\](.*?)\[\/TTV\]/s, '').trim()

      const tags = vitalsText
        .split('|')
        .map((v) => v.trim())
        .map((v, i) => {
          let color = 'blue'
          if (v.startsWith('TD:')) color = 'geekblue'
          if (v.startsWith('N:')) color = 'green'
          if (v.startsWith('RR:')) color = 'cyan'
          if (v.startsWith('S:')) color = 'orange'
          if (v.startsWith('GCS:') || v.startsWith('Kesadaran:')) color = 'purple'

          return (
            <Tag key={i} color={color} className="mr-1 mb-1">
              {v}
            </Tag>
          )
        })

      return { tags, remainingText }
    }
    return { tags: null, remainingText: text }
  }

  const handleEdit = (record: any) => {
    const { remainingText } = parseVitals(record.soapObjective || '')
    form.setFieldsValue({
      soapSubjective: record.soapSubjective,
      soapObjective: remainingText,
      soapAssessment: record.soapAssessment,
      soapPlan: record.soapPlan,
      status: record.status
    })

    form.setFieldValue('soapObjective', record.soapObjective)

    setIsAddingNew(true)
  }

  const handleVerify = async (record: any) => {
    try {
      if (record.status === 'final') return

      const verifierId = selectedPerformerId || record.authorId?.[0] || 1

      await upsertMutation.mutateAsync({
        encounterId,
        patientId: patientData.patient.id,
        doctorId: Number(verifierId),
        ...record,
        status: 'final',
        title: record.title || 'CPPT - Catatan Perkembangan Pasien Terintegrasi',
        soapSubjective: record.soapSubjective,
        soapObjective: record.soapObjective,
        soapAssessment: record.soapAssessment,
        soapPlan: record.soapPlan
      })

      message.success('CPPT berhasil diverifikasi (Final)')
      refetch()
    } catch (error) {
      console.error('Verification failed', error)
      message.error('Gagal verifikasi')
    }
  }

  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Tgl / Jam',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="font-semibold">{dayjs(date).format('DD/MM/YY')}</span>
          <span className="text-gray-500 text-xs">{dayjs(date).format('HH:mm')}</span>
        </div>
      )
    },
    {
      title: 'PPA',
      key: 'ppa',
      width: 180,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar
            icon={<UserOutlined />}
            src={record.authorAvatar}
            className="bg-blue-100 text-blue-600"
          />
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 text-sm">
              {record.author?.namaLengkap || record.authorName || 'PPA Jaga'}
            </span>
            <span className="text-gray-500 text-xs">
              {record.author?.hakAkses?.nama || record.role || 'Dokter/Perawat'}
            </span>
          </div>
        </div>
      )
    },
    {
      title: 'Hasil Pemeriksaan, Analisis & Tindak Lanjut',
      key: 'soap',
      render: (_: any, record: any) => {
        const { tags, remainingText } = parseVitals(record.soapObjective || '')
        return (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex gap-2">
              <span className="font-bold text-gray-400 w-4">S:</span>
              <div className="flex-1 whitespace-pre-wrap">{record.soapSubjective}</div>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-gray-400 w-4">O:</span>
              <div className="flex-1">
                {tags && <div className="mb-2">{tags}</div>}
                <div className="whitespace-pre-wrap">{remainingText || '-'}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-gray-400 w-4">A:</span>
              <div className="flex-1 whitespace-pre-wrap">{record.soapAssessment}</div>
            </div>
          </div>
        )
      }
    },
    {
      title: 'Instruksi PPA',
      key: 'plan',
      width: 250,
      render: (_: any, record: any) => (
        <div className="flex gap-2 text-sm bg-yellow-50 p-2 rounded border border-yellow-100">
          <span className="font-bold text-yellow-600 w-4">P:</span>
          <div className="flex-1 whitespace-pre-wrap">{record.soapPlan}</div>
        </div>
      )
    },
    {
      title: 'Verifikasi',
      key: 'verification',
      width: 150,
      render: (_: any, record: any) => {
        const legalAttester = record.attesters?.find((a: any) => a.mode === 'legal')

        return (
          <div className="flex flex-col gap-2 items-center">
            {record.status !== 'final' && (
              <Space>
                <Tooltip title="Edit CPPT">
                  <Button
                    type="text"
                    shape="circle"
                    onClick={() => handleEdit(record)}
                    icon={<FormOutlined className="text-blue-500 text-lg" />}
                  />
                </Tooltip>
                <Tooltip title="Verifikasi">
                  <Button
                    type="text"
                    shape="circle"
                    onClick={() => handleVerify(record)}
                    icon={
                      <CheckCircleOutlined className="text-gray-300 hover:text-green-500 text-lg transition-colors" />
                    }
                  />
                </Tooltip>
              </Space>
            )}

            {record.status === 'final' && (
              <div className="flex flex-col items-center">
                <CheckCircleOutlined className="text-green-500 text-lg" />
                {legalAttester && (
                  <span className="text-[10px] text-gray-500 text-center mt-1 leading-tight">
                    Verified by <br />
                    <span className="font-semibold text-gray-700">
                      {legalAttester.partyDisplay}
                    </span>
                    <br />
                    {dayjs(legalAttester.time).format('DD/MM/YY HH:mm')}
                  </span>
                )}
              </div>
            )}

            <Tag
              color={COMPOSITION_STATUS_COLOR_MAP[record.status || 'preliminary']}
              className="mt-1"
            >
              {COMPOSITION_STATUS_MAP[record.status?.toLowerCase() || 'preliminary']}
            </Tag>
          </div>
        )
      }
    }
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spin size="large" tip="Memuat CPPT..." />
      </div>
    )
  }

  const cpptHistory = (compositionData?.result || []).filter(
    (comp: any) => comp.title !== 'SOAP Umum'
  )

  return (
    <div className="flex flex-col gap-6">
      <Card
        title={
          <Space>
            <HistoryOutlined /> Catatan Perkembangan Pasien Terintegrasi (CPPT)
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddingNew(true)}>
            Tambah CPPT
          </Button>
        }
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={cpptHistory}
          rowKey="id"
          pagination={false}
          className="border-none"
        />
      </Card>

      <Modal
        title="Input CPPT Baru"
        open={isAddingNew}
        onCancel={() => setIsAddingNew(false)}
        footer={[
          <Button key="back" onClick={() => setIsAddingNew(false)}>
            Batal
          </Button>,
          <Button
            key="draft"
            icon={<SaveOutlined />}
            loading={upsertMutation.isPending}
            onClick={() => {
              form.setFieldValue('status', 'preliminary')
              form.submit()
            }}
          >
            Simpan Draft
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={upsertMutation.isPending}
            onClick={() => {
              form.setFieldValue('status', 'final')
              form.submit()
            }}
          >
            Simpan & Finalisasi
          </Button>
        ]}
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="pt-4"
          initialValues={{
            assessment_date: dayjs(),
            status: 'preliminary'
          }}
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          {currentRole === 'nurse' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6 mt-4">
              <div className="flex justify-between items-center mb-4 border-b border-blue-200 pb-2">
                <div className="font-bold text-blue-700 uppercase text-xs tracking-wider">
                  Data Tanda-Tanda Vital (Dari Monitoring)
                </div>
                <Button
                  type="primary"
                  ghost
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={handleFetchVitals}
                >
                  Ambil Data Terakhir
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                <Form.Item label="Tekanan Darah" style={{ marginBottom: 0 }}>
                  <Space align="start" className="w-full">
                    <Form.Item name="systolic" noStyle>
                      <InputNumber placeholder="-" className="w-[80px]" readOnly disabled />
                    </Form.Item>
                    <span className="text-gray-400 font-light text-lg">/</span>
                    <Form.Item name="diastolic" noStyle>
                      <InputNumber placeholder="-" className="w-[80px]" readOnly disabled />
                    </Form.Item>
                    <span className="text-gray-500 text-xs mt-1">mmHg</span>
                  </Space>
                </Form.Item>

                <Form.Item label="Nadi" name="heartRate" className="mb-0">
                  <InputNumber
                    className="w-full"
                    placeholder="-"
                    addonAfter="x/mnt"
                    readOnly
                    disabled
                  />
                </Form.Item>

                <Form.Item label="Laju Pernafasan (RR)" name="respRate" className="mb-0">
                  <InputNumber
                    className="w-full"
                    placeholder="-"
                    addonAfter="x/mnt"
                    readOnly
                    disabled
                  />
                </Form.Item>

                <Form.Item label="Suhu Tubuh" name="temperature" className="mb-0">
                  <InputNumber
                    className="w-full"
                    placeholder="-"
                    addonAfter="°C"
                    readOnly
                    disabled
                  />
                </Form.Item>

                <Form.Item label="GCS (Terkumpul)" name="gcs" className="mb-0">
                  <Input className="w-full" placeholder="-" readOnly disabled />
                </Form.Item>

                <Form.Item label="Kesadaran" name="consciousness" className="mb-0">
                  <Input className="w-full" placeholder="-" readOnly disabled />
                </Form.Item>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Form.Item
                name="soapSubjective"
                label={<span className="font-bold text-gray-700">Subjective (S)</span>}
                rules={[{ required: true, message: 'Wajib diisi' }]}
                extra="Keluhan utama dan riwayat penyakit saat ini."
              >
                <TextArea
                  rows={5}
                  placeholder="Contoh: Pasien mengeluh nyeri dada sebelah kiri..."
                />
              </Form.Item>

              <Form.Item
                name="soapObjective"
                label={<span className="font-bold text-gray-700">Objective (O)</span>}
                rules={[{ required: false }]}
                extra="Hasil pemeriksaan fisik dan penunjang lainnya."
              >
                <TextArea
                  rows={5}
                  placeholder="Contoh: Cor: BJ I-II reguler, Pulmo: Vesikuler +/+, ..."
                />
              </Form.Item>
            </div>

            <div className="space-y-4">
              <Form.Item
                name="soapAssessment"
                label={<span className="font-bold text-gray-700">Assessment (A)</span>}
                rules={[{ required: true, message: 'Wajib diisi' }]}
                extra="Diagnosis kerja dan diagnosis banding."
              >
                <TextArea rows={5} placeholder="Contoh: NSTEMI, Hipertensi Grade II..." />
              </Form.Item>

              <Form.Item
                name="soapPlan"
                label={<span className="font-bold text-gray-700">Plan (P) / Instruksi</span>}
                rules={[{ required: true, message: 'Wajib diisi' }]}
                extra="Rencana asuhan, pengobatan, dan edukasi."
              >
                <TextArea rows={5} placeholder="Contoh: IVFD RL 20 tpm, Inj. Cuan 1x1..." />
              </Form.Item>
            </div>
          </div>
          <Form.Item name="status" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
