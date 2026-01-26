import { useEffect } from 'react'
import { Card, Button, Input, Form, Spin, Switch, App } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HEAD_TO_TOE_MAP } from '../../config/observation-maps'

const { TextArea } = Input

interface HeadToToeFormProps {
  encounterId: string
  patientId?: string
}

export const HeadToToeForm = ({ encounterId, patientId }: HeadToToeFormProps) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { message: antdMessage } = App.useApp()

  // Fetch existing observations
  const { data: observationData, isLoading } = useQuery({
    queryKey: ['observations', encounterId, 'exam'],
    queryFn: async () => {
      const fn = window.api?.query?.observation?.getByEncounter
      if (!fn) throw new Error('API observation tidak tersedia')
      const res = await fn({ encounterId })
      if (res.result && !Array.isArray(res.result) && Array.isArray(res.result.all)) {
        return res.result.all
      }
      return Array.isArray(res.result) ? res.result : []
    }
  })

  // Mutation to save
  const saveMutation = useMutation({
    mutationFn: async (observations: any[]) => {
      const fn = window.api?.query?.observation?.create
      if (!fn) throw new Error('API observation tidak tersedia')

      return fn({
        encounterId,
        patientId: patientId || '',
        observations
      })
    },
    onSuccess: () => {
      antdMessage.success('Data Pemeriksaan Fisik berhasil disimpan')
      queryClient.invalidateQueries({ queryKey: ['observations', encounterId] })
    },
    onError: (err) => {
      console.error(err)
      antdMessage.error('Gagal menyimpan data')
    }
  })

  // Populate Form
  useEffect(() => {
    if (observationData && Array.isArray(observationData)) {
      const examObservations = observationData.filter((obs: any) =>
        obs.categories?.some((cat: any) => cat.code === 'exam')
      )

      const initialValues: any = {}

      // Sort by date desc to get latest
      examObservations.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      Object.keys(HEAD_TO_TOE_MAP).forEach((key) => {
        const found = examObservations.find((obs: any) =>
          obs.codeCoding?.some((coding: any) => coding.code === key)
        )
        if (found) {
          initialValues[key] = found.valueString
          // Robust check: check valueBoolean or look into interpretations array
          const isAbnormal =
            found.valueBoolean === false || found.interpretations?.some((i: any) => i.code === 'A')
          initialValues[`${key}_NORMAL`] = !isAbnormal
        } else {
          initialValues[`${key}_NORMAL`] = true
        }
      })

      form.setFieldsValue(initialValues)
    }
  }, [observationData, form])

  const handleSubmit = async (values: any) => {
    if (!patientId) {
      antdMessage.error('Data pasien tidak lengkap (Missing ID)')
      return
    }

    const observationsToSave: any[] = []

    Object.entries(HEAD_TO_TOE_MAP).forEach(([key, label]) => {
      const textValue = values[key]
      const isNormal = values[`${key}_NORMAL`]

      if (textValue || !isNormal) {
        observationsToSave.push({
          category: 'exam',
          code: key,
          display: `Physical findings of ${label.split('(')[0].trim()} Narrative`,
          system: 'http://loinc.org',
          valueString: textValue || (isNormal ? 'Dalam batas normal' : 'Abnormal'),
          valueBoolean: isNormal,
          // FHIR Interpretation: N (Normal) or A (Abnormal)
          interpretations: [
            {
              code: isNormal ? 'N' : 'A',
              display: isNormal ? 'Normal' : 'Abnormal',
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation'
            }
          ],
          bodySites: [
            {
              code: key,
              display: label,
              system: 'http://snomed.info/sct'
            }
          ]
        })
      }
    })

    if (observationsToSave.length === 0) {
      antdMessage.info('Tidak ada data perubahan untuk disimpan')
      return
    }

    await saveMutation.mutateAsync(observationsToSave)
  }

  return (
    <div className="h-full flex flex-col">
      <Card
        title="Pemeriksaan Fisik (Head to Toe)"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={saveMutation.isPending}
          >
            Simpan Pemeriksaan
          </Button>
        }
        className="h-full flex flex-col"
        bodyStyle={{ flex: 1, overflow: 'auto' }}
      >
        {isLoading ? (
          <div className="text-center p-8">
            <Spin />
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(HEAD_TO_TOE_MAP).map(([key, label]) => (
                <Card
                  key={key}
                  size="small"
                  title={label}
                  className="bg-gray-50 border-gray-200"
                  extra={
                    <Form.Item
                      name={`${key}_NORMAL`}
                      valuePropName="checked"
                      noStyle
                      initialValue={true}
                    >
                      <Switch
                        checkedChildren="Normal"
                        unCheckedChildren="Abnormal"
                        defaultChecked
                      />
                    </Form.Item>
                  }
                >
                  <Form.Item name={key} className="mb-0">
                    <TextArea rows={2} placeholder={`Deskripsi hasil pemeriksaan ${label}...`} />
                  </Form.Item>
                </Card>
              ))}
            </div>
          </Form>
        )}
      </Card>
    </div>
  )
}
