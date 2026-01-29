import { Card, Button, Input, Form, Spin, App, Space } from 'antd'
import { SaveOutlined, FileTextOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const { TextArea } = Input

interface ClinicalAnnotationFormProps {
  encounterId: string
  patientId?: string
  category?: string
  code?: string
  display?: string
  label?: string
  placeholder?: string
}

export const ClinicalAnnotationForm = ({
  encounterId,
  patientId,
  category = 'exam',
  code = '8410-0',
  display = 'Physical exam description Narrative',
  label = 'Catatan Pemeriksaan Fisik',
  placeholder = 'Tuliskan catatan tambahan mengenai hasil pemeriksaan fisik di sini...'
}: ClinicalAnnotationFormProps) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { message: antdMessage } = App.useApp()

  const { data: observationData, isLoading } = useQuery<any[]>({
    queryKey: ['observations', encounterId, code],
    queryFn: async () => {
      const fn = window.api?.query?.observation?.getByEncounter
      if (!fn) throw new Error('API observation tidak tersedia')
      const res = await fn({ encounterId })

      let allObs: any[] = []
      if (res.result && !Array.isArray(res.result) && Array.isArray(res.result.all)) {
        allObs = res.result.all
      } else {
        allObs = Array.isArray(res.result) ? res.result : []
      }

      const filtered = allObs.filter((obs: any) =>
        obs.codeCoding?.some((coding: any) => coding.code === code)
      )
      filtered.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      return filtered
    },
    enabled: !!encounterId
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const fn = window.api?.query?.observation?.create
      if (!fn) throw new Error('API observation tidak tersedia')

      return fn({
        encounterId,
        patientId: patientId || '',
        observations: [payload]
      })
    },
    onSuccess: () => {
      antdMessage.success('Catatan berhasil disimpan')
      form.resetFields(['note'])
      queryClient.invalidateQueries({ queryKey: ['observations', encounterId] })
    },
    onError: (err) => {
      console.error(err)
      antdMessage.error('Gagal menyimpan catatan')
    }
  })

  const handleSubmit = async (values: any) => {
    if (!patientId) {
      antdMessage.error('Data pasien tidak lengkap')
      return
    }

    if (!values.note?.trim()) {
      antdMessage.warning('Silakan isi catatan terlebih dahulu')
      return
    }

    const payload = {
      category,
      code,
      display,
      system: 'http://loinc.org',
      valueString: values.note,
      notes: [values.note]
    }

    await saveMutation.mutateAsync(payload)
  }

  const history = observationData || []

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={
          <Space>
            <FileTextOutlined className="text-blue-500" />
            <span>{label}</span>
          </Space>
        }
        size="small"
        className="border-blue-100"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="note" className="mb-2">
            <TextArea rows={4} placeholder={placeholder} className="border-gray-200" />
          </Form.Item>
          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
            >
              Simpan Catatan Baru
            </Button>
          </div>
        </Form>
      </Card>
      <div className="bg-white rounded-lg p-2 border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-500 mb-3 ml-1">Riwayat {label}</h4>
        {isLoading ? (
          <div className="text-center p-4">
            <Spin size="small" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center p-4 text-gray-400 italic text-sm">
            Belum ada riwayat catatan...
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
            {history.map((item: any) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 border border-gray-100 rounded-md relative group hover:border-blue-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-1 text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                  <span>Audit Log #{item.id}</span>
                  <span>
                    {new Date(item.createdAt).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {item.notes?.[0]?.text || item.valueString}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClinicalAnnotationForm
