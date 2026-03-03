import React, { useState, useRef } from 'react'
import { Form, Input, Radio, Card, Row, Col, Button, App, Modal, Select } from 'antd'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import entMapImage from '@renderer/assets/images/ent_anatomy_map.png'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'

const { TextArea } = Input

export interface ENTFormProps {
  encounterId: string
  patientData: any
}

export const ENTForm: React.FC<ENTFormProps> = ({ encounterId, patientData }) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse'
  ])

  const [markers, setMarkers] = useState<{ id: number; x: number; y: number; note: string }[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempMarker, setTempMarker] = useState<{ x: number; y: number } | null>(null)
  const [markerNote, setMarkerNote] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setTempMarker({ x, y })
    setMarkerNote('')
    setIsModalOpen(true)
  }

  const saveMarker = () => {
    if (tempMarker && markerNote.trim()) {
      const newMarker = {
        id: Date.now(),
        x: tempMarker.x,
        y: tempMarker.y,
        note: markerNote
      }
      setMarkers([...markers, newMarker])
      setIsModalOpen(false)
      message.success('Penanda telinga ditambahkan')
    } else {
      message.warning('Harap isi keterangan/temuan')
    }
  }

  const removeMarker = (id: number) => {
    setMarkers(markers.filter((m) => m.id !== id))
  }

  const handleFinish = (values: any) => {
    const payload = {
      encounterId,
      patientId: patientData?.patient?.id,
      entAssessment: {
        ...values,
        earMarkers: markers
      },
      timestamp: new Date().toISOString()
    }

    console.log('ENT Submission Data:', JSON.stringify(payload, null, 2))
    message.success('Pemeriksaan THT berhasil disubmit (Simulasi)')
  }

  const tympanicMembraneOptions = [
    'Intak',
    'Hiperemis',
    'Retraksi',
    'Suram',
    'Bulging',
    'Perforasi Sentral',
    'Perforasi Marginal',
    'Perforasi Atik'
  ]

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 overflow-y-auto pr-2">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            assessment_date: dayjs(),
            earPain: 'Tidak',
            tinnitus: 'Tidak',
            hearingLoss: 'Tidak',
            vertigo: 'Tidak'
          }}
          className="flex! flex-col! gap-4!"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Card title="Peta Anatomi THT (Ear, Nose, Throat Map)" size="small" className="mb-4">
            <div className="mb-2 bg-blue-50 p-3 rounded text-blue-700 text-xs">
              Klik pada gambar anatomi untuk menandai kelainan pada telinga, hidung, atau
              tenggorokan.
            </div>
            <div
              className="relative w-full overflow-hidden border border-gray-200 rounded-lg bg-white mb-4 flex justify-center items-center py-4"
              style={{ minHeight: '400px' }}
            >
              <div className="relative inline-block w-full max-w-lg mx-auto">
                <img
                  ref={imgRef}
                  src={entMapImage}
                  alt="ENT Anatomy Map"
                  className="w-full h-auto cursor-crosshair block"
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
                    className="group z-10"
                  >
                    <div className="w-5 h-5 bg-red-500 rounded-full border border-white shadow flex items-center justify-center text-white text-xs font-bold cursor-pointer">
                      {index + 1}
                    </div>
                    <div
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:flex bg-white rounded-full shadow p-1 cursor-pointer z-20"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeMarker(marker.id)
                      }}
                    >
                      <DeleteOutlined className="text-red-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Anamnesis / Keluhan THT" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={6}>
                <Form.Item label="Nyeri Telinga (Otalgia)" name="earPain">
                  <Radio.Group>
                    <Radio value="Ya">Ya</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Telinga Berdenging (Tinnitus)" name="tinnitus">
                  <Radio.Group>
                    <Radio value="Ya">Ya</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Penurunan Pendengaran" name="hearingLoss">
                  <Radio.Group>
                    <Radio value="Ya">Ya</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Pusing Berputar (Vertigo)" name="vertigo">
                  <Radio.Group>
                    <Radio value="Ya">Ya</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Keluhan Hidung (Pilek/Tersumbat/Epistaksis)" name="noseComplaint">
                  <Input placeholder="Riwayat keluar cairan dari hidung, bersin, hidung tersumbat..." />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Keluhan Tenggorok (Nyeri Telan/Suara Serak)"
                  name="throatComplaint"
                >
                  <Input placeholder="Nyeri telan, rasa mengganjal, suara serak, dll..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Pemeriksaan Telinga (Aurikula & MAE)" size="small" className="mb-4">
            <p className="font-semibold mb-2">Telinga Kanan (Dekstra)</p>
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item label="Daun Telinga (Aurikula) AD" name={['earDekstra', 'auricle']}>
                  <Input placeholder="Normal/Hiperemis/Nyeri Tarik..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Liang Telinga (MAE) AD" name={['earDekstra', 'canal']}>
                  <Input placeholder="Lapang/Sempit/Serumen prop..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Membran Timpani AD" name={['earDekstra', 'tympanic']}>
                  <Select
                    placeholder="Pilih Kondisi"
                    allowClear
                    options={tympanicMembraneOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <p className="font-semibold mb-2 mt-2 border-t pt-2">Telinga Kiri (Sinistra)</p>
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item label="Daun Telinga (Aurikula) AS" name={['earSinistra', 'auricle']}>
                  <Input placeholder="Normal/Hiperemis/Nyeri Tarik..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Liang Telinga (MAE) AS" name={['earSinistra', 'canal']}>
                  <Input placeholder="Lapang/Sempit/Serumen prop..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Membran Timpani AS" name={['earSinistra', 'tympanic']}>
                  <Select
                    placeholder="Pilih Kondisi"
                    allowClear
                    options={tympanicMembraneOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title="Pemeriksaan Hidung (Rhinoskopi Anterior) & Tenggorok"
            size="small"
            className="mb-4"
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item label="Rongga Hidung (Kavum Nasi)" name={['nose', 'cavumNasi']}>
                  <Input placeholder="Lapang/Sempit, deviasi septum..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Konka & Sekret" name={['nose', 'concha']}>
                  <Input placeholder="Konka hipertrofi livide, sekret mukopurulen..." />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Tonsil / Amandel" name={['throat', 'tonsil']}>
                  <Input placeholder="T1-T1 / T2-T2, kripta melebar, detritus..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Faring / Dinding Belakang" name={['throat', 'pharynx']}>
                  <Input placeholder="Hiperemis, granulasi (+)..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Diagnosis & Penatalaksanaan" size="small" className="mb-4 bg-blue-50/30">
            <Form.Item
              label="Diagnosis Kerja Primer"
              name="diagnosis"
              rules={[{ required: true, message: 'Harap isi diagnosis THT' }]}
            >
              <Input placeholder="Cth: Otitis Media Akut, OMSK, Rhinosinusitis Akut, Tonsilofaringitis..." />
            </Form.Item>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Tindakan THT (Ekstraksi Serumen, Spooling, dll)"
                  name={['plan', 'procedure']}
                >
                  <Input placeholder="Cth: Ekstraksi corpus alienum / Audiometri" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Terapi Khusus (Tetes Telinga/Hidung, Antibiotik)"
                  name={['plan', 'therapy']}
                >
                  <TextArea
                    rows={2}
                    placeholder="Edukasi tidak mengorek telinga, Ofloxacin tetes telinga, dll."
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 mt-2 bg-white sticky bottom-0 z-10">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          size="large"
          className="min-w-[150px]"
        >
          Simpan Data THT
        </Button>
      </div>

      <Modal
        title="Tambah Penanda THT"
        open={isModalOpen}
        onOk={saveMarker}
        onCancel={() => setIsModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical">
          <Form.Item label="Keterangan Temuan (Telinga, Hidung, atau Tenggorokan)">
            <Input
              autoFocus
              value={markerNote}
              onChange={(e) => setMarkerNote(e.target.value)}
              onPressEnter={saveMarker}
              placeholder="Contoh: Perforasi telinga / Polip hidung / Hiperemis faring"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ENTForm
