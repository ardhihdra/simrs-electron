import { Button, Form, Input, InputNumber, Select, DatePicker, Card } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'

// Enums copied locally to avoid import issues with main process
enum MedicationRequestStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  STOPPED = 'stopped',
  DRAFT = 'draft',
  UNKNOWN = 'unknown'
}

enum MedicationRequestIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  ORDER = 'order',
  ORIGINAL_ORDER = 'original-order',
  REFLEX_ORDER = 'reflex-order',
  FILLER_ORDER = 'filler-order',
  INSTANCE_ORDER = 'instance-order',
  OPTION = 'option'
}

enum MedicationRequestPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  ASAP = 'asap',
  STAT = 'stat'
}

interface FormData {
  status: MedicationRequestStatus
  intent: MedicationRequestIntent
  priority?: MedicationRequestPriority
  patientId: string
  encounterId?: string | null
  requesterId?: number | null
  authoredOn?: any
  // Single mode (Edit)
  medicationId?: number | null
  dosageInstruction?: string | null
  note?: string | null
  // Bulk mode (Create)
  items?: Array<{
    medicationId: number
    dosageInstruction?: string
    note?: string
    quantity?: number
    quantityUnit?: string
  }>
  // Compounds mode (Racikan)
  compounds?: Array<{
    name: string
    dosageInstruction?: string
    quantity?: number
    quantityUnit?: string
    items: Array<{
      sourceType?: 'medicine' | 'substance'
      medicationId?: number
      rawMaterialId?: number
      note?: string
    }>
  }>
}

