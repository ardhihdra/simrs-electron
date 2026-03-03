import React, { useState, useRef } from 'react'
import { Form, Input, InputNumber, Radio, Divider, Card, Row, Col, Button, App, Modal } from 'antd'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import eyeMapImage from '@renderer/assets/images/eye_anatomy_map.png'

const { TextArea } = Input

export interface OphthalmologyFormProps {
  encounterId: string
  patientData: any
}

export const OphthalmologyForm: React.FC<OphthalmologyFormProps> = ({
  encounterId,
  patientData
}) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()

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
    // Struktur JSON hasil dari Form
    const payload = {
      encounterId,
      patientId: patientData?.patient?.id,
      ophthalmologyAssessment: {
        ...values,
        eyeAnatomyMarkers: markers
      },
      timestamp: new Date().toISOString()
    }

    // Menampilkan struktur JSON pada console sesuai permintaan (tanpa panggil API)
    console.log('Ophthalmology Submission Data:', JSON.stringify(payload, null, 2))
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 overflow-y-auto pr-2">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
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
        >
          {/* Eye Map Form (Peta Mata) */}
          <Card title="Peta Mata (Eye Map)" size="small" className="mb-4">
            <div className="mb-2 bg-blue-50 p-3 rounded text-blue-700 text-xs">
              Klik pada gambar mata untuk menandai lokasi lesi/temuan.
            </div>
            <div
              className="relative w-full overflow-hidden border border-gray-200 rounded-lg bg-white mb-4 flex justify-center items-center"
              style={{ minHeight: '300px' }}
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

          {/* Visual Acuity */}
          <Card title="1. Visual Acuity" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Divider
                  orientation="left"
                  className="m-0 mb-4 text-blue-600 border-blue-200 text-sm"
                >
                  Oculus Dexter (OD) / Kanan
                </Divider>
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
                <Divider
                  orientation="left"
                  className="m-0 mb-4 text-blue-600 border-blue-200 text-sm"
                >
                  Oculus Sinister (OS) / Kiri
                </Divider>
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

          {/* Refraction */}
          <Card title="2. Refraction" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Divider orientation="left" className="m-0 mb-4 text-blue-600 text-sm">
                  OD (Kanan)
                </Divider>
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
                <Divider orientation="left" className="m-0 mb-4 text-blue-600 text-sm">
                  OS (Kiri)
                </Divider>
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

          {/* Intraocular Pressure (IOP) */}
          <Card title="3. Intraocular Pressure (IOP)" size="small" className="mb-4">
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

          {/* Pupil Examination */}
          <Card title="4. Pupil Examination" size="small" className="mb-4">
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

          {/* Slit Lamp Examination */}
          <Card title="5. Slit Lamp Examination (Segmen Anterior)" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div className="font-semibold mb-3 bg-gray-50 border border-gray-200 p-2 rounded text-blue-600 text-center">
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
                <div className="font-semibold mb-3 bg-gray-50 border border-gray-200 p-2 rounded text-blue-600 text-center">
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

          {/* Fundus Examination */}
          <Card title="6. Fundus Examination (Segmen Posterior)" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div className="font-semibold mb-3 bg-gray-50 border border-gray-200 p-2 rounded text-blue-600 text-center">
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
                <div className="font-semibold mb-3 bg-gray-50 border border-gray-200 p-2 rounded text-blue-600 text-center">
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

          {/* Diagnosis & Plan */}
          <Card
            title="7. Kesimpulan & Rencana Tindak Lanjut"
            size="small"
            className="mb-4 bg-blue-50/30"
          >
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

      <div className="flex justify-end pt-4 border-t border-gray-200 mt-2 bg-white sticky bottom-0 z-10">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          size="large"
          className="min-w-[150px]"
        >
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
