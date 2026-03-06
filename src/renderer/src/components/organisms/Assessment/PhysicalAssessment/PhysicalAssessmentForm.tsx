import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Spin,
  Switch
} from 'antd'
import dayjs from 'dayjs'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import bodyMapImage from '@renderer/assets/images/body_map.png'
import { HEAD_TO_TOE_MAP } from '@renderer/config/maps/observation-maps'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '@renderer/hooks/query/use-observation'
import { AssessmentHeader } from '@renderer/components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES
} from '@renderer/utils/builders/observation-builder'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useBodyMarkerByEncounter,
  useBulkCreateBodyMarker
} from '@renderer/hooks/query/use-body-marker'
import { PatientData } from '@renderer/types/doctor.types'

const { Option } = Select
const { TextArea } = Input

interface BodyMarker {
  id: number
  x: number
  y: number
  note: string
}

interface PhysicalAssessmentFormProps {
  encounterId: string
  patientData: PatientData
}

export const PhysicalAssessmentForm: React.FC<PhysicalAssessmentFormProps> = ({
  encounterId,
  patientData
}) => {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { message } = App.useApp()
  const patientId = patientData.patient.id

  const [markers, setMarkers] = useState<BodyMarker[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempMarker, setTempMarker] = useState<{ x: number; y: number } | null>(null)
  const [markerNote, setMarkerNote] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)

  const bulkCreateObservation = useBulkCreateObservation()
  const { data: response, isLoading } = useObservationByEncounter(encounterId)
  const observationData = useMemo(() => response?.result || [], [response])

  const { data: bodyMarkerData, isLoading: isLoadingBodyMarker } =
    useBodyMarkerByEncounter(encounterId)
  const bulkCreateBodyMarker = useBulkCreateBodyMarker()

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

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

      setIsModalOpen(false)
      message.success('Penanda ditambahkan')
    } else {
      message.warning('Harap isi keterangan')
    }
  }

  const removeMarker = (id: number) => {
    const updatedMarkers = markers.filter((m) => m.id !== id)
    setMarkers(updatedMarkers)
  }

  const handleFinish = async (values: any) => {
    if (!patientId) {
      message.error('Data pasien tidak lengkap')
      return
    }

    if (!values.performerId) {
      message.error('Mohon pilih pemeriksa')
      return
    }

    try {
      setIsSubmitting(true)
      const obsToCreate: any[] = []
      const assessmentDate = values.assessment_date || dayjs()

      if (values.physicalExamination?.generalCondition) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: 'general-condition',
          display: 'Kondisi Umum',
          valueString: values.physicalExamination.generalCondition
        })
      }

      if (values.physicalExamination?.additionalNotes) {
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.EXAM,
          code: 'physical-exam-notes',
          display: 'Physical examination notes',
          valueString: values.physicalExamination.additionalNotes
        })
      }

      const anthropometryConfig = [
        {
          code: '8302-2',
          value: values.anthropometry?.height,
          display: 'Tinggi Badan',
          unit: 'cm'
        },
        {
          code: '29463-7',
          value: values.anthropometry?.weight,
          display: 'Berat Badan',
          unit: 'kg'
        },
        {
          code: '8277-6',
          value: values.anthropometry?.bsa,
          display: 'Luas Permukaan Tubuh',
          unit: 'm2'
        }
      ]

      anthropometryConfig.forEach((item) => {
        if (item.value !== undefined && item.value !== null) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
            code: item.code,
            display: item.display,
            system: 'http://loinc.org',
            valueQuantity: {
              value: Number(item.value),
              unit: item.unit,
              system: 'http://unitsofmeasure.org',
              code: item.unit
            }
          })
        }
      })

      Object.entries(HEAD_TO_TOE_MAP).forEach(([key, label]) => {
        const textValue = values[key]
        const isNormal = values[`${key}_NORMAL`]

        if (textValue || !isNormal) {
          const obsPayload: any = {
            category: OBSERVATION_CATEGORIES.EXAM,
            code: key,
            display: `Pemeriksaan ${label.split('(')[0].trim()}`,
            system: 'http://loinc.org',
            valueString: textValue || (isNormal ? 'Dalam batas normal' : 'Abnormal'),
            valueBoolean: isNormal,
            interpretations: [
              {
                code: isNormal ? 'N' : 'A',
                display: isNormal ? 'Normal' : 'Abnormal'
              }
            ]
          }

          if (key === '10201-2') {
            obsPayload.bodySite = {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '72914001',
                  display: 'Palatal structure'
                }
              ]
            }
          }

          if (key === '10201-2_tonsil') {
            obsPayload.code = '10201-2'
            obsPayload.bodySite = {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '91636008',
                  display: 'Bilateral palatine tonsils'
                }
              ]
            }
          }

          if (key === '11388-6_anus') {
            obsPayload.code = '11388-6'
            obsPayload.bodySite = {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '53505006',
                  display: 'Anal structure'
                }
              ]
            }
          }

          if (key === '11404-1_finger') {
            obsPayload.code = '11404-1'
            obsPayload.bodySite = {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '7569003',
                  display: 'Finger structure'
                }
              ]
            }
          }

          if (key === '32456-6_hand') {
            obsPayload.code = '32456-6'
            obsPayload.bodySite = {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '770812000',
                  display: 'Entire nail unit of finger'
                }
              ]
            }
          }

          if (key === '11385-2_ankle') {
            obsPayload.code = '11385-2'
            obsPayload.bodySite = {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '26552008',
                  display: 'Foot joint structure'
                }
              ]
            }
          }

          if (key === '11397-7_toe') {
            obsPayload.code = '11397-7'
            obsPayload.bodySite = {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '29707007',
                  display: 'Toe structure'
                }
              ]
            }
          }

          if (key === '32456-6_foot') {
            obsPayload.code = '32456-6'
            obsPayload.bodySite = {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '770805009',
                  display: 'Structure of nail unit of toe'
                }
              ]
            }
          }

          obsToCreate.push(obsPayload)
        }
      })

      if (obsToCreate.length > 0) {
        const observations = createObservationBatch(obsToCreate, assessmentDate)
        const performerName =
          performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'

        await bulkCreateObservation.mutateAsync({
          encounterId,
          patientId: patientId,
          observations,
          performerId: String(values.performerId),
          performerName: performerName
        })

        if (markers.length > 0) {
          await bulkCreateBodyMarker.mutateAsync({
            encounterId,
            markers: markers.map((m) => ({
              x: m.x,
              y: m.y,
              note: m.note
            })),
            createdBy: Number(values.performerId)
          })
        }

        message.success('Pemeriksaan fisik berhasil disimpan')
        form.resetFields(['assessment_date', 'performerId'])
        form.setFieldValue('assessment_date', dayjs())
      } else {
        message.info('Tidak ada data yang disimpan')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (observationData && Array.isArray(observationData) && observationData.length > 0) {
      const sortedObs = [...observationData].sort(
        (a: any, b: any) =>
          dayjs(b.effectiveDateTime || b.issued || b.createdAt).valueOf() -
          dayjs(a.effectiveDateTime || a.issued || a.createdAt).valueOf()
      )

      const initialValues: any = {
        physicalExamination: {}
      }

      const generalCond = sortedObs.find((obs: any) =>
        obs.codeCoding?.some((c: any) => c.code === 'general-condition')
      )
      if (generalCond) initialValues.physicalExamination.generalCondition = generalCond.valueString

      const notesObs = sortedObs.find((obs: any) =>
        obs.codeCoding?.some((c: any) => c.code === 'physical-exam-notes')
      )
      if (notesObs) initialValues.physicalExamination.additionalNotes = notesObs.valueString

      // Load Anthropometry
      const getVitalSign = (code: string) => {
        const found = sortedObs.find((obs: any) =>
          obs.codeCoding?.some((coding: any) => coding.code === code)
        )
        return found?.valueQuantity?.value
      }

      initialValues.anthropometry = {
        height: getVitalSign('8302-2'),
        weight: getVitalSign('29463-7'),
        bsa: getVitalSign('8277-6')
      }

      Object.keys(HEAD_TO_TOE_MAP).forEach((key) => {
        const found = sortedObs.find((obs: any) =>
          obs.codeCoding?.some((coding: any) => coding.code === key)
        )
        if (found) {
          initialValues[key] = found.valueString
          const isAbnormal =
            found.valueBoolean === false || found.interpretations?.some((i: any) => i.code === 'A')
          initialValues[`${key}_NORMAL`] = !isAbnormal
        } else {
          initialValues[`${key}_NORMAL`] = true
        }
      })

      const firstObs = sortedObs[0] as any
      const preloadedPerformerId = firstObs?.performers?.[0]?.practitionerId
      const preloadedDate = firstObs?.effectiveDateTime

      form.setFieldsValue({
        ...initialValues,
        assessment_date: preloadedDate ? dayjs(preloadedDate) : dayjs(),
        ...(preloadedPerformerId ? { performerId: Number(preloadedPerformerId) } : {})
      })
    }
  }, [observationData, form])

  useEffect(() => {
    if (bodyMarkerData?.result && Array.isArray(bodyMarkerData.result)) {
      const loadedMarkers = bodyMarkerData.result.map((m: any) => ({
        id: m.id,
        x: m.x,
        y: m.y,
        note: m.note
      }))
      setMarkers(loadedMarkers)
    }
  }, [bodyMarkerData])

  if (isLoading)
    return (
      <div className="p-8 text-center">
        <Spin tip="Memuat data..." />
      </div>
    )

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 overflow-y-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="flex flex-col gap-4"
          initialValues={{
            assessment_date: dayjs()
          }}
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
          <Card title="Body Map & Keadaan Umum" size="small">
            <Row gutter={24}>
              <Col span={24} lg={12}>
                <div className="mb-2 bg-blue-50 p-3 rounded text-blue-700 text-xs">
                  Klik pada gambar tubuh untuk menandai lokasi temuan.
                </div>
                <div
                  className="relative w-full overflow-hidden border border-gray-200 rounded-lg bg-white mb-4"
                  style={{ minHeight: '400px' }}
                >
                  <div className="relative mx-auto" style={{ maxWidth: '100%' }}>
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
                          transform: 'translate(-50%, -50%)'
                        }}
                        className="group"
                      >
                        <div className="w-5 h-5 bg-red-500 rounded-full border border-white shadow flex items-center justify-center text-white text-xs font-bold cursor-pointer">
                          {index + 1}
                        </div>
                        <div
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:flex bg-white rounded-full shadow p-1 cursor-pointer z-10"
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
              <Col span={24} lg={12}>
                <Form.Item
                  label="Keadaan Umum"
                  name={['physicalExamination', 'generalCondition']}
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Pilih keadaan umum">
                    <Option value="Baik">Baik</Option>
                    <Option value="Sedang">Sedang</Option>
                    <Option value="Buruk">Buruk</Option>
                  </Select>
                </Form.Item>

                <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-tight">
                  Tanda-tanda Vital & Antropometri
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <Form.Item
                    label="Tinggi Badan (cm)"
                    name={['anthropometry', 'height']}
                    className="mb-0"
                  >
                    <InputNumber placeholder="0" className="w-full" min={0} />
                  </Form.Item>
                  <Form.Item
                    label="Berat Badan (kg)"
                    name={['anthropometry', 'weight']}
                    className="mb-0"
                  >
                    <InputNumber placeholder="0" className="w-full" min={0} />
                  </Form.Item>
                  <Form.Item
                    label="LPB / BSA (m2)"
                    name={['anthropometry', 'bsa']}
                    className="mb-0"
                    tooltip="Luas Permukaan Tubuh (Body Surface Area) anak"
                  >
                    <InputNumber placeholder="0" className="w-full" min={0} step={0.01} />
                  </Form.Item>
                </div>
                <Form.Item
                  label="Catatan Pemeriksaan Lainnya"
                  name={['physicalExamination', 'additionalNotes']}
                >
                  <TextArea rows={12} placeholder="Catatan tambahan..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card title="Pemeriksaan Head to Toe" size="small">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </Card>
        </Form>
      </div>
      <div className="flex justify-end border-t border-white/10 mt-auto">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={() => form.submit()}
          loading={isSubmitting || bulkCreateObservation.isPending}
          size="large"
        >
          Simpan Perubahan
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
