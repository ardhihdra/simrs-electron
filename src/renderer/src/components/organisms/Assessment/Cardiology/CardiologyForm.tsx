import React, { useState, useRef } from 'react'
import {
  Form,
  Input,
  Radio,
  Card,
  Row,
  Col,
  Button,
  App,
  Modal,
  Select,
  InputNumber,
  theme
} from 'antd'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import heartMapImage from '@renderer/assets/images/heart_anatomy_map.png'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'

const { TextArea } = Input

export interface CardiologyFormProps {
  encounterId: string
  patientData: any
}

export const CardiologyForm: React.FC<CardiologyFormProps> = ({ encounterId, patientData }) => {
  const { token } = theme.useToken()
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
      message.success('Penanda jantung ditambahkan')
    } else {
      message.warning('Harap isi keterangan anatomi/lesi')
    }
  }

  const removeMarker = (id: number) => {
    setMarkers(markers.filter((m) => m.id !== id))
  }

  const handleFinish = (values: any) => {
    const payload = {
      encounterId,
      patientId: patientData?.patient?.id,
      cardiologyAssessment: {
        ...values,
        heartMarkers: markers
      },
      timestamp: new Date().toISOString()
    }

    console.log('Cardiology Submission Data:', JSON.stringify(payload, null, 2))
    message.success('Pemeriksaan Jantung berhasil disubmit (Simulasi)')
  }

  const murmurTypes = [
    'Sistolik',
    'Diastolik',
    'Sistolik-Diastolik (Continuous)',
    'Tidak Ada Murmur'
  ]
  const murmurGrades = ['I/VI', 'II/VI', 'III/VI', 'IV/VI', 'V/VI', 'VI/VI']

  const rhythmOptions = [
    'Sinus Rhythm (SR)',
    'Atrial Fibrillation (AF)',
    'Atrial Flutter',
    'SVT',
    'PVCs / PACs',
    'AV Block',
    'Lainnya'
  ]

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 overflow-y-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            assessment_date: dayjs(),
            chestPain: 'Tidak',
            dyspnea: 'Tidak',
            edema: 'Tidak',
            murmurPresence: 'Tidak Ada Murmur'
          }}
          className="flex flex-col gap-4 pb-4"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Card title="Peta Anatomi Jantung (Cardiovascular Map)" size="small" className="mb-4">
            <div
              className="mb-2 p-3 rounded text-xs"
              style={{
                backgroundColor: token.colorInfoBg,
                color: token.colorInfoText,
                border: `1px solid ${token.colorInfoBorder}`
              }}
            >
              Klik pada gambar anatomi jantung untuk menandai kelainan spesifik seperti area murmur,
              iskemia, atau letak valve.
            </div>
            <div
              className="relative w-full overflow-hidden rounded-lg mb-4 flex justify-center items-center py-4"
              style={{
                minHeight: '400px',
                border: `1px solid ${token.colorBorderSecondary}`,
                background: '#fff'
              }}
            >
              <div className="relative inline-block w-full max-w-lg mx-auto">
                <img
                  ref={imgRef}
                  src={heartMapImage}
                  alt="Heart Anatomy Map"
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
                    <div
                      className="w-5 h-5 rounded-full border shadow flex items-center justify-center text-xs font-bold cursor-pointer"
                      style={{
                        backgroundColor: token.colorError,
                        borderColor: '#fff',
                        color: '#fff'
                      }}
                    >
                      {index + 1}
                    </div>
                    <div
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:flex rounded-full shadow p-1 cursor-pointer z-20"
                      style={{ background: token.colorBgContainer }}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeMarker(marker.id)
                      }}
                    >
                      <DeleteOutlined style={{ color: token.colorError }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Keluhan Kardiovaskular (Gejala)" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item label="Nyeri Dada (Chest Pain)" name="chestPain">
                  <Radio.Group>
                    <Radio value="Ya">Ya (Tipikal/Atipikal)</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Sesak Napas (Dyspnea / DOE)" name="dyspnea">
                  <Radio.Group>
                    <Radio value="Ya">Ya</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Edema Perifer" name="edema">
                  <Radio.Group>
                    <Radio value="Ya">Ya (Pitting/Non-pitting)</Radio>
                    <Radio value="Tidak">Tidak</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Pemeriksaan Fisik Kardiovaskular" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item label="Tekanan Darah (Sistolik)" name="systolicBP">
                  <InputNumber addonAfter="mmHg" className="w-full" placeholder="Cth: 120" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Tekanan Darah (Diastolik)" name="diastolicBP">
                  <InputNumber addonAfter="mmHg" className="w-full" placeholder="Cth: 80" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Heart Rate (Nadi)" name="heartRate">
                  <InputNumber addonAfter="bpm" className="w-full" placeholder="Cth: 80" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item label="Bunyi Jantung Dasar" name="heartSounds">
                  <Input placeholder="S1 S2 reguler/irreguler, gallop..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Murmur / Bising Jantung" name="murmurPresence">
                  <Select options={murmurTypes.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Gradasi Murmur" name="murmurGrade">
                  <Select
                    placeholder="Pilih derajat murmur (jika ada)"
                    allowClear
                    options={murmurGrades.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="JVP (Jugular Venous Pressure)" name="jvp">
                  <Input placeholder="Cth: 5-2 cmH2O (Normal/Meningkat)" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Capillary Refill Time (CRT)" name="crt">
                  <Input placeholder="< 2 detik" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title="Evaluasi Penunjang Khusus (EKG / Echocardiography)"
            size="small"
            className="mb-4"
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item label="Irama EKG Utama" name={['investigation', 'ecgRhythm']}>
                  <Select
                    placeholder="Pilih irama"
                    allowClear
                    options={rhythmOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Interpretasi EKG Lainnya" name={['investigation', 'ecgDetails']}>
                  <Input placeholder="T wave inversion, ST Elevasi V1-V4, dll" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Hasil Echocardiography (Jika ada)"
                  name={['investigation', 'echocardiography']}
                >
                  <TextArea
                    rows={2}
                    placeholder="LVEF %, LVH, kelainan katup MR/TR/AR/PR, efusi perikardial, dll."
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title="Diagnosis & Penatalaksanaan Kardiovaskular"
            size="small"
            className="mb-4"
            style={{
              background: `linear-gradient(to right, ${token.colorInfoBg}, transparent)`
            }}
          >
            <Form.Item
              label="Diagnosis Kerja Primer"
              name="diagnosis"
              rules={[{ required: true, message: 'Harap isi diagnosis jantung' }]}
            >
              <Input placeholder="Cth: STEMI Anterior, NSTEMI, Heart Failure (HFrEF/HFpEF), AF RVR..." />
            </Form.Item>
            <Form.Item label="Diagnosis Sekunder / Comorbiditas" name="secondaryDiagnosis">
              <Input placeholder="Hipertensi, DM Tipe 2, Dyslipidemia, dll" />
            </Form.Item>
            <Row gutter={24}>
              <Col xs={24}>
                <Form.Item
                  label="Rencana Tindakan / Intervensi Khusus (PCI/CABG, dll)"
                  name={['plan', 'procedure']}
                >
                  <Input placeholder="Primary PCI, Pemasangan PPM, Konsul TS Bedah Toraks KKV, dll" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Terapi Farmakologis & Edukasi" name={['plan', 'therapy']}>
                  <TextArea
                    rows={3}
                    placeholder="Edukasi diet rendah garam, batasi cairan, obat DAPT, beta blocker, statin, dll."
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </div>

      <div
        className="flex justify-end pt-4 border-t mt-auto"
        style={{ borderColor: token.colorBorderSecondary }}
      >
        <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} size="large">
          Simpan Data Kardiovaskular
        </Button>
      </div>

      <Modal
        title="Tambah Penanda Jantung"
        open={isModalOpen}
        onOk={saveMarker}
        onCancel={() => setIsModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical">
          <Form.Item label="Keterangan Temuan (Mis: Lokasi Murmur, Plak Oklusi, Trombus)">
            <Input
              autoFocus
              value={markerNote}
              onChange={(e) => setMarkerNote(e.target.value)}
              onPressEnter={saveMarker}
              placeholder="Contoh: Murmur sistolik apeks (Mitral Regurgitasi)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CardiologyForm