export function MedicationRequestForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const selectedPatientId = Form.useWatch('patientId', form)
  const isEdit = Boolean(id)
  const [session, setSession] = useState<any>(null)

  const buildDispenseRequest = (quantity?: number, unit?: string) => {
    if (!quantity) return null
    return {
      quantity: {
        value: quantity,
        unit: unit || undefined
      }
    }
  }

  useEffect(() => {
    window.api.auth.getSession().then((res) => {
      if (res.success) setSession(res)
    })
  }, [])

  const { data: detailData } = useQuery({
    queryKey: ['medicationRequest', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.medicationRequest?.getById
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  // Fetch lists for dropdowns
  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', 'list'],
    queryFn: () => window.api?.query?.patient?.list({ limit: 100 })
  })

  const { data: medicineData, isLoading: medicineLoading } = useQuery({
    queryKey: ['medicine', 'list'],
    queryFn: () => window.api?.query?.medicine?.list({ limit: 100 })
  })

  interface RawMaterialAttributes {
    id?: number
    name: string
  }

  interface RawMaterialApi {
    list: () => Promise<{ success: boolean; result?: RawMaterialAttributes[]; message?: string }>
  }

  const { data: rawMaterialData, isLoading: rawMaterialLoading } = useQuery({
    queryKey: ['rawMaterial', 'list'],
    queryFn: async () => {
      const api = (window.api?.query as { rawMaterial?: RawMaterialApi }).rawMaterial
      const fn = api?.list
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
      return fn()
    }
  })

  const { data: encounterData, isLoading: encounterLoading } = useQuery({
    queryKey: ['encounter', 'list', selectedPatientId],
    queryFn: () => window.api?.query?.encounter?.list({ 
      limit: 100,
      patientId: selectedPatientId // Filter by patient if selected
    }),
    enabled: !!selectedPatientId || isEdit // Only fetch when patient is selected or in edit mode
  })
  
  const { data: requesterData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => window.api?.query?.kepegawaian?.list()
  })

  const patientOptions = useMemo(() => 
    ((patientData?.data || []) as any[]).map((p) => ({ label: `${p.name} (${p.mrNo})`, value: p.id })), 
    [patientData]
  )

  const medicineOptions = useMemo(() => 
    ((medicineData?.result || []) as any[]).map((m) => ({ label: m.name, value: m.id })), 
    [medicineData]
  )

  const rawMaterialOptions = useMemo(
    () => {
      const source = (rawMaterialData?.result ?? []) as RawMaterialAttributes[]
      return source
        .filter((rm) => typeof rm.id === 'number')
        .map((rm) => ({ label: rm.name, value: rm.id as number }))
    },
    [rawMaterialData]
  )

  const encounterOptions = useMemo(() => 
    ((encounterData?.data || []) as any[]).map((e) => ({ label: `${e.encounterCode || e.id} - ${e.patient?.name || 'Unknown'}`, value: e.id })), 
    [encounterData]
  )

  // Auto-fill Requester from Session (match NIK)
  useEffect(() => {
    if (session?.user?.username && requesterData?.result && !isEdit) {
      // session.user.username stores NIK based on main/routes/auth.ts logic
      const currentNik = session.user.username
      const employees = requesterData.result as { nik?: string; id: number }[]
      const foundEmployee = employees.find(e => e.nik === currentNik)
      
      if (foundEmployee) {
        form.setFieldValue('requesterId', foundEmployee.id)
      }
    }
  }, [session, requesterData, isEdit, form])

  // Auto-fill Encounter when Patient is selected
  useEffect(() => {
    if (selectedPatientId && encounterData?.result && !isEdit) {
      // Find active encounter (status: in-progress / active)
      // Assuming result is array of encounters. Adjust based on actual API response structure.
      const encounters = (encounterData.result || encounterData.data || []) as any[]
      const activeEncounter = encounters.find(e => e.status === 'in-progress' || e.status === 'active')
      
      if (activeEncounter) {
        form.setFieldValue('encounterId', activeEncounter.id)
      } else if (encounters.length > 0) {
        // Fallback to most recent?
        form.setFieldValue('encounterId', encounters[0].id)
      }
    }
  }, [selectedPatientId, encounterData, isEdit, form])

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.data) {
      const d = detailData.data as FormData & {
        id: number
        dosageInstruction?: Array<{ text?: string }>
        dispenseRequest?: {
          quantity?: {
            value?: number
            unit?: string
          }
        }
      }

      form.setFieldsValue({
        status: d.status,
        intent: d.intent,
        priority: d.priority,
        patientId: d.patientId,
        encounterId: d.encounterId ?? null,
        requesterId: d.requesterId ?? null,
        authoredOn: d.authoredOn ? dayjs(d.authoredOn) : undefined,
        items: [
          {
            medicationId: d.medicationId ?? 0,
            dosageInstruction:
              d.dosageInstruction && d.dosageInstruction[0]
                ? d.dosageInstruction[0].text ?? ''
                : '',
            note: d.note ?? '',
            quantity: d.dispenseRequest?.quantity?.value,
            quantityUnit: d.dispenseRequest?.quantity?.unit
          }
        ]
      })
    } else if (!isEdit) {
      form.setFieldsValue({
        status: MedicationRequestStatus.ACTIVE,
        intent: MedicationRequestIntent.ORDER,
        priority: MedicationRequestPriority.ROUTINE,
        authoredOn: dayjs(),
        items: [{ medicationId: null as unknown as number }]
      })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['medicationRequest', 'create'],
    mutationFn: (data: any) => {
      const fn = window.api?.query?.medicationRequest?.create
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
      navigate('/dashboard/medicine/medication-requests')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['medicationRequest', 'update'],
    mutationFn: (data: any) => {
      const fn = window.api?.query?.medicationRequest?.update
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'detail', id] })
    }
  })

  const onFinish = async (values: FormData) => {
    const commonPayload = {
      status: values.status,
      intent: values.intent,
      priority: values.priority,
      patientId: values.patientId,
      encounterId: values.encounterId,
      requesterId: values.requesterId,
      authoredOn: values.authoredOn ? values.authoredOn.format('YYYY-MM-DD HH:mm:ss') : null
    }

    if (isEdit) {
      const items = values.items ?? []
      const compounds = values.compounds ?? []

      const firstItem = items.length > 0 ? items[0] : undefined

      type DetailWithGroup = FormData & {
        id: number
        groupIdentifier?: {
          system?: string
          value?: string
        } | null
      }

      const detail = (detailData?.data as DetailWithGroup | undefined) || undefined

      const extraItems = items.slice(1)
      const hasExtraItems = extraItems.length > 0
      const hasCompounds = compounds.length > 0

      const baseGroupIdentifier = detail?.groupIdentifier ?? undefined

      const groupIdentifier = hasExtraItems || hasCompounds
        ? baseGroupIdentifier ?? {
            system: 'http://sys-ids/prescription-group',
            value: `${Date.now()}`
          }
        : baseGroupIdentifier

      const updatePayload = {
        ...commonPayload,
        medicationId: firstItem?.medicationId,
        dosageInstruction: firstItem?.dosageInstruction
          ? [{ text: firstItem.dosageInstruction }]
          : null,
        note: firstItem?.note ?? null,
        dispenseRequest: buildDispenseRequest(firstItem?.quantity, firstItem?.quantityUnit),
        groupIdentifier
      }

      const extraSimplePayloads = groupIdentifier
        ? extraItems.map((item) => ({
            ...commonPayload,
            groupIdentifier,
            medicationId: item.medicationId,
            dosageInstruction: item.dosageInstruction ? [{ text: item.dosageInstruction }] : null,
            note: item.note,
            dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit)
          }))
        : []

      const extraCompoundPayloads = groupIdentifier
        ? compounds.flatMap((comp, idx) => {
            const compoundId = `${Date.now()}-comp-${idx}`
            const compoundItems = comp.items ?? []
            return compoundItems
              .filter((item) => typeof item.medicationId === 'number')
              .map((item) => ({
                ...commonPayload,
                groupIdentifier,
                medicationId: item.medicationId as number,
                dosageInstruction: comp.dosageInstruction ? [{ text: comp.dosageInstruction }] : null,
                identifier: [{ system: 'racikan-group', value: compoundId }],
                note: `[Racikan: ${comp.name}] ${item.note || ''}`,
                category: [{ text: 'racikan', code: 'compound' }],
                dispenseRequest: buildDispenseRequest(comp.quantity, comp.quantityUnit)
              }))
          })
        : []

      const createPayload = [...extraSimplePayloads, ...extraCompoundPayloads]

      await updateMutation.mutateAsync({ ...updatePayload, id: Number(id) })

      if (createPayload.length > 0) {
        const fn = window.api?.query?.medicationRequest?.create
        if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
        await fn(createPayload)
      }

      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'detail', id] })
      navigate('/dashboard/medicine/medication-requests')
    } else {
       // Create mode - handle multiple items
       const items = values.items || []
       const compounds = values.compounds || []
       const groupIdentifier = { system: 'http://sys-ids/prescription-group', value: `${Date.now()}` }
       
       const simplePayloads = items.map(item => ({
         ...commonPayload,
         groupIdentifier,
         medicationId: item.medicationId,
         dosageInstruction: item.dosageInstruction ? [{ text: item.dosageInstruction }] : null,
         note: item.note,
         dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit)
       }))

       const compoundPayloads = compounds.flatMap((comp, idx) => {
        const compoundId = `${Date.now()}-comp-${idx}`
        const compoundItems = comp.items || []
        return compoundItems
          .filter(item => typeof item.medicationId === 'number')
          .map(item => ({
             ...commonPayload,
             groupIdentifier,
             medicationId: item.medicationId as number,
             dosageInstruction: comp.dosageInstruction ? [{ text: comp.dosageInstruction }] : null,
             identifier: [{ system: 'racikan-group', value: compoundId }],
             note: `[Racikan: ${comp.name}] ${item.note || ''}`,
             category: [{ text: 'racikan', code: 'compound' }],
             dispenseRequest: buildDispenseRequest(comp.quantity, comp.quantityUnit)
          }))
       })

       const payload = [...simplePayloads, ...compoundPayloads]
       
       if (payload.length === 0) {
         // Prevent empty submission if needed, or backend handles it
         return
       }

       createMutation.mutate(payload)
     }
  }

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Ubah Permintaan Obat' : 'Permintaan Obat Baru'}</h2>
          <Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>Kembali</Button>
        </div>
        
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
            {/* Header Fields (Patient & Context) */}
            <div className="space-y-2">
              <Form.Item label="Pasien" name="patientId" rules={[{ required: true, message: 'Pasien wajib diisi' }]}>
                <Select 
                  options={patientOptions} 
                  placeholder="Pilih Pasien" 
                  showSearch 
                  optionFilterProp="label" 
                  loading={patientLoading} 
                />
              </Form.Item>
              
              <Form.Item label="Kunjungan (Encounter)" name="encounterId">
                <Select 
                  options={encounterOptions} 
                  placeholder="Pilih Kunjungan" 
                  showSearch 
                  optionFilterProp="label" 
                  loading={encounterLoading} 
                  allowClear
                />
              </Form.Item>

              {/* Requester is now handled automatically by backend */}
            </div>

            <div className="space-y-2">
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select options={Object.values(MedicationRequestStatus).map(v => ({ label: v, value: v }))} />
              </Form.Item>

              <Form.Item label="Tujuan (Intent)" name="intent" rules={[{ required: true }]}>
                <Select options={Object.values(MedicationRequestIntent).map(v => ({ label: v, value: v }))} />
              </Form.Item>

              <Form.Item label="Prioritas" name="priority">
                <Select options={Object.values(MedicationRequestPriority).map(v => ({ label: v, value: v }))} />
              </Form.Item>

              <Form.Item label="Tanggal Penulisan" name="authoredOn">
                <DatePicker showTime className="w-full" />
              </Form.Item>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-lg mb-4">Daftar Obat</h3>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <div className="space-y-4">
                  {fields.map(({ key, name, ...restField }, index) => (
                    <div
                      key={key}
                      className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg relative group"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Form.Item
                            {...restField}
                            name={[name, 'medicationId']}
                            label="Obat"
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                            className="mb-0"
                          >
                            <Select
                              options={medicineOptions}
                              placeholder="Pilih Obat"
                              showSearch
                              optionFilterProp="label"
                              loading={medicineLoading}
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'dosageInstruction']}
                            label="Instruksi"
                            className="mb-0"
                          >
                            <Input placeholder="Dosis..." />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantity']}
                            label="Jumlah"
                            className="mb-0"
                          >
                            <InputNumber<number> min={1} className="w-full" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantityUnit']}
                            label="Satuan"
                            className="mb-0"
                          >
                            <Input placeholder="Contoh: tablet, kapsul, botol" />
                          </Form.Item>
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'note']}
                          label="Catatan"
                          className="mb-0"
                        >
                          <Input placeholder="Catatan..." />
                        </Form.Item>
                      </div>
                      {fields.length > 1 && index > 0 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          className="mt-8"
                        />
                      )}
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Tambah Obat
                    </Button>
                  </Form.Item>
                </div>
              )}
            </Form.List>

            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-4">Daftar Obat Racikan</h3>
              <Form.List name="compounds">
                {(fields, { add, remove }) => (
                  <div className="space-y-6">
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        size="small"
                        title={`Racikan ${name + 1}`}
                        extra={
                          <Button type="text" danger onClick={() => remove(name)}>
                            Hapus
                          </Button>
                        }
                        className="bg-orange-50 border-orange-100"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="Nama Racikan"
                            rules={[{ required: true, message: 'Nama racikan wajib diisi' }]}
                            className="mb-0"
                          >
                            <Input placeholder="Contoh: Puyer Batuk Pilek" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'dosageInstruction']}
                            label="Signa / Dosis Racikan"
                            rules={[{ required: true, message: 'Dosis racikan wajib diisi' }]}
                            className="mb-0"
                          >
                            <Input placeholder="Contoh: 3x1 Bungkus" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantity']}
                            label="Jumlah Racikan"
                            className="mb-0"
                          >
                            <InputNumber<number> min={1} className="w-full" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantityUnit']}
                            label="Satuan Racikan"
                            className="mb-0"
                          >
                            <Input placeholder="Contoh: bungkus, botol" />
                          </Form.Item>
                        </div>

                        <div className="pl-4 border-l-2 border-orange-200">
                          <p className="text-xs text-gray-500 mb-2 font-semibold">KOMPOSISI:</p>
                          <Form.List name={[name, 'items']}>
                            {(subFields, subOpt) => (
                              <div className="space-y-2">
                                {subFields.map((subField) => (
                                  <div key={subField.key} className="flex gap-2 items-start">
                                    <Form.Item
                                      {...subField}
                                      name={[subField.name, 'sourceType']}
                                      className="mb-0 w-32"
                                      initialValue="medicine"
                                    >
                                      <Select
                                        options={[
                                          { label: 'Obat', value: 'medicine' },
                                          { label: 'Bahan Baku', value: 'substance' }
                                        ]}
                                      />
                                    </Form.Item>
                                    <Form.Item shouldUpdate noStyle>
                                      {() => {
                                        const compounds = form.getFieldValue('compounds') as FormData['compounds']
                                        const compound = Array.isArray(compounds) ? compounds[name] : undefined
                                        const items = compound?.items || []
                                        const currentItem = items[subField.name] || {}
                                        const sourceType = currentItem.sourceType || 'medicine'

                                        if (sourceType === 'substance') {
                                          return (
                                            <Form.Item
                                              {...subField}
                                              name={[subField.name, 'rawMaterialId']}
                                              className="mb-0 flex-1"
                                              rules={[{ required: true, message: 'Pilih bahan baku' }]}
                                            >
                                              <Select
                                                options={rawMaterialOptions}
                                                placeholder="Pilih Bahan Baku"
                                                showSearch
                                                optionFilterProp="label"
                                                loading={rawMaterialLoading}
                                              />
                                            </Form.Item>
                                          )
                                        }

                                        return (
                                          <Form.Item
                                            {...subField}
                                            name={[subField.name, 'medicationId']}
                                            className="mb-0 flex-1"
                                            rules={[{ required: true, message: 'Pilih obat' }]}
                                          >
                                            <Select
                                              options={medicineOptions}
                                              placeholder="Pilih Obat"
                                              showSearch
                                              optionFilterProp="label"
                                              loading={medicineLoading}
                                            />
                                          </Form.Item>
                                        )
                                      }}
                                    </Form.Item>
                                    <Form.Item
                                      {...subField}
                                      name={[subField.name, 'note']}
                                      className="mb-0 w-32"
                                    >
                                      <Input placeholder="Kekuatan (mg)" />
                                    </Form.Item>
                                    <Button
                                      type="text"
                                      danger
                                      icon={<MinusCircleOutlined />}
                                      onClick={() => subOpt.remove(subField.name)}
                                    />
                                  </div>
                                ))}
                                <Button
                                  type="dashed"
                                  size="small"
                                  onClick={() => subOpt.add()}
                                  icon={<PlusOutlined />}>
                                  Tambah Komposisi
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </div>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Tambah Racikan Baru
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 border-t pt-4">
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} className="px-6 bg-orange-600 hover:bg-orange-500 border-none">
              Simpan
            </Button>
            <Button onClick={() => navigate('/dashboard/medicine/medication-requests')} className="px-6">
              Batal
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default MedicationRequestForm
