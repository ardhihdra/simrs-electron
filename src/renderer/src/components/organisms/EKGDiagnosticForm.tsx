/**
 * EKGDiagnosticForm.tsx
 *
 * Form Prosedur Diagnostik EKG — 3 Resource FHIR berantai:
 *
 * Step 1: ServiceRequest  → Order EKG (status: active)
 * Step 2: Procedure       → Pelaksanaan EKG (basedOn: ServiceRequest, status: completed)
 * Step 3: Observation     → Hasil EKG (basedOn: ServiceRequest, partOf: Procedure)
 *
 * Alur:
 *   [Buat SR] → simpan → dapat SR_id
 *   [Isi Procedure basedOn SR_id] → simpan → dapat Procedure_id
 *   [Isi Observation basedOn SR_id, partOf Procedure_id] → simpan
 */

import { useState, useEffect } from 'react'
import {
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Steps,
  Tag,
  TimePicker,
  Tooltip
} from 'antd'
import { CheckCircleOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import { AssessmentHeader } from './Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useBulkCreateServiceRequest,
  useServiceRequestByEncounter
} from '../../hooks/query/use-service-request'
import { useBulkCreateProcedure } from '../../hooks/query/use-procedure'
import {
  useBulkCreateObservation,
  useObservationByEncounter
} from '../../hooks/query/use-observation'
import type { PatientData } from '@renderer/types/doctor.types'

// =====================================================
// Constants
// =====================================================

const KEMKES_SYSTEM = 'http://terminology.kemkes.go.id'
const ICD9_SYSTEM = 'http://hl7.org/fhir/sid/icd-9-cm'
const KPTL_SYSTEM = 'http://terminology.kemkes.go.id/CodeSystem/kptl'
const SNOMED_SYSTEM = 'http://snomed.info/sct'
const LOINC_SYSTEM = 'http://loinc.org'

/** Komponen hasil EKG sesuai SNOMED */
const EKG_COMPONENTS = [
  {
    code: '426783006',
    display: 'Sinus rhythm (Irama sinus normal)',
    system: SNOMED_SYSTEM
  },
  {
    code: '164889003',
    display: 'Atrial fibrillation (Fibrilasi Atrium)',
    system: SNOMED_SYSTEM
  },
  {
    code: '76388001',
    display: 'ST segment elevation (Elevasi ST)',
    system: SNOMED_SYSTEM
  },
  {
    code: '26141007',
    display: 'ST segment depression (Depresi ST)',
    system: SNOMED_SYSTEM
  },
  {
    code: '59931005',
    display: 'Inverted T wave (T Inversi)',
    system: SNOMED_SYSTEM
  },
  {
    code: '164873001',
    display: 'Left ventricular hypertrophy (LVH)',
    system: SNOMED_SYSTEM
  }
]

// =====================================================
// Props
// =====================================================

interface EKGDiagnosticFormProps {
  encounterId: string
  patientData: PatientData
}

// =====================================================
// Component
// =====================================================

