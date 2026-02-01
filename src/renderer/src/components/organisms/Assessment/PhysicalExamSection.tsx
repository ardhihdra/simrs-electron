import { Card, Col, Form, Row, Select, Input, Modal, Button, Badge, Tooltip, App } from 'antd'
import React, { useState, useRef, useEffect } from 'react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import bodyMapImage from '../../../assets/images/body_map.png' // Import body map image

const { Option } = Select
const { TextArea } = Input

interface BodyMarker {
  id: number
  x: number
  y: number
  note: string
}

export const PhysicalExamSection: React.FC = () => {
  const [markers, setMarkers] = useState<BodyMarker[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempMarker, setTempMarker] = useState<{ x: number; y: number } | null>(null)
  const [markerNote, setMarkerNote] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)

  // Connect to Form instance to sync markers with additionalNotes
  const form = Form.useFormInstance()
  const { message } = App.useApp()

  // Load markers from existing notes if present (simple regex parser)
  useEffect(() => {
    // Optional: If we want to restore markers from saved text
    // For now, let's keep it simple: Markers -> Text (One way sync for submission)
  }, [])

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
      const updatedMarkers = [...markers, newMarker]
      setMarkers(updatedMarkers)
      updateFormNotes(updatedMarkers)
      setIsModalOpen(false)
      message.success('Penanda ditambahkan')
    } else {
      message.warning('Harap isi keterangan')
    }
  }

  const removeMarker = (id: number) => {
    const updatedMarkers = markers.filter((m) => m.id !== id)
    setMarkers(updatedMarkers)
    updateFormNotes(updatedMarkers)
  }

  const updateFormNotes = (currentMarkers: BodyMarker[]) => {
    // Serialize markers to text and append to notes
    // We append a readable summary
    const summary = currentMarkers.map((m, i) => `[${i + 1}] ${m.note}`).join('\n')

    const currentNote = form.getFieldValue(['physicalExamination', 'additionalNotes']) || ''
    // Simple logic: Replace schematic part or append
    // For simplicity, we just set the field to the summary for now, or append if empty
    // Ideally we'd have a separate field, but using additionalNotes is the constraint.
    form.setFieldValue(['physicalExamination', 'additionalNotes'], summary)
  }

  return (
    <Card title="Pemeriksaan Fisik (Body Map)" className="py-4">
      <Row gutter={24}>
        <Col span={24}>
          <div className="mb-4 bg-blue-50 p-3 rounded text-blue-700 text-sm">
            <p>
              Klik pada gambar tubuh untuk menandai lokasi luka, nyeri, atau temuan fisik lainnya.
            </p>
          </div>
          <div
            className="relative w-full overflow-hidden border border-gray-200 rounded-lg bg-white mb-6"
            style={{ minHeight: '400px' }}
          >
            <div className="relative mx-auto" style={{ maxWidth: '800px' }}>
              <img
                ref={imgRef}
                src={bodyMapImage}
                alt="Body Map"
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
                    transform: 'translate(-50%, -50%)' // Center the dot
                  }}
                  className="group"
                >
                  <Tooltip title={marker.note}>
                    <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-red-600 hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                  </Tooltip>
                  {/* Remove button available on hover */}
                  <div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:flex bg-white rounded-full shadow-lg p-1 cursor-pointer z-10"
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
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="Keadaan Umum"
            name={['physicalExamination', 'generalCondition']}
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <Select placeholder="Pilih keadaan umum" className="max-w-md">
              <Option value="Baik">Baik</Option>
              <Option value="Sedang">Sedang</Option>
              <Option value="Buruk">Buruk</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        label="Catatan Pemeriksaan Fisik (Terisi otomatis dari Body Map)"
        name={['physicalExamination', 'additionalNotes']}
      >
        <TextArea rows={4} placeholder="Catatan akan muncul di sini..." />
      </Form.Item>

      <Modal
        title="Tambah Penanda"
        open={isModalOpen}
        onOk={saveMarker}
        onCancel={() => setIsModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical">
          <Form.Item label="Keterangan (Contoh: Luka Lecet, Nyeri Tekan)">
            <Input
              autoFocus
              value={markerNote}
              onChange={(e) => setMarkerNote(e.target.value)}
              placeholder="Masukkan keterangan..."
              onPressEnter={saveMarker}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
