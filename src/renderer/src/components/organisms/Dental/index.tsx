import { Button, DatePicker, Form, Input, Modal, Select, Timeline, Typography, App } from 'antd'
import { Content } from 'antd/es/layout/layout'
import dayjs from 'dayjs'
import { useMemo, useState, useEffect } from 'react'
import {
  useBulkCreateObservation,
  useObservationByEncounter,
  useDeleteObservation
} from '@renderer/hooks/query/use-observation'
import { useMasterProcedureList } from '@renderer/hooks/query/use-master-procedure'
import { useQuery } from '@tanstack/react-query'
import { mapDentalDataToObservationPayload } from './dental-mapper'
import { transformObservationsToTimeline } from '@renderer/config/observation-maps'
import { ToothDetail } from './type'
import Odontogram from './Odontogram'
import { TimelineContent } from './TimelineContent'

export interface TimelineContentProps {
  date: string
  treatment: string
  condition: string
  dentist: string
  tooth: ToothDetail[]
  status: 'done' | 'pending'
  notes?: string
}

interface DentalPageProps {
  encounterId?: string
  patientId?: string
  onSaveSuccess?: () => void
}

const DentalPage = ({ encounterId, patientId, onSaveSuccess }: DentalPageProps = {}) => {
  const { message } = App.useApp()
  const { mutateAsync: saveToDB, isPending: isSaving } = useBulkCreateObservation()
  const { mutateAsync: deleteObs, isPending: isDeleting } = useDeleteObservation()
  const { data: observationData } = useObservationByEncounter(encounterId)

  const [selected, setSelected] = useState<TimelineContentProps[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingTeeth, setPendingTeeth] = useState<ToothDetail[]>([])
  const [lastFormValues, setLastFormValues] = useState<{
    date: any
    treatment: { code: string; name: string } | string
    condition: string
    dentist: string
    status: 'done' | 'pending'
    notes?: string
  } | null>(null)
  const [form] = Form.useForm<{
    date: any
    treatment: { code: string; name: string } | string // Allow object
    condition: string
    dentist: string
    status: 'done' | 'pending'
    notes?: string
  }>()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [odontoKey, setOdontoKey] = useState<number>(0)
  const [hoveredTeeth, setHoveredTeeth] = useState<ToothDetail[]>([])

  const [procedureSearch, setProcedureSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data: proceduresData, isLoading: isLoadingProcedures } = useMasterProcedureList({
    q: debouncedSearch,
    items: 20
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(procedureSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [procedureSearch])

  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['kepegawaian', 'list', 'dokter'],
    queryFn: async () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      const res = await fn()
      if (res.success && res.result) {
        return (
          res.result
            // .filter((p: any) => p.hakAksesId === 'dokter')
            .map((p: any) => ({
              id: String(p.id),
              name: p.namaLengkap
            }))
        )
      }
      return []
    }
  })

  useEffect(() => {
    if (observationData?.result?.all && observationData.result.all.length > 0) {
      const timelineData = transformObservationsToTimeline(observationData.result.all)
      setSelected(timelineData)
    } else {
      setSelected([])
    }
  }, [observationData])

  const handleChange = (props: ToothDetail[]) => {
    setPendingTeeth(props)
    if (props.length === 0) return
    if (lastFormValues) {
      form.setFieldsValue(lastFormValues)
    }

    setIsModalOpen(true)
  }

  const pendingToothIds = useMemo(() => pendingTeeth.map((t) => t.id).join(', '), [pendingTeeth])

  const onSubmit = async () => {
    try {
      const values = await form.validateFields()
      const dateStr = dayjs(values.date).isValid()
        ? dayjs(values.date).format('DD-MM-YYYY')
        : String(values.date ?? '01-01-2023')

      if (encounterId && patientId && pendingTeeth.length > 0) {
        if (editingIndex !== null && selected[editingIndex]) {
          const originalEntry = selected[editingIndex]
          const oldObservationIds = originalEntry.tooth
            .map((t) => t.observationId)
            .filter((id): id is string => !!id)

          if (oldObservationIds.length > 0) {
            await Promise.all(oldObservationIds.map((id) => deleteObs(id)))
          }
        }

        const selectedDoctor = doctorsData?.find((d: any) => d.id === values.dentist)
        const doctorName = selectedDoctor?.name || 'Dokter Tidak Diketahui'

        const dentalData = {
          date: values.date,
          treatment: values.treatment,
          condition: values.condition,
          dentist: doctorName,
          tooth: pendingTeeth,
          status: values.status,
          notes: values.notes
        }

        const payload = mapDentalDataToObservationPayload(dentalData, encounterId, patientId, {
          id: values.dentist,
          name: doctorName,
          role: 'Doctor'
        })

        await saveToDB(payload)
        message.success(`Berhasil menyimpan ${pendingTeeth.length} pemeriksaan gigi`)
        onSaveSuccess?.()
      }

      setLastFormValues({
        date: values.date,
        treatment: values.treatment,
        condition: values.condition,
        dentist: values.dentist,
        status: values.status,
        notes: values.notes
      })

      setIsModalOpen(false)
      form.resetFields()
      setEditingIndex(null)
      setPendingTeeth([])
      setOdontoKey((k) => k + 1)
    } catch (error: any) {
      console.error('Error saving dental data:', error)
      message.error(error?.message || 'Gagal menyimpan data pemeriksaan gigi')
    }
  }

  const onCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
    setEditingIndex(null)
    setPendingTeeth([])
    setOdontoKey((k) => k + 1)
  }

  const handleDelete = async (item: TimelineContentProps) => {
    try {
      const observationIds = item.tooth
        .map((t) => t.observationId)
        .filter((id): id is string => !!id)

      if (observationIds.length > 0) {
        await Promise.all(observationIds.map((id) => deleteObs(id)))
        message.success('Data dental berhasil dihapus')

        // Query invalidation handles UI update
      } else {
        message.warning('Tidak ada data ID yang ditemukan untuk dihapus')
      }
    } catch (error: any) {
      console.error('Error deleting dental data:', error)
      message.error(error?.message || 'Gagal menghapus data pemeriksaan gigi')
    }
  }

  return (
    <Content className="md:ml-[40px] md:mr-[14px] my-4 rounded-md shadow bg-white">
      <div className="flex gap-4 w-full">
        <div className="py-8 w-full max-w-lg h-[600px] flex justify-center items-center">
          <Odontogram
            key={odontoKey}
            theme="light"
            showTooltip={false}
            onChange={(props) => handleChange(props)}
            selectedIds={hoveredTeeth.map((t) => t.id)}
          />
        </div>
        <div className="bg-zinc-100 p-4 border-l border-l-zinc-300 w-full">
          <Typography.Title level={4}>Pemeriksaan Gigi</Typography.Title>
          <div className="flex items-center justify-start mt-8">
            {selected.length > 0 ? (
              <Timeline
                className="w-full"
                items={selected.map((item, idx) => ({
                  color: 'gray',
                  children: (
                    <TimelineContent
                      setHoveredTeeth={setHoveredTeeth}
                      date={item.date}
                      treatment={item.treatment}
                      condition={item.condition}
                      dentist={item.dentist}
                      tooth={item.tooth}
                      status={item.status}
                      notes={item.notes}
                      onEdit={() => {
                        const values = {
                          date: dayjs(item.date, 'DD-MM-YYYY'),
                          treatment: item.treatment,
                          condition: item.condition,
                          dentist: item.dentist,
                          status: item.status,
                          notes: item.notes
                        }
                        const foundDoc = doctorsData?.find((d: any) => d.name === item.dentist)
                        if (foundDoc) {
                          values.dentist = foundDoc.id
                        }

                        form.setFieldsValue(values as any)
                        setPendingTeeth(item.tooth)
                        setEditingIndex(idx)
                        setIsModalOpen(true)
                      }}
                      onDelete={() => handleDelete(item)}
                    />
                  )
                }))}
              />
            ) : (
              <Typography.Text>Silakan pilih gigi pada odontogram</Typography.Text>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="Tambah Tindakan"
        open={isModalOpen}
        onCancel={onCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'pending', date: dayjs() }}
          onFinish={onSubmit}
        >
          <Form.Item
            label="Tanggal"
            name="date"
            rules={[{ required: true, message: 'Tanggal wajib diisi' }]}
          >
            <DatePicker className="w-full" format="DD-MM-YYYY" />
          </Form.Item>
          <Form.Item
            label="Tindakan"
            name="treatment"
            rules={[{ required: true, message: 'Tindakan wajib diisi' }]}
          >
            <Select
              showSearch
              placeholder="Cari Tindakan (Contoh: Tambal)"
              loading={isLoadingProcedures}
              filterOption={false}
              onSearch={(val) => setProcedureSearch(val)}
              // Handle object value selection
              labelInValue
              options={proceduresData?.map((p: any) => ({
                label: `${p.code} - ${p.name}`,
                value: JSON.stringify({ code: p.code, name: p.name }) // Store as stringified JSON to workaround Antd Select limits with objects as keys
              }))}
              onChange={(value: any) => {
                // Parse if it's our JSON string
                try {
                  const parsed = JSON.parse(value.value)
                  form.setFieldValue('treatment', parsed)
                } catch (e) {
                  form.setFieldValue('treatment', value) // Fallback
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="Kondisi"
            name="condition"
            rules={[{ required: true, message: 'Kondisi wajib diisi' }]}
          >
            <Select
              placeholder="Pilih Kondisi"
              options={[
                { value: 'karies', label: 'Karies' },
                { value: 'tumpatan', label: 'Tumpatan (Filling)' },
                { value: 'psa', label: 'PSA (Perawatan Saluran Akar)' },
                { value: 'hilang', label: 'Gigi Hilang' },
                { value: 'impaksi', label: 'Impaksi' },
                { value: 'mahkota', label: 'Mahkota (Crown)' },
                { value: 'bridge', label: 'Jembatan (Bridge)' },
                { value: 'veneer', label: 'Veneer' },
                { value: 'cabut', label: 'Cabut (Extraction)' }
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Dokter Gigi"
            name="dentist"
            rules={[{ required: true, message: 'Nama dokter wajib diisi' }]}
          >
            <Select
              showSearch
              placeholder="Pilih Dokter"
              loading={isLoadingDoctors}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {doctorsData?.map((d: any) => (
                <Select.Option key={d.id} value={d.id}>
                  {d.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Status" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'pending', label: 'Menunggu' },
                { value: 'done', label: 'Selesai' }
              ]}
            />
          </Form.Item>
          <Form.Item label="Catatan" name="notes">
            <Input.TextArea placeholder="Tambahkan catatan tambahan" />
          </Form.Item>
          <Form.Item label="Gigi Terpilih">
            <Typography.Paragraph className="mb-2">{pendingToothIds || '-'}</Typography.Paragraph>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={onCancel}>Batal</Button>
            <Button type="primary" onClick={onSubmit} loading={isSaving}>
              Simpan
            </Button>
          </div>
        </Form>
      </Modal>
    </Content>
  )
}

export default DentalPage
