import { useState } from 'react'
import { Card, Button, Input, Spin, App, Empty, Tag, Avatar, Select, Form } from 'antd'
import { PlusOutlined, UserOutlined, ClockCircleOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { CLINICAL_NOTE_TYPE_MAP } from '@renderer/config/clinicalnote-maps'
import {
  useClinicalNoteByEncounter,
  useUpsertClinicalNote
} from '@renderer/hooks/query/use-clinical-note'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssessmentHeader'

const { TextArea } = Input

interface ClinicalNoteFormProps {
  encounterId: string
  doctorId?: number
}

export const ClinicalNoteForm = ({ encounterId, doctorId = 1 }: ClinicalNoteFormProps) => {
  const notesQuery = useClinicalNoteByEncounter(encounterId)
  const upsertMutation = useUpsertClinicalNote()
  const { data: performers, isLoading: isLoadingPerformers } = usePerformers(['doctor'])
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState('progress')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = async () => {
    if (!noteText.trim()) return

    try {
      const values = await form.validateFields()

      const payload = {
        encounterId,
        doctorId: values.performerId,
        date: values.assessment_date,
        notes: [{ type: noteType, text: noteText }]
      }

      await upsertMutation.mutateAsync(payload)
      message.success('Catatan berhasil disimpan')

      setNoteText('')
      setNoteType('progress')
      setIsEditing(false)
      form.resetFields()
    } catch (error) {
      console.error(error)
      message.error('Gagal menyimpan catatan')
    }
  }

  const notesResult = notesQuery.data?.result
  const notes = (Array.isArray(notesResult) ? notesResult : []).sort(
    (a: any, b: any) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card
        size="small"
        title="Tulis Catatan Baru"
        extra={
          !isEditing && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                setIsEditing(true)
                form.setFieldsValue({
                  assessment_date: dayjs(),
                  performerId: doctorId
                })
              }}
            >
              Tulis Catatan
            </Button>
          )
        }
      >
        {isEditing ? (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              assessment_date: dayjs(),
              performerId: doctorId
            }}
          >
            <div className="flex flex-col gap-2">
              <AssessmentHeader performers={performers} loading={isLoadingPerformers} />
              <Select
                value={noteType}
                onChange={setNoteType}
                options={Object.entries(CLINICAL_NOTE_TYPE_MAP).map(([value, label]) => ({
                  value,
                  label
                }))}
                className="w-full md:w-1/2"
                placeholder="Pilih Jenis Catatan"
              />
              <TextArea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Tulis catatan perkembangan pasien, instruksi khusus, atau observasi..."
              />
              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsEditing(false)}>Batal</Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={upsertMutation.isPending}
                >
                  Simpan
                </Button>
              </div>
            </div>
          </Form>
        ) : (
          <div
            className="text-gray-400 italic cursor-pointer p-4 border border-dashed rounded text-center hover:bg-gray-50 transition-colors"
            onClick={() => {
              setIsEditing(true)
              form.setFieldsValue({
                assessment_date: dayjs(),
                performerId: doctorId
              })
            }}
          >
            <PlusOutlined className="mr-2" />
            Klik di sini untuk menambahkan catatan klinis baru...
          </div>
        )}
      </Card>
      <div className="flex-1 overflow-auto">
        <h3 className="text-gray-600 font-semibold mb-2 px-1">Riwayat Catatan</h3>

        {notesQuery.isLoading ? (
          <div className="text-center py-4">
            <Spin />
          </div>
        ) : notes.length === 0 ? (
          <Empty description="Belum ada catatan klinis" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="space-y-3">
            {notes.map((note: any) => (
              <Card
                key={note.id}
                size="small"
                className="bg-yellow-50 border-yellow-200"
                style={{ marginBottom: '0.5rem' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar size="small" icon={<UserOutlined />} className="bg-blue-400" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">
                          {note.authorName || `User ${note.authorId}`}
                        </span>
                        <Tag color="cyan" className="text-xs m-0">
                          {CLINICAL_NOTE_TYPE_MAP[note.noteType] || note.noteType || 'Catatan'}
                        </Tag>
                      </div>
                      <span className="text-xs text-gray-500">
                        {note.authorRole === 'doctor'
                          ? 'Dokter'
                          : note.authorRole === 'nurse'
                            ? 'Perawat'
                            : note.authorRole === 'administrator'
                              ? 'Administrator'
                              : 'Petugas'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center">
                    <ClockCircleOutlined className="mr-1" />
                    {dayjs(note.createdAt).format('DD MMM YYYY HH:mm')}
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-gray-800 text-sm pl-8">
                  {note.noteText}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
