import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Typography,
  App,
  AutoComplete,
  Spin
} from 'antd'
import { Content } from 'antd/es/layout/layout'
import dayjs from 'dayjs'
import { useMemo, useState, useEffect } from 'react'
import {
  useBulkCreateObservation,
  useObservationByEncounter,
  useDeleteObservation
} from '@renderer/hooks/query/use-observation'
import { useMasterProcedureList } from '@renderer/hooks/query/use-master-procedure'
import { mapDentalDataToObservationPayload } from './dental-mapper'
import { transformObservationsToTimeline } from '@renderer/config/observation-maps'
import { ToothDetail } from './type'
import Odontogram from './Odontogram'
import { TimelineContent } from './TimelineContent'
import { usePerformers } from '@renderer/hooks/query/use-performers'

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
    treatment: { code: string; name: string } | string
    condition: string
    dentist: string
    status: 'done' | 'pending'
    notes?: string
  }>()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [odontoKey, setOdontoKey] = useState<number>(0)
  const [hoveredTeeth, setHoveredTeeth] = useState<ToothDetail[]>([])
  const [selectedTreatmentData, setSelectedTreatmentData] = useState<{
    code: string
    name: string
  } | null>(null)
  const [procedureSearch, setProcedureSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { data: proceduresData, isLoading: isLoadingProcedures } = useMasterProcedureList({
    q: debouncedSearch,
    items: 20
  })
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])
  const { mutateAsync: saveToDB, isPending: isSaving } = useBulkCreateObservation()
  const { mutateAsync: deleteObs } = useDeleteObservation()
  const { data: observationData } = useObservationByEncounter(encounterId)

  const pendingToothIds = useMemo(() => pendingTeeth.map((t) => t.id).join(', '), [pendingTeeth])

  const onSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (encounterId && patientId && pendingTeeth.length > 0) {
        if (editingIndex !== null && selected[editingIndex]) {
          const originalEntry = selected[editingIndex]

          const currentObservationIds = pendingTeeth
            .map((t) => t.observationId)
            .filter((id): id is string => !!id)

          const idsToDelete = originalEntry.tooth
            .map((t) => t.observationId)
            .filter((id): id is string => !!id && !currentObservationIds.includes(id))

          if (idsToDelete.length > 0) {
            await Promise.all(idsToDelete.map((id) => deleteObs(id)))
          }
        }

        const selectedDoctor = performersData?.find((d: any) => d.id === values.dentist)
        const doctorName = selectedDoctor?.name || 'Dokter Tidak Diketahui'

        const treatmentValue = values.treatment
        const finalTreatment =
          selectedTreatmentData &&
          `${selectedTreatmentData.code} - ${selectedTreatmentData.name}` === treatmentValue
            ? selectedTreatmentData
            : treatmentValue

        const dentalData = {
          date: values.date,
          treatment: finalTreatment,
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
        treatment:
          selectedTreatmentData &&
          `${selectedTreatmentData.code} - ${selectedTreatmentData.name}` === values.treatment
            ? selectedTreatmentData
            : values.treatment,
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
    setProcedureSearch('')
    setSelectedTreatmentData(null)
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
      } else {
        message.warning('Tidak ada data ID yang ditemukan untuk dihapus')
      }
    } catch (error: any) {
      console.error('Error deleting dental data:', error)
      message.error(error?.message || 'Gagal menghapus data pemeriksaan gigi')
    }
  }

  const handleChange = (props: ToothDetail[]) => {
    setPendingTeeth(props)
    if (props.length === 0) return
    if (lastFormValues) {
      form.setFieldsValue(lastFormValues)
    }

    setIsModalOpen(true)
    setProcedureSearch('')
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(procedureSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [procedureSearch])

  useEffect(() => {
    if (observationData?.result?.all && observationData.result.all.length > 0) {
      const timelineData = transformObservationsToTimeline(observationData.result.all)
      setSelected(timelineData)
    } else {
      setSelected([])
    }
  }, [observationData])

  return (
    <Content className="md:ml-[40px] md:mr-[14px] my-4 rounded-md shadow">
      <div className="flex gap-4 w-full">
        <Card className="py-8 w-full max-w-lg h-[600px] flex justify-center items-center">
          <Odontogram
            key={odontoKey}
            theme="light"
            showTooltip={false}
            onChange={(props) => handleChange(props)}
            selectedIds={hoveredTeeth.map((t) => t.id)}
          />
        </Card>
        <Card
          className="flex-1 overflow-y-auto rounded-none border-0 border-l"
          title="Riwayat Pemeriksaan Gigi"
        >
          <div className="flex flex-col gap-3 mt-2">
            {selected.length > 0 ? (
              selected.map((item, idx) => (
                <TimelineContent
                  key={idx}
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
                    const foundDoc = performersData?.find((d: any) => d.name === item.dentist)
                    if (foundDoc) {
                      values.dentist = foundDoc.id
                    }

                    form.setFieldsValue(values as any)
                    setPendingTeeth(item.tooth)
                    setEditingIndex(idx)
                    setIsModalOpen(true)
                    if (item.treatment) {
                      let tName = ''
                      if (typeof item.treatment === 'string') {
                        tName = item.treatment
                        setSelectedTreatmentData(null)
                      } else if (
                        typeof item.treatment === 'object' &&
                        'code' in item.treatment &&
                        'name' in item.treatment
                      ) {
                        tName = `${item.treatment.code} - ${item.treatment.name}`
                        setSelectedTreatmentData(item.treatment)
                      }
                      setProcedureSearch(tName)
                      form.setFieldValue('treatment', tName)
                    } else {
                      setProcedureSearch('')
                      setSelectedTreatmentData(null)
                    }
                  }}
                  onDelete={() => handleDelete(item)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                <Typography.Text className="text-sm">
                  Belum ada data pemeriksaan gigi.
                </Typography.Text>
                <Typography.Text className="text-xs mt-1">
                  Silakan pilih gigi pada odontogram untuk memulai.
                </Typography.Text>
              </div>
            )}
          </div>
        </Card>
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
            <AutoComplete
              options={proceduresData?.map((p: any) => ({
                value: p.code,
                label: `${p.code} - ${p.name}`
              }))}
              onSearch={(val) => setProcedureSearch(val)}
              onSelect={(value, option) => {
                const selectedProc = proceduresData?.find((p: any) => p.code === value)

                if (selectedProc) {
                  console.log('Selected Procedure:', selectedProc)
                  const displayText = `${selectedProc.code} - ${selectedProc.name}`

                  setProcedureSearch(displayText)
                  setSelectedTreatmentData({ code: selectedProc.code, name: selectedProc.name })
                  form.setFieldValue('treatment', displayText)
                }
              }}
              onChange={(val) => setProcedureSearch(val)}
              placeholder="Ketik kode atau nama tindakan (min 2 karakter)"
              className="w-full"
              value={procedureSearch}
              defaultActiveFirstOption={false}
              notFoundContent={isLoadingProcedures ? <Spin size="small" /> : null}
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
              loading={isLoadingPerformers}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {performersData?.map((d: any) => (
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
