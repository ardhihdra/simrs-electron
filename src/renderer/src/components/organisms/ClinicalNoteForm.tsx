import { useState } from 'react'
import { Card, Button, Input, Spin, App, Empty, Tag, Avatar, Select, Space } from 'antd'
import { PlusOutlined, UserOutlined, ClockCircleOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CLINICAL_NOTE_TYPE_MAP } from '../../config/clinicalnote-maps'

const { TextArea } = Input

const useClinicalNote = (encounterId: string) => {
  const queryClient = useQueryClient()

  const notesQuery = useQuery({
    queryKey: ['clinical-note', encounterId],
    queryFn: async () => {
      try {
        const fn = window.api?.query?.clinicalNote?.getByEncounter
        if (!fn) throw new Error('API clinicalNote tidak tersedia')
        const res = await fn({ encounterId })
        return res.result || []
      } catch (err) {
        console.error('Error fetching clinical notes:', err)
        return []
      }
    },
    enabled: !!encounterId
  })

  const upsertMutation = useMutation({
    mutationFn: async (payload: { encounterId: string; notes: any[]; doctorId: number }) => {
      const fn = window.api?.query?.clinicalNote?.create
      if (!fn) throw new Error('API clinicalNote tidak tersedia')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-note', encounterId] })
    }
  })

  return { notesQuery, upsertMutation }
}

interface ClinicalNoteFormProps {
  encounterId: string
  doctorId?: number
}

export const ClinicalNoteForm = ({ encounterId, doctorId = 1 }: ClinicalNoteFormProps) => {
  const { notesQuery, upsertMutation } = useClinicalNote(encounterId)
  const { message } = App.useApp()

  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState('progress')
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = async () => {
    if (!noteText.trim()) return

    try {
      await upsertMutation.mutateAsync({
        encounterId,
        doctorId,
        notes: [{ type: noteType, text: noteText }]
      })
      message.success('Catatan berhasil disimpan')
      setNoteText('')
      setNoteType('progress')
      setIsEditing(false)
    } catch (error) {
      console.error(error)
      message.error('Gagal menyimpan catatan')
    }
  }

  const notes = (notesQuery.data || []).sort(
    (a: any, b: any) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card
        size="small"
        title="Tulis Catatan Baru"
        extra={
          !isEditing && (
            <Button type="link" size="small" onClick={() => setIsEditing(true)}>
              Tulis Catatan
            </Button>
          )
        }
      >
        {isEditing ? (
          <div className="flex flex-col gap-2">
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
        ) : (
          <div
            className="text-gray-400 italic cursor-pointer p-4 border border-dashed rounded text-center hover:bg-gray-50 transition-colors"
            onClick={() => setIsEditing(true)}
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
                        <span className="font-semibold text-gray-700">Dr. {note.authorId}</span>
                        <Tag color="cyan" className="text-xs m-0">
                          {CLINICAL_NOTE_TYPE_MAP[note.noteType] || note.noteType || 'Catatan'}
                        </Tag>
                      </div>
                      <span className="text-xs text-gray-500">Dokter</span>
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
