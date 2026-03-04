import React, { useState, useRef } from 'react'
import { Form, Input, InputNumber, Radio, Card, Row, Col, Button, App, Modal, theme } from 'antd'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import eyeMapImage from '@renderer/assets/images/eye_anatomy_map.png'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'

const { TextArea } = Input

export interface OphthalmologyFormProps {
  encounterId: string
  patientData: any
}

export const OphthalmologyForm: React.FC<OphthalmologyFormProps> = ({
  encounterId,
  patientData
}) => {
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
      message.success('Penanda ditambahkan')
    } else {
      message.warning('Harap isi keterangan')
    }
  }

  const removeMarker = (id: number) => {
    setMarkers(markers.filter((m) => m.id !== id))
  }

  const handleFinish = (values: any) => {
    const payload = {
      encounterId,
      patientId: patientData?.patient?.id,
      ophthalmologyAssessment: {
        ...values,
        eyeAnatomyMarkers: markers
      },
      timestamp: new Date().toISOString()
    }

    console.log('Ophthalmology Submission Data:', JSON.stringify(payload, null, 2))
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 overflow-y-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            assessment_date: dayjs(),
            visualAcuity: {
              od: { correction: 'tanpa_koreksi' },
              os: { correction: 'tanpa_koreksi' }
            },
            iop: { method: 'non_contact' },
            pupil: {
              symmetry: 'isokor',
              od: { lightReflex: 'positif' },
              os: { lightReflex: 'positif' },
              rapd: 'no'
            }
          }}
          className="flex flex-col gap-4 pb-4"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
          <Card title="Peta Mata (Eye Map)" size="small" className="mb-4">
            <div
              className="mb-2 p-3 rounded text-xs"
              style={{
                backgroundColor: token.colorInfoBg,
                color: token.colorInfoText,
                border: `1px solid ${token.colorInfoBorder}`
              }}
            >
              Klik pada gambar mata untuk menandai lokasi lesi/temuan.
            </div>
            <div
              className="relative w-full overflow-hidden rounded-lg mb-4 flex justify-center items-center"
              style={{
                minHeight: '300px',
                border: `1px solid ${token.colorBorderSecondary}`,
                background: '#fff'
              }}
            >
              <div className="relative inline-block w-full max-w-lg mx-auto">
                <img
                  ref={imgRef}
                  src={eyeMapImage}
                  alt="Eye Map"
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
          <Card title="Visual Acuity" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div
                  className="font-semibold mb-3 border p-2 rounded text-center"
                  style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorPrimary
                  }}
                >
                  Oculus Dexter (OD) / Kanan
                </div>
                <Form.Item
                  label="Visus OD"
                  name={['visualAcuity', 'od', 'value']}
                  rules={[{ required: true, message: 'Harap isi Visus OD (contoh: 6/6)' }]}
                >
                  <Input placeholder="Contoh: 6/6" />
                </Form.Item>
                <Form.Item label="Koreksi OD" name={['visualAcuity', 'od', 'correction']}>
                  <Radio.Group>
                    <Radio value="tanpa_koreksi">Tanpa Koreksi</Radio>
                    <Radio value="dengan_koreksi">Dengan Koreksi</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <div
                  className="font-semibold mb-3 border p-2 rounded text-center"
                  style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorPrimary
                  }}
                >
                  Oculus Sinister (OS) / Kiri
                </div>
                <Form.Item
                  label="Visus OS"
                  name={['visualAcuity', 'os', 'value']}
                  rules={[{ required: true, message: 'Harap isi Visus OS (contoh: 6/6)' }]}
                >
                  <Input placeholder="Contoh: 6/6" />
                </Form.Item>
                <Form.Item label="Koreksi OS" name={['visualAcuity', 'os', 'correction']}>
                  <Radio.Group>
                    <Radio value="tanpa_koreksi">Tanpa Koreksi</Radio>
                    <Radio value="dengan_koreksi">Dengan Koreksi</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card title="Refraction" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div
                  className="font-semibold mb-3 border p-2 rounded text-center"
                  style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorPrimary
                  }}
                >
                  OD (Kanan)
                </div>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Sphere" name={['refraction', 'od', 'sphere']}>
                      <InputNumber className="w-full" step={0.25} placeholder="0.00" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Cylinder" name={['refraction', 'od', 'cylinder']}>
                      <InputNumber className="w-full" step={0.25} placeholder="0.00" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Axis" name={['refraction', 'od', 'axis']}>
                      <InputNumber className="w-full" min={0} max={180} placeholder="0-180" />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              <Col xs={24} md={12}>
                <div
                  className="font-semibold mb-3 border p-2 rounded text-center"
                  style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorPrimary
                  }}
                >
                  OS (Kiri)
                </div>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Sphere" name={['refraction', 'os', 'sphere']}>
                      <InputNumber className="w-full" step={0.25} placeholder="0.00" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Cylinder" name={['refraction', 'os', 'cylinder']}>
                      <InputNumber className="w-full" step={0.25} placeholder="0.00" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Axis" name={['refraction', 'os', 'axis']}>
                      <InputNumber className="w-full" min={0} max={180} placeholder="0-180" />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
          <Card title="Intraocular Pressure (IOP)" size="small" className="mb-4">
            <Row gutter={24} align="top">
              <Col xs={24} md={24} className="mb-2">
                <Form.Item label="Metode" name={['iop', 'method']}>
                  <Radio.Group>
                    <Radio value="non_contact">Non-Contact Tonometry (NCT)</Radio>
                    <Radio value="applanation">Applanation (Goldmann)</Radio>
                    <Radio value="lainnya">Lainnya</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={12} md={12}>
                <Form.Item label="IOP OD (mmHg)" name={['iop', 'od', 'value']}>
                  <InputNumber className="w-full" min={0} placeholder="Nilai tekanan OD" />
                </Form.Item>
              </Col>
              <Col xs={12} md={12}>
                <Form.Item label="IOP OS (mmHg)" name={['iop', 'os', 'value']}>
                  <InputNumber className="w-full" min={0} placeholder="Nilai tekanan OS" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card title="Pupil Examination" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={24}>
                <Form.Item label="Bentuk & Ukuran (Symmetry)" name={['pupil', 'symmetry']}>
                  <Radio.Group>
                    <Radio value="isokor">Isokor (Sama besar)</Radio>
                    <Radio value="anisokor">Anisokor (Beda ukuran)</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={12} md={12}>
                <Form.Item label="Light Reflex OD" name={['pupil', 'od', 'lightReflex']}>
                  <Radio.Group>
                    <Radio value="positif">(+) Positif</Radio>
                    <Radio value="negatif">(-) Negatif</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={12} md={12}>
                <Form.Item label="Light Reflex OS" name={['pupil', 'os', 'lightReflex']}>
                  <Radio.Group>
                    <Radio value="positif">(+) Positif</Radio>
                    <Radio value="negatif">(-) Negatif</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={24}>
                <Form.Item
                  label="RAPD (Relative Afferent Pupillary Defect)"
                  name={['pupil', 'rapd']}
                >
                  <Radio.Group>
                    <Radio value="yes">Yes</Radio>
                    <Radio value="no">No</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card title="Slit Lamp Examination (Segmen Anterior)" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div
                  className="font-semibold mb-3 border p-2 rounded text-center"
                  style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorPrimary
                  }}
                >
                  OD (Kanan)
                </div>
                <Form.Item label="Conjunctiva" name={['slitLamp', 'od', 'conjunctiva']}>
                  <Input placeholder="Normal/Hiperemis/dll" />
                </Form.Item>
                <Form.Item label="Cornea" name={['slitLamp', 'od', 'cornea']}>
                  <Input placeholder="Jernih/Keruh/dll" />
                </Form.Item>
                <Form.Item label="Anterior Chamber" name={['slitLamp', 'od', 'anteriorChamber']}>
                  <Input placeholder="Dalam/Dangkal/dll" />
                </Form.Item>
                <Form.Item label="Lens" name={['slitLamp', 'od', 'lens']}>
                  <Input placeholder="Jernih/Katarak/dll" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <div
                  className="font-semibold mb-3 border p-2 rounded text-center"
                  style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorPrimary
                  }}
                >
                  OS (Kiri)
                </div>
                <Form.Item label="Conjunctiva" name={['slitLamp', 'os', 'conjunctiva']}>
                  <Input placeholder="Normal/Hiperemis/dll" />
                </Form.Item>
                <Form.Item label="Cornea" name={['slitLamp', 'os', 'cornea']}>
                  <Input placeholder="Jernih/Keruh/dll" />
                </Form.Item>
                <Form.Item label="Anterior Chamber" name={['slitLamp', 'os', 'anteriorChamber']}>
                  <Input placeholder="Dalam/Dangkal/dll" />
                </Form.Item>
                <Form.Item label="Lens" name={['slitLamp', 'os', 'lens']}>
                  <Input placeholder="Jernih/Katarak/dll" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card title="Fundus Examination (Segmen Posterior)" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div
                  className="font-semibold mb-3 border p-2 rounded text-center"
                  style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorPrimary
                  }}
                >
                  OD (Kanan)
                </div>
                <Form.Item label="Optic Disc" name={['fundus', 'od', 'opticDisc']}>
                  <Input placeholder="Batas tegas/mengabur" />
                </Form.Item>
                <Form.Item label="Macula" name={['fundus', 'od', 'macula']}>
                  <Input placeholder="Reflek fovea +/-" />
                </Form.Item>
                <Form.Item label="Retina" name={['fundus', 'od', 'retina']}>
                  <Input placeholder="Eksudat/Perdarahan/dll" />
                </Form.Item>
                <Form.Item label="CDR Ratio" name={['fundus', 'od', 'cdrRatio']}>
                  <InputNumber className="w-full" step={0.1} min={0} max={1} placeholder="0.3" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <div
                  className="font-semibold mb-3 border p-2 rounded text-center"
                  style={{
                    backgroundColor: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorPrimary
                  }}
                >
                  OS (Kiri)
                </div>
                <Form.Item label="Optic Disc" name={['fundus', 'os', 'opticDisc']}>
                  <Input placeholder="Batas tegas/mengabur" />
                </Form.Item>
                <Form.Item label="Macula" name={['fundus', 'os', 'macula']}>
                  <Input placeholder="Reflek fovea +/-" />
                </Form.Item>
                <Form.Item label="Retina" name={['fundus', 'os', 'retina']}>
                  <Input placeholder="Eksudat/Perdarahan/dll" />
                </Form.Item>
                <Form.Item label="CDR Ratio" name={['fundus', 'os', 'cdrRatio']}>
                  <InputNumber className="w-full" step={0.1} min={0} max={1} placeholder="0.3" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card title="Kesimpulan & Rencana Tindak Lanjut" size="small" className="mb-4">
            <Form.Item
              label="Diagnosis Mata"
              name="diagnosis"
              rules={[{ required: true, message: 'Harap isi diagnosis mata' }]}
            >
              <TextArea
                rows={2}
                placeholder="Sebutkan diagnosis utama (contoh: Miopia, Katarak Senilis, Glaukoma)..."
              />
            </Form.Item>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item label="Kontrol Ulang" name={['plan', 'followUp']}>
                  <Input placeholder="Contoh: 1 minggu lagi / 1 bulan lagi" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Rujukan" name={['plan', 'referral']}>
                  <Input placeholder="RS/Spesialis rujukan jika ada" />
                </Form.Item>
              </Col>
              <Col xs={24} md={24}>
                <Form.Item label="Terapi Tambahan / Edukasi" name={['plan', 'additionalTherapy']}>
                  <TextArea
                    rows={3}
                    placeholder="Tuliskan resep kacamata, obat tetes, atau edukasi spesifik..."
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
          Simpan Data
        </Button>
      </div>

      <Modal
        title="Tambah Penanda"
        open={isModalOpen}
        onOk={saveMarker}
        onCancel={() => setIsModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical">
          <Form.Item label="Keterangan Temuan">
            <Input
              autoFocus
              value={markerNote}
              onChange={(e) => setMarkerNote(e.target.value)}
              onPressEnter={saveMarker}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OphthalmologyForm
