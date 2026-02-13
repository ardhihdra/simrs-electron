import { App, Button, Card, Col, Form, Input, Row, Typography, Space, Radio, Modal } from 'antd'
import {
  SaveOutlined,
  PrinterOutlined,
  EditOutlined,
  ClearOutlined,
  SkinOutlined,
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

const { Text, Paragraph } = Typography
const { TextArea } = Input

interface SignatureModalProps {
  title: string
  visible: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
}

const SignaturePadModal = ({ title, visible, onClose, onSave }: SignatureModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (visible && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
      }
    }
  }, [visible])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.beginPath()
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

  const clear = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (canvas) {
      onSave(canvas.toDataURL())
      onClose()
    }
  }

  return (
    <Modal
      title={`Tanda Tangan: ${title}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText="Simpan"
      cancelText="Batal"
      width={440}
    >
      <div className="border border-gray-300 rounded mb-2 bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="cursor-crosshair w-full"
        />
      </div>
      <Button icon={<ClearOutlined />} size="small" onClick={clear}>
        Bersihkan
      </Button>
    </Modal>
  )
}

interface DischargeSummaryFormProps {
  encounterId: string
  patientData: any
}

export const DischargeSummaryForm = ({ encounterId, patientData }: DischargeSummaryFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  // Body Mapping State
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

  // Mapping View to Image Source
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
        ctx.strokeStyle = '#ff0000' // Red for clinical notes
        ctx.lineWidth = 3
        ctx.lineCap = 'round'

        // Restore drawing if exists
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

    // Auto-save to state
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

  const handleFinish = (values: any) => {
    const performer = performersData?.find((p: any) => p.id === values.performerId)
    const finalData = {
      ...values,
      bodyMapping: drawingData,
      doctorSignature: doctorSig,
      encounterId,
      report_date: values.assessment_date,
      doctor_name: performer?.name || '',
      performerId: values.performerId
    }
    console.log('Body Resume Data Saved:', finalData)
    message.success('Resume Medis Tubuh berhasil disimpan')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Resume Medis Tubuh" className=" border-none">
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
                  {/* Body Map Sprite Background */}
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

                  {/* Drawing Layer */}
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

              <Card
                title="Verifikasi Dokter"
                className=""
                size="small"
                headStyle={{ background: '#f8fafc' }}
              >
                <div className="flex flex-col items-center p-2 bg-white rounded border border-dashed border-gray-200">
                  <Text strong className="text-[10px] text-gray-400 uppercase mb-2">
                    Tanda Tangan Elektronik
                  </Text>
                  <div className="w-full h-24 bg-gray-50 flex items-center justify-center mb-3 rounded shadow-inner overflow-hidden border border-gray-100">
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

      <style>{`
        .ant-radio-button-wrapper-checked {
          background: #4f46e5 !important;
          border-color: #4f46e5 !important;
          color: white !important;
        }
      `}</style>
    </div>
  )
}
