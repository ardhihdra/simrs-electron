import { useEffect } from 'react'
import { Card, Button, Input, Form, Spin, Switch, App } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HEAD_TO_TOE_MAP } from '@renderer/config/maps/observation-maps'

const { TextArea } = Input

interface HeadToToeFormProps {
  encounterId: string
  patientId?: string
}

export const HeadToToeForm = ({ encounterId, patientId }: HeadToToeFormProps) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { message: antdMessage } = App.useApp()

  const { data: observationData, isLoading } = useQuery({
    queryKey: ['observations', encounterId, 'exam'],
    queryFn: async () => {
      const fn = window.api?.query?.observation?.getByEncounter
      if (!fn) throw new Error('API observation tidak tersedia')
      const res = await fn({ encounterId })
      return Array.isArray(res.result) ? res.result : []
    }
  })

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

  useEffect(() => {
    if (observationData && Array.isArray(observationData)) {
      const examObservations = observationData.filter((obs: any) =>
        obs.categories?.some((cat: any) => cat.code === 'exam')
      )

      const initialValues: any = {}

      examObservations.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      HEAD_TO_TOE_MAP.forEach((item) => {
        const fieldKey = item.bodySite ? `${item.code}_${item.bodySite.code}` : item.code

        const found = examObservations.find((obs: any) => {
          const hasBaseCode = obs.codeCoding?.some((coding: any) => coding.code === item.code)
          if (!hasBaseCode) return false

          const obsBodySiteCode = obs.bodySites?.[0]?.code

          if (item.bodySite) {
            // Must match specific bodySite
            return obsBodySiteCode === item.bodySite.code
          } else {
            // Must NOT have any bodySite that belongs to other sub-items under the same code
            const siblingsWithBodySite = HEAD_TO_TOE_MAP.filter(
              (mapItem) => mapItem.code === item.code && mapItem.bodySite
            )
            const knownSiblingCodes = siblingsWithBodySite.map((sibling) => sibling.bodySite!.code)

            return !obsBodySiteCode || !knownSiblingCodes.includes(obsBodySiteCode)
          }
        })

        if (found) {
          initialValues[fieldKey] = found.valueString
          const isAbnormal =
            found.valueBoolean === false || found.interpretations?.some((i: any) => i.code === 'A')
          initialValues[`${fieldKey}_NORMAL`] = !isAbnormal
        } else {
          initialValues[`${fieldKey}_NORMAL`] = true
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

    HEAD_TO_TOE_MAP.forEach((item) => {
      const fieldKey = item.bodySite ? `${item.code}_${item.bodySite.code}` : item.code
      const textValue = values[fieldKey]
      const isNormal = values[`${fieldKey}_NORMAL`]

      if (textValue || !isNormal) {
        const obsPayload: any = {
          category: 'exam',
          code: item.code,
          display: `Physical findings of ${item.label.split('(')[0].trim()} Narrative`,
          system: 'http://loinc.org',
          valueString: textValue || (isNormal ? 'Dalam batas normal' : 'Abnormal'),
          valueBoolean: isNormal,
          interpretations: [
            {
              code: isNormal ? 'N' : 'A',
              display: isNormal ? 'Normal' : 'Abnormal',
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation'
            }
          ]
        }

        if (item.bodySite) {
          obsPayload.bodySites = [
            {
              code: item.bodySite.code,
              display: item.bodySite.display,
              system: 'http://snomed.info/sct'
            }
          ]
        }

        observationsToSave.push(obsPayload)
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
              {HEAD_TO_TOE_MAP.map((item) => {
                const fieldKey = item.bodySite ? `${item.code}_${item.bodySite.code}` : item.code
                return (
                  <Card
                    key={fieldKey}
                    size="small"
                    title={item.label}
                    className="bg-gray-50 border-gray-200"
                    extra={
                      <Form.Item
                        name={`${fieldKey}_NORMAL`}
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
                    <Form.Item name={fieldKey} className="mb-0">
                      <TextArea
                        rows={2}
                        placeholder={`Deskripsi hasil pemeriksaan ${item.label}...`}
                      />
                    </Form.Item>
                  </Card>
                )
              })}
            </div>
          </Form>
        )}
      </Card>
    </div>
  )
}
