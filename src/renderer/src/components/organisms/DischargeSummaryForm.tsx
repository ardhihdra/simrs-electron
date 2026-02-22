import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Typography,
  Radio,
  Modal,
  Select,
  Table,
  Tag
} from 'antd'
import {
  SaveOutlined,
  PrinterOutlined,
  EditOutlined,
  ClearOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import bodyFront from '../../assets/images/body_front.png'
import bodyBack from '../../assets/images/body_back.png'
import bodyLeft from '../../assets/images/body_left.png'
import bodyRight from '../../assets/images/body_right.png'
import { BodyMappingLetter } from './BodyMappingLetter'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { AssessmentHeader } from './Assessment/AssessmentHeader'
import { Divider } from 'antd'
import {
  useUpsertComposition,
  useCompositionByEncounter
} from '@renderer/hooks/query/use-composition'
import { SECTION_TEMPLATES } from '@renderer/utils/section-templates'
import { SignaturePadModal } from '../molecules/SignaturePadModal'

const { Text } = Typography
const { TextArea } = Input

interface DischargeSummaryFormProps {
  encounterId: string
  patientData: any
}

export const DischargeSummaryForm = ({ encounterId, patientData }: DischargeSummaryFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  const [activeView, setActiveView] = useState('front')
  const [drawingData, setDrawingData] = useState<Record<string, string>>({
    front: '',
    back: '',
    left: '',
    right: ''
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [sigModal, setSigModal] = useState({ visible: false, title: '' })
  const [doctorSig, setDoctorSig] = useState('')

  const viewMap: Record<string, string> = {
    front: bodyFront,
    back: bodyBack,
    left: bodyLeft,
    right: bodyRight
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#ff0000'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'

        if (drawingData[activeView]) {
          const img = new Image()
          img.src = drawingData[activeView]
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
          }
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    }
  }, [activeView, drawingData])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.beginPath()

    if (canvasRef.current) {
      setDrawingData((prev) => ({
        ...prev,
        [activeView]: canvasRef.current!.toDataURL()
      }))
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      setDrawingData((prev) => ({ ...prev, [activeView]: '' }))
    }
  }

  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [formDataForPrint, setFormDataForPrint] = useState<any>(null)

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Resume_Tubuh_${patientData?.patient?.name || ''}`
  })

  const handlePreviewPrint = () => {
    const values = form.getFieldsValue()
    const performer = performersData?.find((p: any) => p.id === values.performerId)
    setFormDataForPrint({
      ...values,
      report_date: values.assessment_date,
      doctor_name: performer?.name || ''
    })
    setIsPreviewVisible(true)
  }

  const { mutate: saveComposition, isPending: isSaving } = useUpsertComposition()

  const { data: compositionData, isLoading: isLoadingHistory } =
    useCompositionByEncounter(encounterId)
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false)

  const historyData = (compositionData?.result || []).filter(
    (comp: any) => comp.title === 'Resume Medis Tubuh'
  )

  const columns = [
    {
      title: 'Tanggal',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Dokter',
      key: 'author',
      render: (_: any, record: any) => record.author?.namaLengkap || record.authorName || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'final' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          size="small"
          onClick={() => {
            const performer = performersData?.find((p: any) => p.id === record.authorId?.[0])

            setFormDataForPrint({
              ...record,
              clinical_description: record.soapSubjective,
              additional_notes: record.soapPlan,
              report_date: dayjs(record.date),
              doctor_name: performer?.name || record.author?.namaLengkap || ''
            })
            setIsPreviewVisible(true)
          }}
        >
          Lihat
        </Button>
      )
    }
  ]

  const handleFinish = (values: any) => {
    const commonSectionData = {
      author: [String(values.performerId)],
      focus: {
        reference: `Patient/${patientData?.patient?.id}`,
        display: patientData?.patient?.name
      },
      mode: 'working',
      entry: [],
      emptyReason: null,
      orderedBy: null
    }

    const sections: any[] = []

    if (Object.values(drawingData).some((v) => v)) {
      const visualDiv = `
        <div xmlns="http://www.w3.org/1999/xhtml">
          <h3>Anotasi Visual Tubuh</h3>
          <p>Temuan visual pada diagram tubuh:</p>
          ${Object.entries(drawingData)
            .map(([view, data]) =>
              data
                ? `<div><strong>${view.toUpperCase()}</strong>:<br/><img src="${data}" alt="${view}" style="max-width:300px;"/></div>`
                : ''
            )
            .join('')}
        </div>
      `

      sections.push({
        title: 'Anotasi Visual (Body Mapping)',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '55107-7',
              display: 'Physical findings of Body structure'
            }
          ]
        },
        text: {
          status: 'generated',
          div: visualDiv
        },
        ...commonSectionData
      })
    }

    if (values.dynamic_sections && values.dynamic_sections.length > 0) {
      values.dynamic_sections.forEach((sec: any) => {
        sections.push({
          title: sec.title,
          code: {
            coding: [
              {
                system: sec.code_system || 'http://loinc.org',
                code: sec.code_code,
                display: sec.code_display
              }
            ]
          },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${sec.text_content?.replace(/\n/g, '<br/>')}</div>`
          },
          ...commonSectionData,
          mode: sec.mode || 'working'
        })
      })
    }

    const payload = {
      encounterId,
      patientId: patientData?.patient?.id,
      doctorId: Number(values.performerId),
      title: 'Resume Medis Tubuh',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '18842-5',
            display: 'Discharge summary'
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: 'http://loinc.org',
              code: 'LP173421-1',
              display: 'Report'
            }
          ]
        }
      ],
      date: values.assessment_date?.toISOString(),
      status: 'final',
      section: sections,
      soapSubjective: values.clinical_description,
      soapPlan: values.additional_notes
    }

    saveComposition(payload, {
      onSuccess: () => {
        message.success('Resume Medis Tubuh berhasil disimpan ke database')
      },
      onError: (err: any) => {
        message.error(`Gagal menyimpan: ${err.message}`)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">Resume Medis Tubuh</span>
            <Button icon={<HistoryOutlined />} onClick={() => setIsHistoryModalVisible(true)}>
              Riwayat ({historyData.length})
            </Button>
          </div>
        }
        className=" border-none"
      >
        <Row gutter={16}>
          <Col span={10}>
            <Card title="Anotasi Visual" className=" h-full overflow-hidden" size="small">
              <div className="flex flex-col items-center">
                <div className="mb-4 w-full text-center">
                  <Radio.Group
                    value={activeView}
                    onChange={(e) => setActiveView(e.target.value)}
                    buttonStyle="solid"
                    className="w-full flex"
                  >
                    <Radio.Button value="front" className="flex-1 text-center">
                      Depan
                    </Radio.Button>
                    <Radio.Button value="back" className="flex-1 text-center">
                      Belakang
                    </Radio.Button>
                    <Radio.Button value="left" className="flex-1 text-center">
                      Kiri
                    </Radio.Button>
                    <Radio.Button value="right" className="flex-1 text-center">
                      Kanan
                    </Radio.Button>
                  </Radio.Group>
                </div>

                <div
                  className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-inner cursor-crosshair"
                  style={{ width: '320px', height: '480px' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${viewMap[activeView]})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      opacity: 0.8
                    }}
                  />

                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={480}
                    className="relative z-10"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="small" icon={<ClearOutlined />} onClick={clearCanvas}>
                    Bersihkan Gambar
                  </Button>
                  <div className="flex items-center gap-1 ml-4">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <Text className="text-[10px] uppercase font-bold text-gray-400">
                      Pena Merah
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={14}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              className="h-full flex flex-col gap-4"
              initialValues={{
                assessment_date: dayjs()
              }}
            >
              <Card title="Pemeriksaan & Temuan Klinis" className=" flex-1 shadow-sm" size="small">
                <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
                <Divider style={{ marginTop: 0 }} />

                <Form.Item
                  label={<span className="font-semibold">Deskripsi Temuan (Sesuai Diagram)</span>}
                  name="clinical_description"
                >
                  <TextArea
                    rows={6}
                    placeholder="Contoh: &#10;1. Luka robek 2cm pada lengan kanan (lihat diagram Depan)&#10;2. Memar pada punggung bawah (lihat diagram Belakang)"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="font-semibold">Catatan Tambahan / Instruksi Perawatan</span>
                  }
                  name="additional_notes"
                  className="mb-0"
                >
                  <TextArea
                    rows={3}
                    placeholder="Instruksi perawatan luka atau catatan lainnya..."
                    className="rounded-lg"
                  />
                </Form.Item>
              </Card>

              <Card title="Bagian Tambahan (Sections)" size="small">
                <Form.List name="dynamic_sections">
                  {(fields, { add, remove }) => (
                    <div className="flex flex-col gap-4">
                      {fields.map(({ key, name, ...restField }) => (
                        <Card
                          key={key}
                          size="small"
                          type="inner"
                          title={`Bagian #${name + 1}`}
                          extra={
                            <Button
                              type="text"
                              danger
                              size="small"
                              onClick={() => remove(name)}
                              icon={<ClearOutlined />}
                            >
                              Hapus
                            </Button>
                          }
                        >
                          <Row gutter={12}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'template_index']}
                                label="Jenis Bagian"
                                rules={[{ required: true, message: 'Pilih jenis bagian' }]}
                              >
                                <Select
                                  placeholder="Pilih Jenis Bagian"
                                  onChange={(idx) => {
                                    const template = SECTION_TEMPLATES[idx]
                                    if (template) {
                                      const titlePath = ['dynamic_sections', name, 'title']
                                      const codePath = ['dynamic_sections', name, 'code_code']
                                      const displayPath = ['dynamic_sections', name, 'code_display']
                                      const systemPath = ['dynamic_sections', name, 'code_system']

                                      form.setFieldValue(titlePath, template.title)
                                      form.setFieldValue(codePath, template.code)
                                      form.setFieldValue(displayPath, template.display)
                                      form.setFieldValue(systemPath, template.system)
                                    }
                                  }}
                                >
                                  {SECTION_TEMPLATES.map((t, idx) => (
                                    <Select.Option key={idx} value={idx}>
                                      {t.label}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'title']}
                                label="Judul Bagian"
                                rules={[{ required: true, message: 'Judul wajib diisi' }]}
                              >
                                <Input placeholder="Judul Bagian" />
                              </Form.Item>
                            </Col>

                            <Form.Item
                              {...restField}
                              name={[name, 'code_system']}
                              hidden
                              initialValue="http://loinc.org"
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'code_code']} hidden>
                              <Input />
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'code_display']} hidden>
                              <Input />
                            </Form.Item>

                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'text_content']}
                                label="Isi Narasi"
                                rules={[{ required: true, message: 'Narasi wajib diisi' }]}
                              >
                                <TextArea rows={4} placeholder="Tuliskan narasi klinis disini..." />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'mode']}
                                label="Mode"
                                initialValue="working"
                              >
                                <Select>
                                  <Select.Option value="working">Working</Select.Option>
                                  <Select.Option value="snapshot">Snapshot</Select.Option>
                                  <Select.Option value="changes">Changes</Select.Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<EditOutlined />}>
                        Tambah Bagian Baru
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Card>

              <Card title="Verifikasi Dokter" className="" size="small">
                <div className="flex flex-col items-center p-2 rounded border border-dashed border-white/20">
                  <Text strong className="text-[10px] text-gray-400 uppercase mb-2">
                    Tanda Tangan Elektronik
                  </Text>
                  <div className="w-full h-32 bg-gray-50 flex items-center justify-center mb-3 rounded-md overflow-hidden border border-white/10">
                    {doctorSig ? (
                      <img src={doctorSig} alt="Doctor Sig" className="max-h-full" />
                    ) : (
                      <div className="text-gray-300 italic text-xs flex flex-col items-center gap-1">
                        <HistoryOutlined className="text-xl" />
                        Belum Ditandatangani
                      </div>
                    )}
                  </div>
                  <Button
                    icon={<EditOutlined />}
                    type="dashed"
                    className="w-full"
                    onClick={() => setSigModal({ visible: true, title: 'Dokter Pemeriksa' })}
                  >
                    Klik untuk TTD
                  </Button>
                </div>
              </Card>
            </Form>
          </Col>
        </Row>

        <div className="flex justify-end pt-4 pb-12 gap-4">
          <Button
            size="large"
            icon={<PrinterOutlined />}
            className="px-8 h-12 rounded-xl"
            onClick={handlePreviewPrint}
          >
            Preview Cetak
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            className="px-12 h-12 rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-700"
            onClick={() => form.submit()}
            loading={isSaving}
          >
            Simpan Resume Medis Tubuh
          </Button>
        </div>

        <SignaturePadModal
          title={sigModal.title}
          visible={sigModal.visible}
          onClose={() => setSigModal({ ...sigModal, visible: false })}
          onSave={(url) => setDoctorSig(url)}
        />

        <Modal
          title="Riwayat Resume Medis Tubuh"
          open={isHistoryModalVisible}
          onCancel={() => setIsHistoryModalVisible(false)}
          width={900}
          footer={[
            <Button key="close" onClick={() => setIsHistoryModalVisible(false)}>
              Tutup
            </Button>
          ]}
        >
          <Table
            dataSource={historyData}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            loading={isLoadingHistory}
          />
        </Modal>

        <Modal
          title="Preview Cetak Resume Medis Tubuh"
          open={isPreviewVisible}
          onCancel={() => setIsPreviewVisible(false)}
          width={900}
          centered
          footer={[
            <Button key="close" onClick={() => setIsPreviewVisible(false)}>
              Tutup
            </Button>,
            <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
              Cetak Sekarang
            </Button>
          ]}
          bodyStyle={{ padding: 0, background: '#f0f2f5', maxHeight: '80vh', overflow: 'auto' }}
        >
          <div className="p-8 flex justify-center bg-gray-200">
            <BodyMappingLetter
              ref={printRef}
              data={formDataForPrint}
              patientData={patientData}
              bodyMapping={drawingData}
              signature={doctorSig}
            />
          </div>
        </Modal>
      </Card>
    </div>
  )
}
