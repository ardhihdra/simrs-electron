import React, { useState, useRef } from 'react'
import { Form, Input, Radio, Divider, Card, Row, Col, Button, App, Modal, Select } from 'antd'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import skinMapImage from '@renderer/assets/images/skin_cross_section_map.png'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'

const { TextArea } = Input

export interface DermatologyFormProps {
  encounterId: string
  patientData: any
}

export const DermatologyForm: React.FC<DermatologyFormProps> = ({ encounterId, patientData }) => {
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
      message.success('Penanda kulit ditambahkan')
    } else {
      message.warning('Harap isi keterangan lesi')
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
      dermatologyAssessment: {
        ...values,
        skinMarkers: markers
      },
      timestamp: new Date().toISOString()
    }

    // Menampilkan struktur JSON pada console
    console.log('Dermatology Submission Data:', JSON.stringify(payload, null, 2))
    message.success('Pemeriksaan Kulit berhasil disubmit (Simulasi)')
  }

  const efflorescencePrimaryOptions = [
    'Makula',
    'Papul',
    'Plak',
    'Nodul',
    'Urtika',
    'Vesikel',
    'Bula',
    'Pustul',
    'Kista',
    'Tumor'
  ]

  const efflorescenceSecondaryOptions = [
    'Skuama',
    'Krusta',
    'Erosi',
    'Ekskoriasi',
    'Ulkus',
    'Fisure',
    'Sikatriks',
    'Atrofi',
    'Likenifikasi'
  ]

  const distributionOptions = [
    'Lokalisata',
    'Regional',
    'Generalisata',
    'Universalis',
    'Bilateral',
    'Unilateral',
    'Simetris',
    'Asimetris'
  ]

  const configurationOptions = [
    'Linier',
    'Sirsinar',
    'Anular',
    'Polisiklik',
    'Herpetiformis',
    'Korimbiformis',
    'Iris Form',
    'Retikular'
  ]

  const sizeOptions = [
    'Miliar (sebesar kepala jarum pentul)',
    'Lentikular (sebesar biji jagung)',
    'Numular (sebesar uang logam)',
    'Plakat (lebih besar dari numular)'
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
            border: 'tegas'
          }}
          className="flex! flex-col! gap-4!"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Card title="Peta Anatomi Kulit (Potongan Melintang)" size="small" className="mb-4">
            <div className="mb-2 bg-pink-50 p-3 rounded text-pink-700 text-xs">
              Klik pada penampang melintang kulit untuk menandai kedalaman/lokasi spesifik lesi atau
              kelainan.
            </div>
            <div
              className="relative w-full overflow-hidden border border-gray-200 rounded-lg bg-white mb-4 flex justify-center items-center py-4"
              style={{ minHeight: '400px' }}
            >
              <div className="relative inline-block w-full max-w-lg mx-auto">
                <img
                  ref={imgRef}
                  src={skinMapImage}
                  alt="Skin Cross Section Anatomy"
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

          <Card title="Status Dermatologis (Efloresensi/UKK)" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item label="Lokasi (Regio)" name="location" rules={[{ required: true }]}>
                  <Input placeholder="Contoh: Regio facialis, brachialis dextra..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Distribusi" name="distribution">
                  <Select
                    mode="multiple"
                    placeholder="Pilih distribusi"
                    options={distributionOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Susunan / Konfigurasi" name="configuration">
                  <Select
                    mode="multiple"
                    placeholder="Pilih konfigurasi"
                    options={configurationOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Batas" name="border">
                  <Radio.Group>
                    <Radio value="tegas">Tegas (Sirkumskrip)</Radio>
                    <Radio value="tidak_tegas">Tidak Tegas (Difus)</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Ukuran" name="size">
                  <Select
                    mode="multiple"
                    placeholder="Pilih ukuran"
                    options={sizeOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>

              <Divider className="my-2" />

              <Col xs={24} md={12}>
                <Form.Item label="Efloresensi Primer" name="primaryLesion">
                  <Select
                    mode="multiple"
                    placeholder="Pilih lesi primer"
                    options={efflorescencePrimaryOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Efloresensi Sekunder" name="secondaryLesion">
                  <Select
                    mode="multiple"
                    placeholder="Pilih lesi sekunder"
                    options={efflorescenceSecondaryOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  label="Deskripsi Temuan Tambahan (Warna, Palpasi, dll)"
                  name="additionalDescription"
                >
                  <TextArea
                    rows={3}
                    placeholder="Contoh: Tampak plak eritematosa dengan skuama kasar berlapis, pada palpasi tidak ada nyeri tekan..."
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Status Venerologis & Appendiks Kulit" size="small" className="mb-4">
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item label="Rambut / Kepala" name={['appendages', 'hair']}>
                  <Input placeholder="DKN (Dalam Keadaan Normal) / Alopecia..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Kuku (Nails)" name={['appendages', 'nails']}>
                  <Input placeholder="DKN / Pitting nail / Onychomycosis..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Kelenjar Getah Bening" name={['appendages', 'lymphNode']}>
                  <Input placeholder="Tdk ada pembesaran / Membesar..." />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Selaput Lendir / Genitalia"
                  name={['appendages', 'mucosaGenitalia']}
                >
                  <Input placeholder="Keterangan venerologis jika ada keluhan..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Diagnosis & Penatalaksanaan" size="small" className="mb-4 bg-blue-50/30">
            <Form.Item
              label="Diagnosis Kerja"
              name="diagnosis"
              rules={[{ required: true, message: 'Harap isi diagnosis kulit' }]}
            >
              <Input placeholder="Diagnosis utama..." />
            </Form.Item>
            <Form.Item label="Diagnosis Banding" name="differentialDiagnosis">
              <Input placeholder="Diagnosis banding..." />
            </Form.Item>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Rencana Tindakan (Biopsi/Eksisi/dll)"
                  name={['plan', 'procedure']}
                >
                  <Input placeholder="Contoh: Punch biopsy / Ekstraksi komedo" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Pemeriksaan Penunjang (KOH, Gram, dll)"
                  name={['plan', 'investigation']}
                >
                  <Input placeholder="Contoh: Kerokan kulit KOH 10%" />
                </Form.Item>
              </Col>
              <Col xs={24} md={24}>
                <Form.Item label="Terapi Khusus / Edukasi" name={['plan', 'therapy']}>
                  <TextArea
                    rows={3}
                    placeholder="Tuliskan instruksi cara pemakaian krim/salep, edukasi mandi, dll..."
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
          Simpan Data Kulit
        </Button>
      </div>

      <Modal
        title="Tambah Penanda Lesi Kulit"
        open={isModalOpen}
        onOk={saveMarker}
        onCancel={() => setIsModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical">
          <Form.Item label="Keterangan / Jenis Lesi (Contoh: Eritema, Skuama, dt)">
            <Input
              autoFocus
              value={markerNote}
              onChange={(e) => setMarkerNote(e.target.value)}
              onPressEnter={saveMarker}
              placeholder="Contoh: Plak eritematosa di perut"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DermatologyForm