export const EKGDiagnosticForm = ({ encounterId, patientData }: EKGDiagnosticFormProps) => {
  const { message } = App.useApp()
  const [formSR] = Form.useForm()
  const [formProc] = Form.useForm()
  const [formObs] = Form.useForm()

  const [currentStep, setCurrentStep] = useState(0)
  const [createdSRId, setCreatedSRId] = useState<string | null>(null)
  const [createdProcId, setCreatedProcId] = useState<string | null>(null)

  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse'
  ])
  const { data: srData } = useServiceRequestByEncounter(encounterId)
  const { data: obsData } = useObservationByEncounter(encounterId)

  const createSR = useBulkCreateServiceRequest()
  const createProcedure = useBulkCreateProcedure()
  const createObservation = useBulkCreateObservation()

  // Autofill jika sudah ada ServiceRequest EKG sebelumnya
  useEffect(() => {
    if (!srData?.result || !Array.isArray(srData.result)) return
    const ekgSR = (srData.result as any[]).find(
      (sr) => sr.code === '89.52' || sr.codeDisplay?.includes('EKG')
    )
    if (ekgSR) {
      setCreatedSRId(String(ekgSR.id))
      formSR.setFieldsValue({
        authoredOn: ekgSR.authoredOn ? dayjs(ekgSR.authoredOn) : dayjs(),
        priority: ekgSR.priority || 'routine',
        performerId: ekgSR.performerId ? Number(ekgSR.performerId) : undefined
      })
    }
  }, [srData, formSR])

  // =====================================================
  // Step 1 — ServiceRequest
  // =====================================================

  const handleSaveSR = async (values: any) => {
    if (!encounterId) return

    try {
      const performerName =
        performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'

      const payload = {
        encounterId,
        patientId: String(patientData.patient.id),
        performerId: String(values.performerId),
        performerName,
        serviceRequests: [
          {
            status: 'active',
            intent: 'original-order',
            priority: values.priority || 'routine',
            category: KEMKES_SYSTEM,
            categoryCode: 'TK000028',
            categoryDisplay: 'Diagnostic procedure',
            code: '89.52',
            codeDisplay: 'Electrocardiogram',
            codeSystem: ICD9_SYSTEM,
            additionalCoding: [
              {
                system: KPTL_SYSTEM,
                code: '10925.x',
                display: 'EKG (Elektrokardiografi), Dewasa'
              }
            ],
            authoredOn: values.authoredOn ? values.authoredOn.toISOString() : dayjs().toISOString(),
            notes: values.notes || undefined
          }
        ]
      }

      const result = await createSR.mutateAsync(payload as any)
      const srId = result?.data?.[0]?.id || result?.result?.[0]?.id || uuidv4()
      setCreatedSRId(String(srId))
      message.success('Order EKG berhasil dibuat')
      setCurrentStep(1)
    } catch (err: any) {
      console.error(err)
      message.error(err?.message || 'Gagal membuat order EKG')
    }
  }

  // =====================================================
  // Step 2 — Procedure
  // =====================================================

  const handleSaveProcedure = async (values: any) => {
    if (!encounterId || !createdSRId) {
      message.warning('Buat order EKG terlebih dahulu')
      return
    }

    try {
      const performerName =
        performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'

      const startDT = values.performedStart
        ? values.performedStart.toISOString()
        : dayjs().toISOString()
      const endDT = values.performedEnd ? values.performedEnd.toISOString() : undefined

      const payload = {
        encounterId,
        patientId: String(patientData.patient.id),
        performerId: String(values.performerId),
        performerName,
        procedures: [
          {
            basedOn: [{ reference: `ServiceRequest/${createdSRId}` }],
            status: 'completed',
            category: KEMKES_SYSTEM,
            categoryCode: 'TK000028',
            categoryDisplay: 'Diagnostic procedure',
            code: '89.52',
            codeDisplay: 'Electrocardiogram',
            codeSystem: ICD9_SYSTEM,
            additionalCoding: [
              {
                system: SNOMED_SYSTEM,
                code: '29303009',
                display: 'Electrocardiographic procedure'
              }
            ],
            performedPeriodStart: startDT,
            performedPeriodEnd: endDT,
            notes: values.notes || undefined
          }
        ]
      }

      const result = await createProcedure.mutateAsync(payload as any)
      const procId = result?.data?.[0]?.id || result?.result?.[0]?.id || uuidv4()
      setCreatedProcId(String(procId))
      message.success('Data pelaksanaan EKG berhasil disimpan')
      setCurrentStep(2)
    } catch (err: any) {
      console.error(err)
      message.error(err?.message || 'Gagal menyimpan pelaksanaan EKG')
    }
  }

  // =====================================================
  // Step 3 — Observation (Hasil EKG)
  // =====================================================

  const handleSaveObservation = async (values: any) => {
    if (!encounterId || !createdSRId || !createdProcId) {
      message.warning('Selesaikan langkah sebelumnya terlebih dahulu')
      return
    }

    try {
      const performerName =
        performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'

      const effectiveDT = values.effectiveDateTime
        ? values.effectiveDateTime.toISOString()
        : dayjs().toISOString()

      // Build komponen checklist EKG
      const components = EKG_COMPONENTS.map((comp) => ({
        code: comp.code,
        display: comp.display,
        system: comp.system,
        valueBoolean: (values.components || []).includes(comp.code)
      }))

      const observations = [
        {
          category: 'procedure',
          code: '34534-8',
          display: '12 lead EKG panel',
          system: LOINC_SYSTEM,
          codeCoding: [
            {
              system: LOINC_SYSTEM,
              code: '34534-8',
              display: '12 lead EKG panel'
            }
          ],
          effectiveDateTime: effectiveDT,
          issued: effectiveDT,
          valueString: values.conclusion || undefined,
          components,
          // basedOn dan partOf dikirim via extra fields
          basedOn: [{ reference: `ServiceRequest/${createdSRId}` }],
          partOf: [{ reference: `Procedure/${createdProcId}` }]
        }
      ]

      await createObservation.mutateAsync({
        encounterId,
        patientId: String(patientData.patient.id),
        observations: observations as any,
        performerId: String(values.performerId),
        performerName
      })

      message.success('Hasil EKG berhasil disimpan')
      setCurrentStep(3)
    } catch (err: any) {
      console.error(err)
      message.error(err?.message || 'Gagal menyimpan hasil EKG')
    }
  }

  // =====================================================
  // Render Steps
  // =====================================================

  const steps = [
    {
      title: 'Order EKG',
      description: 'ServiceRequest',
      status: createdSRId ? 'finish' : currentStep === 0 ? 'process' : 'wait'
    },
    {
      title: 'Pelaksanaan',
      description: 'Procedure',
      status: createdProcId ? 'finish' : currentStep === 1 ? 'process' : 'wait'
    },
    {
      title: 'Hasil EKG',
      description: 'Observation',
      status: currentStep === 3 ? 'finish' : currentStep === 2 ? 'process' : 'wait'
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Progress Steps */}
      <Card>
        <Steps current={currentStep} items={steps as any} size="small" />
      </Card>

      {/* ==========================================
          Step 0: ServiceRequest (Order EKG)
          ========================================== */}
      {currentStep === 0 && (
        <Form
          form={formSR}
          layout="vertical"
          onFinish={handleSaveSR}
          initialValues={{ priority: 'routine', authoredOn: dayjs() }}
          className="flex flex-col gap-4"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Card
            title={
              <Space>
                <span>Step 1: Order EKG</span>
                <Tag color="blue">ServiceRequest</Tag>
              </Space>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item label="Prioritas" name="priority">
                <Select>
                  <Select.Option value="routine">Routine</Select.Option>
                  <Select.Option value="urgent">Urgent</Select.Option>
                  <Select.Option value="stat">STAT (Darurat)</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="Tanggal & Waktu Order" name="authoredOn">
                <DatePicker showTime className="w-full" />
              </Form.Item>
            </div>

            <div className="mt-2 p-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-700">
              <strong>Prosedur yang dipesan:</strong>
              <ul className="mt-1 list-disc ml-4">
                <li>ICD-9: 89.52 — Electrocardiogram</li>
                <li>KPTL: 10925.x — EKG (Elektrokardiografi), Dewasa</li>
                <li>Kategori Kemkes: TK000028 — Diagnostic procedure</li>
              </ul>
            </div>

            <Form.Item label="Catatan Tambahan" name="notes" className="mt-4">
              <Input.TextArea rows={2} placeholder="Misal: pasien alergi elektroda, dll." />
            </Form.Item>
          </Card>

          <div className="flex justify-between">
            {createdSRId && (
              <Tooltip title="Order EKG sudah ada, lewati ke step selanjutnya">
                <Button onClick={() => setCurrentStep(1)} icon={<CheckCircleOutlined />}>
                  SR sudah ada (Lewati)
                </Button>
              </Tooltip>
            )}
            <div className="ml-auto">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createSR.isPending}
                size="large"
              >
                Buat Order EKG
              </Button>
            </div>
          </div>
        </Form>
      )}

      {/* ==========================================
          Step 1: Procedure (Pelaksanaan EKG)
          ========================================== */}
      {currentStep === 1 && (
        <Form
          form={formProc}
          layout="vertical"
          onFinish={handleSaveProcedure}
          initialValues={{ performedStart: dayjs() }}
          className="flex flex-col gap-4"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Card
            title={
              <Space>
                <span>Step 2: Pelaksanaan EKG</span>
                <Tag color="orange">Procedure</Tag>
              </Space>
            }
          >
            <div className="mb-3 text-sm text-gray-500">
              Berdasarkan ServiceRequest: <Tag color="blue">#{createdSRId}</Tag>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="Waktu Mulai"
                name="performedStart"
                rules={[{ required: true, message: 'Isi waktu mulai' }]}
              >
                <DatePicker showTime className="w-full" />
              </Form.Item>

              <Form.Item label="Waktu Selesai" name="performedEnd">
                <DatePicker showTime className="w-full" />
              </Form.Item>
            </div>

            <Form.Item label="Catatan Pelaksanaan" name="notes">
              <Input.TextArea rows={2} placeholder="Kondisi pasien saat pemeriksaan, dll." />
            </Form.Item>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setCurrentStep(0)}>Kembali</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createProcedure.isPending}
              size="large"
            >
              Simpan Pelaksanaan
            </Button>
          </div>
        </Form>
      )}

      {/* ==========================================
          Step 2: Observation (Hasil EKG)
          ========================================== */}
      {currentStep === 2 && (
        <Form
          form={formObs}
          layout="vertical"
          onFinish={handleSaveObservation}
          initialValues={{ effectiveDateTime: dayjs(), components: [] }}
          className="flex flex-col gap-4"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          <Card
            title={
              <Space>
                <span>Step 3: Hasil Pemeriksaan EKG</span>
                <Tag color="purple">Observation</Tag>
              </Space>
            }
          >
            <div className="mb-3 text-sm text-gray-500">
              SR: <Tag color="blue">#{createdSRId}</Tag> | Procedure:{' '}
              <Tag color="orange">#{createdProcId}</Tag>
            </div>
            <div className="mb-1 text-sm text-gray-500">LOINC: 34534-8 — 12 lead EKG panel</div>

            <Form.Item label="Waktu Pemeriksaan" name="effectiveDateTime">
              <DatePicker showTime className="w-full" />
            </Form.Item>

            {/* Komponen Checklist */}
            <Form.Item label="Temuan EKG (centang semua yang positif/ada)" name="components">
              <Checkbox.Group className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  {EKG_COMPONENTS.map((comp) => (
                    <Checkbox key={comp.code} value={comp.code} className="ml-0!">
                      <span className="text-sm">{comp.display}</span>
                    </Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item label="Kesimpulan / Interpretasi Hasil" name="conclusion">
              <Input.TextArea
                rows={3}
                placeholder="Contoh: Hasil pemeriksaan EKG menunjukkan adanya gangguan irama jantung berupa atrial fibrillation..."
              />
            </Form.Item>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setCurrentStep(1)}>Kembali</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={createObservation.isPending}
              size="large"
            >
              Simpan Hasil EKG
            </Button>
          </div>
        </Form>
      )}

      {/* ==========================================
          Step 3: Selesai
          ========================================== */}
      {currentStep === 3 && (
        <Card>
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircleOutlined className="text-6xl text-green-500" />
            <div className="text-xl font-semibold text-green-600">Pemeriksaan EKG Selesai</div>
            <div className="text-gray-500 text-center">
              Seluruh data EKG (ServiceRequest, Procedure, Observation) telah berhasil disimpan.
            </div>
            <div className="flex gap-3 mt-2">
              <Tag color="blue">SR #{createdSRId}</Tag>
              <Tag color="orange">Proc #{createdProcId}</Tag>
            </div>
            <Button
              onClick={() => {
                setCurrentStep(0)
                setCreatedSRId(null)
                setCreatedProcId(null)
                formSR.resetFields()
                formProc.resetFields()
                formObs.resetFields()
              }}
            >
              Mulai Pemeriksaan Baru
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default EKGDiagnosticForm
