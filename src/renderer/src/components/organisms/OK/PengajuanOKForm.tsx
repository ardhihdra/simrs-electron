import React, { useState, useRef, useMemo } from 'react'
import {
  Form,
  Input,
  Row,
  Col,
  Select,
  Button,
  DatePicker,
  Radio,
  Tag,
  Divider,
  Card,
  Checkbox,
  Typography,
  Upload,
  Alert,
  Tabs
} from 'antd'
import { DeleteOutlined, InboxOutlined, SaveOutlined, ThunderboltOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import bodyMapImage from '@renderer/assets/images/body_map.png'
import { InformedConsentForm } from '../InformedConsentForm'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useOperatingRoomList } from '@renderer/hooks/query/use-operating-room'
import { useCreateOkRequest } from '@renderer/hooks/query/use-ok-request'
import { useCreateQuestionnaireResponse } from '@renderer/hooks/query/use-questionnaire-response'
import { QuestionnaireResponseStatus } from '@renderer/types/questionnaire.types'
import { message } from 'antd'

const { Title, Text } = Typography
const { Dragger } = Upload

// --- Data Constants ---

const SPESIALIS_TINDAKAN = [
  {
    spesialis: 'Bedah Umum',
    tindakan: ['Apendektomi Terbuka', 'Herniorafi', 'Eksisi Tumor Jinak', 'Debridement']
  },
  {
    spesialis: 'Ortopedi',
    tindakan: ['ORIF Fraktur Kecil', 'Lepas Pen', 'Reposisi Tertutup', 'Debridement Ortopedi']
  },
  {
    spesialis: 'Kebidanan & Kandungan',
    tindakan: ['Seksio Sesarea', 'Kuretase', 'Salpingektomi', 'MOW / Sterilisasi']
  }
]

const TINDAKAN_EMERGENCY = [
  {
    spesialis: 'Bedah / Trauma',
    tindakan: ['Laparotomi Eksplorasi', 'Debridement Luka Bakar Berat', 'Tracheostomy']
  },
  {
    spesialis: 'Obstetri (PONEK)',
    tindakan: ['SC Cito', 'Kuretase Abortus Inkomplit', 'Manual Plasenta']
  }
]

interface ServiceConfig {
  label: string
  color: string
  accentColor: string
  tindakanSource: typeof SPESIALIS_TINDAKAN
  defaultStatus: string
  tab4Label: string
  showEmergencyAlert?: boolean
}

const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  rajal: {
    label: 'Rajal',
    color: 'cyan',
    accentColor: 'text-cyan-600',
    tindakanSource: SPESIALIS_TINDAKAN,
    defaultStatus: 'draft',
    tab4Label: 'Surat Praoperasi'
  },
  ranap: {
    label: 'Ranap',
    color: 'emerald',
    accentColor: 'text-emerald-600',
    tindakanSource: SPESIALIS_TINDAKAN,
    defaultStatus: 'draft',
    tab4Label: 'Surat Praoperasi'
  },
  igd: {
    label: 'IGD / CYTO',
    color: 'red',
    accentColor: 'text-red-600',
    tindakanSource: TINDAKAN_EMERGENCY,
    defaultStatus: 'diajukan',
    tab4Label: 'Berkas Cyto',
    showEmergencyAlert: true
  }
}

interface PengajuanOKProps {
  type: 'rajal' | 'ranap' | 'igd'
  encounterId: string
  patientData: any
  onSuccess?: () => void
}

