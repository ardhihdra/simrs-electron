import {
  Button,
  Form,
  Input,
  Select,
  App as AntdApp
} from 'antd'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { useNavigate, useParams } from 'react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'
import {
  PatientAttributes,
  ItemAttributes,
  MedicationRequestStatus,
  MedicationRequestIntent,
  MedicationRequestPriority
} from 'simrs-types'
import { ItemPrescriptionForm } from '@renderer/components/organisms/Assessment/Prescription/ItemPrescriptionForm'
import { CompoundPrescriptionForm } from '@renderer/components/organisms/Assessment/Prescription/CompoundPrescriptionForm'
import { PatientSelectorWithService, PatientSelectorValue } from '@renderer/components/organisms/PatientSelectorWithService'
import { MedicationOtherItemsTable } from './components/MedicationOtherItemsTable'
import { MedicationCompoundsSection } from './components/MedicationCompoundsSection'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SignaCreateModal } from './components/SignaCreateModal'

import {
  FormData,
  ItemOption,
  EncounterOptionSource,
  EncounterListPayload
} from './types'
import { useMedicationRequestCreate } from './hooks/useMedicationRequestCreate'
import { useMedicationRequestUpdate } from './hooks/useMedicationRequestUpdate'

export function MedicationRequestForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm<FormData>()
  const [session, setSession] = useState<any>(null)
  const { message, modal } = AntdApp.useApp()

  const { id } = useParams()
  console.log('[MR][Form] Component render. id:', id, 'isEditMode:', !!id)
  const queryClient = useQueryClient()
  const [isSignaModalOpen, setIsSignaModalOpen] = useState(false)
  const isEditMode = !!id

  const handleSignaSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['mastersigna'] })
  }

  // Batch options per item row: key = `otherItem-{index}` or `compound-{compIdx}-ing-{ingIdx}`
  type BatchOption = {
    batchNumber: string;
    expiryDate: string | null;
    availableStock: number;
    firstReceivedDate?: string;
  }
  const [batchOptionsMap, setBatchOptionsMap] = useState<Map<string, BatchOption[]>>(new Map())
  const [batchLoadingMap, setBatchLoadingMap] = useState<Map<string, boolean>>(new Map())
  const [batchSortModeMap, setBatchSortModeMap] = useState<Map<string, boolean>>(new Map())

  const sortBatches = useCallback((batches: BatchOption[], rowKey: string): BatchOption[] => {
    const isFefo = batchSortModeMap.get(rowKey) ?? true // default FEFO

    return [...batches].sort((a, b) => {
      if (isFefo) {
        // FEFO: earliest expiry first
        if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate)
        if (a.expiryDate) return -1
        if (b.expiryDate) return 1
        // If neither has expiry, fallback to FIFO (received date)
        if (a.firstReceivedDate && b.firstReceivedDate) return a.firstReceivedDate.localeCompare(b.firstReceivedDate)
        return 0
      }
      // FIFO: oldest received date first
      if (a.firstReceivedDate && b.firstReceivedDate) return a.firstReceivedDate.localeCompare(b.firstReceivedDate)
      // Fallback to batch number if received date missing
      return a.batchNumber.localeCompare(b.batchNumber)
    })
  }, [batchSortModeMap])

  const fetchBatchesForItem = useCallback(async (kodeItem: string, rowKey: string) => {
    setBatchLoadingMap((prev) => new Map(prev).set(rowKey, true))
    try {
      const api = window.api?.query as {
        inventoryStock?: {
          listBatchesByLocation?: (args: { kodeItem: string; kodeLokasi: string }) => Promise<{ success: boolean; result?: BatchOption[] }>,
          listBatches?: (args: { kodeItem: string }) => Promise<{ success: boolean; result?: BatchOption[] }>
        }
      }
      const listBatchesByLocation = api?.inventoryStock?.listBatchesByLocation
      if (!listBatchesByLocation) {
        // fallback to listBatches if needed
      }
      const res = listBatchesByLocation
        ? await listBatchesByLocation({ kodeItem, kodeLokasi: 'FARM' })
        : await api?.inventoryStock?.listBatches?.({ kodeItem })
      if (res?.success && Array.isArray(res.result)) {
        setBatchOptionsMap((prev) => new Map(prev).set(rowKey, res.result as BatchOption[]))
        try {
          const preview = (res.result as BatchOption[]).slice(0, 5).map((b) => ({ batch: b.batchNumber, exp: b.expiryDate, available: b.availableStock }))
          console.log(`[MR][Batches][${kodeItem}@FARM] count:`, (res.result as BatchOption[]).length, 'preview:', preview)
        } catch { }
      }
    } catch (err) {
      console.error(`[MR] Fetch batches error for ${kodeItem} (row: ${rowKey})`, err)
    } finally {
      setBatchLoadingMap((prev) => new Map(prev).set(rowKey, false))
    }
  }, [])

  useEffect(() => {
    window.api.auth.getSession().then((res) => {
      if (res.success) setSession(res)
    })
  }, [])

  type ItemListResponse = {
    success: boolean
    result?: ItemAttributes[]
    message?: string
  }

  const itemApi = (window.api?.query as { item?: { list: () => Promise<ItemListResponse> } }).item

  const { data: itemSource, isLoading: itemLoading } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list', 'for-medication-request'],
    queryFn: () => {
      const fn = itemApi?.list
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn().then((res) => {
        try {
          const arr = Array.isArray(res?.result) ? res.result : []
          const preview = arr.slice(0, 5).map((i: any) => ({ id: i.id, kode: i.kode, nama: i.nama }))
          console.log('[MR][Items] total:', arr.length, 'preview:', preview)
        } catch { }
        return res
      })
    }
  })

  const { data: inventoryByLocation } = useQuery({
    queryKey: ['inventoryStock', 'by-location', 'FARM', 'for-medication-request'],
    queryFn: async () => {
      try {
        const api = window.api?.query as {
          inventoryStock?: {
            listByLocation: (args: { kodeLokasi: string; items?: number; depth?: number }) => Promise<{
              success: boolean
              result?: any[]
              message?: string
            }>
          }
        }
        const fn = api?.inventoryStock?.listByLocation
        if (!fn) throw new Error('API stok per lokasi tidak tersedia.')
        return await fn({ kodeLokasi: 'FARM', items: 1000, depth: 1 })
      } catch (err) {
        console.error('[MR][Stock] Query Error:', err)
        throw err
      }
    }
  })

  const farmStockMap = useMemo(() => {
    const arr = Array.isArray(inventoryByLocation?.result) ? inventoryByLocation!.result! : []
    const farm = arr.find((l) => l.kodeLokasi?.toUpperCase() === 'FARM')
    const items = farm?.items ?? []
    const map = new Map<string, number>()
    for (const it of items) {
      const kode = (it.kodeItem || '').trim().toUpperCase()
      if (kode && it.availableStock > 0) {
        map.set(kode, it.availableStock)
      }
    }
    return map
  }, [inventoryByLocation?.result])

  const { data: itemCategoryData } = useQuery({
    queryKey: ['itemCategory', 'list'],
    queryFn: () => {
      const fn = (window.api?.query as any)?.medicineCategory?.list
      if (!fn) return { success: false, result: [] }
      return fn()
    }
  })

  const itemCategoryMap = useMemo(() => {
    const categories = (itemCategoryData?.result || []) as any[]
    const map = new Map<number, string>()
    categories.forEach((c) => {
      if (typeof c.id === 'number' && typeof c.categoryType === 'string') {
        map.set(c.id, c.categoryType.toLowerCase())
      }
    })
    return map
  }, [itemCategoryData])

  // const { data: encounterData, isLoading: encounterLoading } = useQuery({
  //   queryKey: ['encounter', 'list', selectedPatientId],
  //   queryFn: async () => {
  //     const api = window.api?.query?.encounter?.list
  //     if (!api) throw new Error('API encounter tidak tersedia')
  //     const primary: {
  //       success?: boolean
  //       result?: EncounterOptionSource[]
  //       data?: EncounterOptionSource[]
  //       error?: string
  //     } = await api({
  //       limit: 100,
  //       patientId: selectedPatientId ? String(selectedPatientId) : undefined
  //     })
  //     const hasArray = Array.isArray(primary?.result) || Array.isArray(primary?.data)
  //     if (hasArray) return primary
  //     const rpc = window.rpc?.encounter?.list
  //     if (rpc) {
  //       const params: { depth?: number; status?: string; id?: string } = { depth: 1 }
  //       const fallback: {
  //         success?: boolean
  //         result?: EncounterOptionSource[]
  //         data?: EncounterOptionSource[]
  //         error?: string
  //       } = await rpc(params)
  //       return fallback
  //     }
  //     return primary
  //   },
  //   enabled: !!selectedPatientId || isEdit // Only fetch when patient is selected or in edit mode
  // })

  // Fallback: fetch encounters without patient filter, used only when filtered result is empty
  const { data: encounterAllData } = useQuery({
    queryKey: ['encounter', 'list', 'all'],
    queryFn: () => window.api?.query?.encounter?.list({ limit: 100 }),
    enabled: true
  })

  const { data: requesterData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => window.api?.query?.kepegawaian?.list()
  })

  // Dynamic Signa Options
  const { data: signaData, isLoading: signaLoading } = useQuery({
    queryKey: ['mastersigna', 'listAll'],
    queryFn: () => {
      const api = window.api?.query as any
      if (api?.mastersigna?.listAll) {
        return api.mastersigna.listAll()
      }
      return api?.mastersigna?.list({ limit: 500 })
    }
  })

  const signaOptions = useMemo(() => {
    const source = Array.isArray(signaData?.result) ? signaData!.result : []
    return source
      .filter((s: any) => s.isActive !== false)
      .map((s: any) => ({
        label: s.signaName,
        value: s.signaName
      }))
  }, [signaData])


  const itemOptions = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []

    const filteredByLocation = source.filter((item) => {
      const code = typeof item.kode === 'string' ? item.kode.trim().toUpperCase() : ''
      if (!code) return false
      return farmStockMap.has(code)
    })

    const opts = filteredByLocation
      .filter((item) => typeof item.id === 'number')
      .map((item) => {
        const it = item as any
        const unitCodeRaw = typeof it.kodeUnit === 'string' ? it.kodeUnit : it.unit?.kode
        const unitCode = unitCodeRaw ? unitCodeRaw.trim().toUpperCase() : ''
        const unitName = it.unit?.nama ?? unitCode
        const code = typeof it.kode === 'string' ? it.kode.trim().toUpperCase() : ''
        const name = it.nama ?? code
        const displayName = name || code || String(it.id)
        const label = unitName ? `${displayName} (${unitName})` : displayName
        const categoryId =
          typeof it.itemCategoryId === 'number'
            ? it.itemCategoryId
            : typeof it.category?.id === 'number'
              ? it.category.id
              : null

        let categoryType = ''
        if (categoryId && itemCategoryMap.has(categoryId)) {
          categoryType = itemCategoryMap.get(categoryId) || ''
        } else {
          const rawCategoryType =
            typeof it.category?.categoryType === 'string' ? it.category.categoryType : undefined
          categoryType = rawCategoryType ? rawCategoryType.trim().toLowerCase() : ''
        }

        return {
          value: it.id as number,
          label,
          unitCode,
          categoryId,
          categoryType,
          itemCategoryCode: it.itemCategoryCode,
          itemGroupCode: it.itemGroupCode,
          itemCategoryName: it.categoryRef?.display || null,
          itemGroupName: it.groupRef?.display || null,
          fpktl: it.fpktl,
          prb: it.prb,
          oen: it.oen,
          sediaanId: it.sediaanId,
          peresepanMaksimal: it.peresepanMaksimal,
          restriksi: it.restriksi,
          kekuatan: it.kekuatan,
          satuanId: it.satuanId
        }
      })

    return opts
  }, [itemSource?.result, itemCategoryMap, farmStockMap, inventoryByLocation?.result])

  const extractEncounters = (src: EncounterListPayload): EncounterOptionSource[] => {
    const a = src?.result
    const b = src?.data
    return Array.isArray(a) ? a : Array.isArray(b) ? b! : []
  }
  // const encounterOptions = useMemo(() => {
  //   const filtered = extractEncounters(encounterData)
  //   const all = extractEncounters(encounterAllData)
  //   const base = filtered.length > 0 ? filtered : all
  //   const toDateText = (e: EncounterOptionSource): string | undefined => {
  //     const raw = e.startTime || e.period?.start || e.visitDate || e.updatedAt || e.createdAt
  //     if (!raw) return undefined
  //     const dt =
  //       raw instanceof Date ? raw : typeof raw === 'string' ? new Date(raw) : new Date(String(raw))
  //     if (Number.isNaN(dt.getTime())) return undefined
  //     return dt.toLocaleString('id-ID', {
  //       day: '2-digit',
  //       month: 'short',
  //       year: 'numeric',
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     })
  //   }
  //   const options = base
  //     .filter((e) => {
  //       if (!selectedPatientId || filtered.length > 0) return true
  //       // When using fallback (all), ensure we only show encounters of selected patient if patient info is present
  //       // Some endpoints may not embed patient object; in that case, show all to let user pick manually.
  //       const pid = e.patient?.id
  //       return pid ? String(pid) === String(selectedPatientId) : true
  //     })
  //     .map((e) => ({
  //       label: toDateText(e) || e.encounterCode || e.id,
  //       value: e.id
  //     }))
  //   return options
  // }, [encounterData, encounterAllData, selectedPatientId])

  const itemKodeMap = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, string>()
    source.forEach((item) => {
      if (typeof item.id === 'number' && typeof item.kode === 'string') {
        map.set(item.id, item.kode.trim().toUpperCase())
      }
    })
    return map
  }, [itemSource?.result])

  // Auto-fill Requester from Session (match NIK)
  useEffect(() => {
    if (session?.user && requesterData?.result) {
      const employees = requesterData.result as { id: number; nik?: string; namaLengkap?: string }[]
      const sessionId = Number(session.user.id)
      const sessionUsername = String(session.user.username || '').trim()
      const byId = Number.isFinite(sessionId) ? employees.find(e => e.id === sessionId) : undefined
      const byNik = employees.find(e => typeof e.nik === 'string' && e.nik.trim() === sessionUsername)
      const byName = employees.find(e => typeof e.namaLengkap === 'string' && e.namaLengkap.trim() === sessionUsername)
      const foundEmployee = byId || byNik || byName
      if (foundEmployee) {
        form.setFieldValue('resepturId', foundEmployee.id)
      }
    }
  }, [session, requesterData, form])

  // Fetch Medication Request data for Edit Mode
  const { data: existingData, isLoading: isFetchingData } = useQuery<any>({
    queryKey: ['medicationRequest', id],
    queryFn: async () => {
      if (!id) return null
      const fn = (window.api?.query as any)?.medicationRequest?.getById
      if (!fn) throw new Error('API MedicationRequest.getById tidak tersedia.')
      
      const res = await fn({ id: Number(id) })
      
      if (!res.success) {
        throw new Error(res.message || 'Gagal mengambil data permintaan obat.')
      }

      // The RPC returns { success: true, data: { result: ... } }
      return res.data?.result || res.data || res.result
    },
    enabled: isEditMode
  })

  const { onFinish: onCreate, createLoading } = useMedicationRequestCreate(itemOptions, itemSource)
  const { onFinish: onUpdate, updateLoading } = useMedicationRequestUpdate(id || '', itemOptions, itemSource)

  const onFinish = (values: FormData) => {
    if (isEditMode) {
      onUpdate(values)
    } else {
      onCreate(values)
    }
  }

  // Mapping logic: FHIR-like data -> Form UI
  useEffect(() => {
    try {
        if (existingData && isEditMode) {
        const data = existingData as any
        
        const mappedData: Partial<FormData> = {
            status: data.status,
            intent: data.intent,
            priority: data.priority,
            patientId: data.patientId,
            encounterId: data.encounterId,
            requesterId: data.requesterId,
            resepturId: data.recorderId,
            roomId: data.roomId,
        }

        // Check if it's a compound (Racikan)
        const categories = Array.isArray(data.category) ? data.category : []
        const hasCompoundCategory = categories.some((c: any) => c.code === 'compound' || c.text?.toLowerCase() === 'racikan')
        const hasIngredients = Array.isArray(data.supportingInformation) && 
                              data.supportingInformation.some((info: any) => (info.resourceType || info.resource_type) === 'Ingredient')
        
        const isCompound = hasCompoundCategory || hasIngredients
        
        const dosageArr = Array.isArray(data.dosageInstruction) ? data.dosageInstruction : []
        const instructionText = dosageArr.length > 0 ? dosageArr[0].text : ''
        
        const quantityValue = data.dispenseRequest?.quantity?.status === 'entered-in-error' 
            ? undefined 
            : data.dispenseRequest?.quantity?.value
        const quantityUnit = data.dispenseRequest?.quantity?.unit

        if (isCompound) {
            const ingredients = (Array.isArray(data.supportingInformation) ? data.supportingInformation : [])
              .filter((info: any) => (info.resourceType || info.resource_type) === 'Ingredient')

            mappedData.compounds = [{
              name: data.note?.replace('[Racikan: ', '').replace(']', '') || 'Racikan',
              dosageInstruction: instructionText,
              quantity: quantityValue,
              quantityUnit: quantityUnit,
              items: ingredients.map((ing: any) => ({
                  medicationId: ing.medicationId,
                  itemId: ing.itemId,
                  name: ing.name,
                  quantity: ing.quantity,
                  note: ing.note,
                  unit: ing.unitCode,
                  dosisDiminta: ing.requestedDosage || ing.requested_dosage,
                  _manualKekuatan: ing.strength
              }))
            }]
            mappedData.items = []
            mappedData.otherItems = []
        } else {
            const isMedication = !!data.medicationId
            
            if (isMedication) {
                mappedData.items = [{
                  medicationId: data.medicationId,
                  dosageInstruction: instructionText,
                  quantity: quantityValue,
                  quantityUnit: quantityUnit,
                  note: data.note
                }]
                mappedData.otherItems = []
            } else {
                mappedData.otherItems = [{
                  itemId: data.itemId,
                  quantity: quantityValue,
                  instruction: instructionText,
                  note: data.note
                }]
                mappedData.items = []
            }
            mappedData.compounds = []
        }

        form.setFieldsValue(mappedData as FormData)
        }
    } catch (err) {
        console.error('MedicationRequest mapping error:', err)
    }
  }, [existingData, isEditMode, form])

  useEffect(() => {
    if (!isEditMode) {
        form.setFieldsValue({
        status: MedicationRequestStatus.ACTIVE,
        intent: MedicationRequestIntent.ORDER,
        priority: MedicationRequestPriority.ROUTINE,
        authoredOn: dayjs(),
        items: []
        })
    }
  }, [form, isEditMode])

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6  pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? 'Edit Permintaan Obat' : 'Permintaan Obat Baru'}
          </h2>
          <Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>Kembali</Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
            {/* Header Fields (Patient & Context) */}
            <div className="md:col-span-2 bg-gray-50  p-0 mb-4">
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.patientId !== curr.patientId || prev.encounterId !== curr.encounterId}
              >
                {({ getFieldValue, setFieldsValue }) => (
                  <PatientSelectorWithService
                    initialValue={getFieldValue('encounterId')}
                    onSelect={(val: PatientSelectorValue | null) => {
                      if (val) {
                        setFieldsValue({
                          patientId: val.patientId,
                          encounterId: val.encounterId,
                          manualPatientName: val.patientName,
                          manualMedicalRecordNumber: val.medicalRecordNumber
                        })
                      } else {
                        setFieldsValue({
                          patientId: undefined,
                          encounterId: undefined,
                          manualPatientName: undefined,
                          manualMedicalRecordNumber: undefined
                        })
                      }
                    }}
                  />
                )}
              </Form.Item>
              {/* Hidden fields to keep Form compatibility */}
              <Form.Item name="patientId" hidden><Input /></Form.Item>
              <Form.Item name="encounterId" hidden><Input /></Form.Item>
              <Form.Item name="manualPatientName" hidden><Input /></Form.Item>
              <Form.Item name="manualMedicalRecordNumber" hidden><Input /></Form.Item>
            </div>

            <div className="space-y-2">
              <Form.Item label="Lokasi/Ruangan (Opsional)" name="roomId" tooltip="Diisi apabila pasien rawat inap untuk menentukan dimana obat akan di drop/diletakkan">
                <SelectAsync
                  entity="room"
                  display="roomCodeId"
                  output="id"
                  placeHolder="Pilih Lokasi Ruangan (jika ada)"
                />
              </Form.Item>

              {/* Requester is now handled automatically by backend */}
            </div>

            <div className="space-y-2">
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select
                  options={Object.values(MedicationRequestStatus).map((v) => ({
                    label: v,
                    value: v
                  }))}
                />
              </Form.Item>

              <Form.Item label="Tujuan (Intent)" name="intent" rules={[{ required: true }]}>
                <Select
                  options={Object.values(MedicationRequestIntent).map((v) => ({
                    label: v,
                    value: v
                  }))}
                />
              </Form.Item>

              <Form.Item label="Prioritas" name="priority">
                <Select
                  options={Object.values(MedicationRequestPriority).map((v) => ({
                    label: v,
                    value: v
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="Dokter"
                name="requesterId"
              >
                <SelectAsync
                  display="namaLengkap"
                  entity="kepegawaian"
                  output="id"
                  filters={{ hakAksesId: 'doctor' }}
                />
              </Form.Item>

              <Form.Item
                label="Reseptur"
                name="resepturId"
              >
                <SelectAsync
                  display="namaLengkap"
                  entity="kepegawaian"
                  output="id"
                  placeHolder="Pilih Reseptur (Mengikuti pengguna login jika kosong)"
                />
              </Form.Item>
            </div>
          </div>

          <MedicationOtherItemsTable
            form={form}
            itemKodeMap={itemKodeMap}
            itemOptions={itemOptions}
            itemLoading={itemLoading}
            signaOptions={signaOptions}
            signaLoading={signaLoading}
            onAddSigna={() => setIsSignaModalOpen(true)}
          />

          {/*    <ItemPrescriptionForm
               name="otherItems"
               title="Obat dan Barang"
               itemOptions={itemOptions}
               loading={itemLoading}
             />

             <CompoundPrescriptionForm
               name="compounds"
               title="Daftar Obat Racikan"
               itemOptions={itemOptions}
               loading={itemLoading}
             />
           </div> */}
          <MedicationCompoundsSection
            form={form}
            itemKodeMap={itemKodeMap}
            itemOptions={itemOptions}
            itemLoading={itemLoading}
            signaOptions={signaOptions}
            signaLoading={signaLoading}
            onAddSigna={() => setIsSignaModalOpen(true)}
          />

          <div className="flex gap-3 justify-end mt-6 border-t pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={createLoading || updateLoading || isFetchingData}
              className="px-6 bg-orange-600 hover:bg-orange-500 border-none"
            >
              Simpan
            </Button>
            <Button
              onClick={() => navigate('/dashboard/medicine/medication-requests')}
              className="px-6"
            >
              Batal
            </Button>
          </div>
        </Form>
      </div>

      <SignaCreateModal
        open={isSignaModalOpen}
        onCancel={() => setIsSignaModalOpen(false)}
        onSuccess={handleSignaSuccess}
      />
    </div>
  )
}

export default MedicationRequestForm