export const PengajuanOKForm: React.FC<PengajuanOKProps> = ({
  type,
  encounterId,
  patientData,
  onSuccess
}) => {
  const [form] = Form.useForm()
  const config = useMemo(() => SERVICE_CONFIGS[type], [type])
  const imgRef = useRef<HTMLImageElement>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [signatures, setSignatures] = useState<Record<string, string>>({})

  const { data: performers, isLoading: loadingPerformers } = usePerformers(['doctor'])
  const { data: operatingRooms, isLoading: loadingRooms } = useOperatingRoomList('available')
  const createOkRequest = useCreateOkRequest()
  const { mutateAsync: createQuestionnaireResponse } = useCreateQuestionnaireResponse()

  const performerOptions = useMemo(
    () =>
      performers?.map((p) => ({
        label: p.name,
        value: Number(p.id)
      })) || [],
    [performers]
  )

  const roomOptions = useMemo(
    () =>
      operatingRooms?.map((r) => ({
        label: `${r.nama} (${r.kelas})`,
        value: Number(r.id)
      })) || [],
    [operatingRooms]
  )

  const handleImageClick = (e: React.MouseEvent) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const note = prompt('Masukkan catatan lokasi (Misal: Sisi Kanan, Level L4-L5):')
    if (note) {
      setMarkers((prev) => [...prev, { id: Date.now(), x, y, note }])
    }
  }

  const removeMarker = (id: number) => {
    setMarkers(markers.filter((m) => m.id !== id))
  }

  const handleFinish = (values: any) => {
    // Mapping prioritas
    const priority = values.sifatOperasi === 'cyto' ? 'emergency' : 'elective'

    // Hitung durasi dalam menit
    let estimatedDurationMinutes = 0
    if (values.rencanaMulai && values.rencanaSelesai) {
      estimatedDurationMinutes = dayjs(values.rencanaSelesai).diff(dayjs(values.rencanaMulai), 'minute')
    }

    const payload = {
      encounterId,
      sourceUnit: type,
      dpjpId: values.perujuk,
      referrerId: values.perujuk,
      surgeonId: values.dokterOperator,
      anesthesiologistId: values.dokterAnestesi,
      operatingRoomId: values.ruangOK,
      scheduledAt: values.rencanaMulai ? dayjs(values.rencanaMulai).toISOString() : null,
      estimatedDurationMinutes,
      priority,
      status: values.status,
      klasifikasi: values.jenisOperasi,
      mainDiagnosis: values.mainDiagnosis,
      plannedProcedureSummary: (values.tindakanDipilih || []).join(', '),
      markers,
      notes: values.catatanBodyMap,
      notes_additional: values.catatanTambahanLokasi // if any
    }

    createOkRequest.mutate(payload, {
      onSuccess: async (res: any) => {
        const okRequestId = res.result?.id

        // Jika ada data informed consent, simpan QuestionnaireResponse
        if (values.receiver_name && okRequestId) {
          try {
            const items = [
              { linkId: 'receiver-name', text: 'Nama Penerima', valueString: values.receiver_name },
              { linkId: 'receiver-birthdate', text: 'Tanggal Lahir Penerima', valueDateTime: values.receiver_birthdate?.toISOString() },
              { linkId: 'receiver-address', text: 'Alamat Penerima', valueString: values.receiver_address },
              { linkId: 'consent-type', text: 'Jenis Persetujuan', valueString: values.consent_type },
              { linkId: 'diagnosis', text: 'Diagnosis (WD & DD)', valueString: values.info_diagnosis, item: [{ linkId: 'diagnosis-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_diagnosis }] },
              { linkId: 'basis', text: 'Dasar Diagnosis', valueString: values.info_basis, item: [{ linkId: 'basis-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_basis }] },
              { linkId: 'procedure', text: 'Tindakan Kedokteran', valueString: values.info_procedure, item: [{ linkId: 'procedure-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_procedure }] },
              { linkId: 'indication', text: 'Indikasi Tindakan', valueString: values.info_indication, item: [{ linkId: 'indication-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_indication }] },
              { linkId: 'method', text: 'Tata Cara', valueString: values.info_method, item: [{ linkId: 'method-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_method }] },
              { linkId: 'objective', text: 'Tujuan', valueString: values.info_objective, item: [{ linkId: 'objective-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_objective }] },
              { linkId: 'risk', text: 'Risiko', valueString: values.info_risk, item: [{ linkId: 'risk-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_risk }] },
              { linkId: 'complication', text: 'Komplikasi', valueString: values.info_complication, item: [{ linkId: 'complication-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_complication }] },
              { linkId: 'prognosis', text: 'Prognosis', valueString: values.info_prognosis, item: [{ linkId: 'prognosis-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_prognosis }] },
              { linkId: 'alternative', text: 'Alternatif & Risiko', valueString: values.info_alternative, item: [{ linkId: 'alternative-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_alternative }] },
              { linkId: 'witness1', text: 'Saksi 1', valueString: values.witness1_name },
              { linkId: 'witness2', text: 'Saksi 2', valueString: values.witness2_name },
              { linkId: 'signature-doctor', text: 'Tanda Tangan Dokter', valueString: signatures['doctor'] },
              { linkId: 'signature-receiver', text: 'Tanda Tangan Penerima', valueString: signatures['receiver'] },
              { linkId: 'signature-witness1', text: 'Tanda Tangan Saksi 1', valueString: signatures['witness1'] },
              { linkId: 'signature-witness2', text: 'Tanda Tangan Saksi 2', valueString: signatures['witness2'] }
            ]

            await createQuestionnaireResponse({
              encounterId,
              subjectId: patientData?.subjectId || patientData?.patient?.id || '',
              status: QuestionnaireResponseStatus.COMPLETED,
              authored: values.assessment_date?.toISOString() || new Date().toISOString(),
              authorId: values.performerId,
              okRequestId: okRequestId,
              items
            })
          } catch (qcErr) {
            console.error('Failed to save Informed Consent part:', qcErr)
          }
        }

        message.success('Pengajuan OK Berhasil dikirim')
        onSuccess?.()
      },
      onError: (err: any) => {
        message.error(`Gagal mengirim pengajuan: ${err.message}`)
      }
    })
  }

  const items = [
    {
      key: '1',
      label: '1. Pengajuan & Penjadwalan',
      children: (
        <div className="flex flex-col gap-4">
          {config.showEmergencyAlert && (
            <Alert
              type="error"
              showIcon
              icon={<ThunderboltOutlined />}
              message="KATEGORI CYTO: Pastikan identitas pasien, sisi operasi (body map), dan jenis tindakan darurat sudah diverifikasi."
              className="mb-2"
            />
          )}

          <section>
            <Title level={5} className={`mb-4 ${config.accentColor}`}>
              Prioritas & Klasifikasi {config.label}
            </Title>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Form.Item name="mainDiagnosis" label="Diagnosis Utama (Free Text)" rules={[{ required: true }]}>
                  <Input.TextArea placeholder="Masukkan diagnosis utama pasien..." rows={2} />
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item
                  name="sifatOperasi"
                  label={<span className="font-semibold text-gray-600">Sifat Operasi</span>}
                  rules={[{ required: true }]}
                >
                  <Radio.Group className="flex gap-4">
                    <Radio value="cyto">
                      <Tag color="red">CYTO</Tag>
                    </Radio>
                    <Radio value="efektif">
                      <Tag color="green">EFEKTIF</Tag>
                    </Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item name="spesialis" label="Spesialisasi" rules={[{ required: true }]}>
                  <Select
                    placeholder="Pilih spesialisasi"
                    options={config.tindakanSource.map((s) => ({
                      label: s.spesialis,
                      value: s.spesialis
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item name="jenisOperasi" label="Jenis Operasi" rules={[{ required: true }]}>
                  <Select
                    placeholder="Pilih jenis"
                    options={[
                      { label: 'Operasi Kecil', value: 'kecil' },
                      { label: 'Operasi Sedang', value: 'sedang' },
                      { label: 'Operasi Besar', value: 'besar' },
                      { label: 'Operasi Khusus', value: 'khusus' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={24}>
                <Form.Item name="status" label="Status">
                  <Select
                    options={[
                      { label: 'Draft', value: 'draft' },
                      { label: 'Diajukan', value: 'diajukan' }
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <Divider />

          <section>
            <Title level={5} className={`mb-4 ${config.accentColor}`}>
              Detail Penjadwalan & Rujukan
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={24} md={12}>
                <Form.Item name="perujuk" label="Dokter Perujuk/DPJP" rules={[{ required: true }]}>
                  <Select
                    placeholder="Pilih dokter"
                    showSearch
                    options={performerOptions}
                    loading={loadingPerformers}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item name="tanggalRujukan" label="Tanggal Rujukan">
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
               <Col span={24} md={8}>
                <Form.Item name="ruangOK" label="Ruang OK Tujuan" rules={[{ required: true }]}>
                  <Select 
                    placeholder="Pilih kamar" 
                    options={roomOptions} 
                    loading={loadingRooms}
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item name="rencanaMulai" label="Rencana Mulai" rules={[{ required: true }]}>
                  <DatePicker
                    className="w-full"
                    showTime={{ format: 'HH:mm' }}
                    format="DD/MM/YYYY HH:mm"
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={8}>
                <Form.Item
                  name="rencanaSelesai"
                  label="Estimasi Selesai"
                  rules={[{ required: true }]}
                >
                  <DatePicker
                    className="w-full"
                    showTime={{ format: 'HH:mm' }}
                    format="DD/MM/YYYY HH:mm"
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item
                  name="dokterOperator"
                  label="Dokter Operator Utama"
                  rules={[{ required: true }]}
                >
                  <Select
                    placeholder="Pilih operator"
                    showSearch
                    options={performerOptions}
                    loading={loadingPerformers}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
              <Col span={24} md={12}>
                <Form.Item
                  name="dokterAnestesi"
                  label="Dokter Anestesi"
                >
                  <Select
                    placeholder="Pilih dokter anestesi"
                    showSearch
                    options={performerOptions}
                    loading={loadingPerformers}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>
            </Row>
          </section>

          <Divider />

          <section>
            <Title level={5} className={`mb-4 ${config.accentColor}`}>
              Penandaan Lokasi Operasi (Body Map)
            </Title>
            <Card
              size="small"
              className={`bg-${config.color === 'red' ? 'red-50/30' : 'gray-50'} border-${config.color}-100`}
            >
              <Row gutter={24}>
                <Col span={24} lg={12}>
                  <div
                    className={`mb-2 bg-${config.color}-50 p-3 rounded text-${config.color}-700 text-xs font-bold border border-${config.color}-200 flex items-center gap-2`}
                  >
                    {config.color === 'red' && <ThunderboltOutlined />}
                    KLIK PADA AREA TUBUH UNTUK MENANDAI LOKASI OPERASI
                  </div>
                  <div
                    className="relative w-full overflow-hidden border border-gray-200 rounded-lg bg-white mb-4 flex justify-center"
                    style={{ minHeight: '450px' }}
                  >
                    <img
                      ref={imgRef}
                      src={bodyMapImage}
                      alt="Body Map"
                      className="h-[440px] w-auto cursor-crosshair block py-2"
                      onClick={handleImageClick}
                    />
                    {markers.map((marker, index) => (
                      <div
                        key={marker.id}
                        style={{
                          position: 'absolute',
                          left: `${marker.x}%`,
                          top: `${marker.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        className="group"
                      >
                        <div
                          className={`w-6 h-6 bg-${config.color}-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold cursor-pointer`}
                        >
                          {index + 1}
                        </div>
                        <div
                          className="absolute -top-10 left-1/2 transform -translate-x-1/2 hidden group-hover:flex bg-white rounded-md shadow-md p-1 cursor-pointer z-10 border border-gray-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMarker(marker.id)
                          }}
                        >
                          <DeleteOutlined className="text-red-500" />
                        </div>
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {marker.note}
                        </div>
                      </div>
                    ))}
                  </div>
                </Col>
                <Col span={24} lg={12}>
                  <div
                    className={`text-xs font-bold ${config.accentColor} mb-4 uppercase tracking-wider`}
                  >
                    Titik Lokasi Insisi / Operasi
                  </div>
                  <div className="flex flex-col gap-4">
                    {markers.length === 0 ? (
                      <Alert
                        message="Harap berikan penanda lokasi operasi pada gambar untuk mempercepat verifikasi tim OK."
                        type={config.color === 'red' ? 'warning' : 'info'}
                        showIcon
                      />
                    ) : (
                      markers.map((m, idx) => (
                        <div
                          key={m.id}
                          className={`flex items-start gap-3 p-3 bg-white border border-${config.color}-100 rounded-lg shadow-sm`}
                        >
                          <Tag color={config.color} className="m-0 mt-1 font-bold">
                            {idx + 1}
                          </Tag>
                          <div className="flex-1 text-sm font-semibold text-gray-800 uppercase italic">
                            {m.note}
                          </div>
                          <Button
                            size="small"
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeMarker(m.id)}
                          />
                        </div>
                      ))
                    )}
                    <Divider />
                    <Form.Item label="Catatan Tambahan Lokasi" name="catatanBodyMap">
                      <Input.TextArea
                        rows={4}
                        placeholder="Jelaskan detail spesifik lokasi jika diperlukan..."
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>
          </section>
        </div>
      )
    },
    {
      key: '2',
      label: '2. Jenis Tindakan & Tarif',
      children: (
        <div className="flex flex-col gap-4">
          <Title level={5} className={config.accentColor}>
            Rencana Tindakan Operasi ({config.label})
          </Title>
          <Form.Item name="tindakanDipilih" noStyle>
            <Checkbox.Group className="w-full">
              {config.tindakanSource.map((group) => (
                <div key={group.spesialis} className="mb-6 last:mb-0">
                  <Divider
                    orientation="left"
                    className={`mt-0 mb-4 font-bold ${config.accentColor} border-${config.color}-100`}
                  >
                    <span className={`bg-${config.color}-50 px-3 py-1 rounded-full text-xs`}>
                      {group.spesialis}
                    </span>
                  </Divider>
                  <Row gutter={[16, 12]}>
                    {group.tindakan.map((t) => (
                      <Col xs={24} sm={12} key={t}>
                        <Checkbox
                          value={`${group.spesialis}::${t}`}
                          className="text-sm font-medium"
                        >
                          {t}
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}
            </Checkbox.Group>
          </Form.Item>
        </div>
      )
    },
    {
      key: '3',
      label: '3. Informed Consent',
      children: (
        <div className="flex flex-col gap-4">
          <InformedConsentForm
            standalone={false}
            externalForm={form}
            hideHeader
            encounterId={encounterId}
            patientData={patientData}
            signatures={signatures}
            onSignatureChange={(type, dataUrl) => setSignatures(prev => ({ ...prev, [type]: dataUrl }))}
          />
        </div>
      )
    },
    {
      key: '4',
      label: `4. ${config.tab4Label}`,
      children: (
        <div className="flex flex-col gap-4">
          <Card
            title={
              <span className={`font-bold ${config.accentColor}`}>Unggah {config.tab4Label}</span>
            }
            size="small"
            className={`shadow-none border-${config.color}-100`}
            extra={
              <Text type="secondary" className="text-xs">
                Wajib: Hasil Lab & Dokumen Pendukung
              </Text>
            }
          >
            <Form.Item name="dokumenPendukung">
              <Dragger
                multiple
                action="http://localhost:3001/upload" // Placeholder
                beforeUpload={() => false} // Manual upload only for demo
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined className={config.accentColor} />
                </p>
                <p className="ant-upload-text">Klik atau seret file ke area ini</p>
                <p className="ant-upload-hint text-xs">
                  Mendukung file tunggal atau sekaligus. Maksimal 10MB per file.
                </p>
              </Dragger>
            </Form.Item>
          </Card>
        </div>
      )
    }
  ]

  return (
    <Card
      title={
        <div className="flex justify-between items-center py-1">
          <div className="flex flex-col">
            <span
              className={`text-gray-700 font-bold uppercase tracking-wider text-xs flex items-center gap-2`}
            >
              {config.color === 'red' && <ThunderboltOutlined />}
              Form Pengajuan Kamar Operasi ({config.label})
            </span>
          </div>
        </div>
      }
      className={`shadow-none border-${config.color}-200 overflow-hidden`}
      bodyStyle={{ padding: '0 24px 24px' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          assessment_date: dayjs(),
          tanggalRencana: dayjs(),
          sifatOperasi: 'efektif',
          status: config.defaultStatus
        }}
        className="pt-6"
      >
        <Tabs
          defaultActiveKey="1"
          items={items}
          className="assessment-tabs"
          size="small"
          tabBarStyle={{ marginBottom: 24 }}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button size="large" onClick={() => form.resetFields()}>
            Reset Form
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            className={`bg-${config.color === 'red' ? 'red-600' : config.color === 'cyan' ? 'cyan-600' : 'emerald-600'} hover:opacity-90 border-none shadow-lg px-8`}
          >
            Submit Pengajuan OK
          </Button>
        </div>
      </Form>
    </Card>
  )
}
