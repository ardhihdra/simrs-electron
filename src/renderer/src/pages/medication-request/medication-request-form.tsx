import { Button, Form, Input, Select, App as AntdApp } from 'antd'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { useNavigate, useParams } from 'react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  ItemAttributes,
  MedicationRequestStatus,
  MedicationRequestIntent,
  MedicationRequestPriority
} from 'simrs-types'
import { MedicationOtherItemsTable } from './components/MedicationOtherItemsTable'
import { MedicationCompoundsSection } from './components/MedicationCompoundsSection'
import {
  PatientSelectorWithService,
  PatientSelectorValue
} from '@renderer/components/organisms/PatientSelectorWithService'
import { SignaCreateModal } from './components/SignaCreateModal'

import { FormData, EncounterOptionSource, EncounterListPayload } from './types'
import { useMedicationRequestCreate } from './hooks/useMedicationRequestCreate'
import { useMedicationRequestUpdate } from './hooks/useMedicationRequestUpdate'

export function MedicationRequestForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm<FormData>()
  const [session, setSession] = useState<any>(null)
  const { message, modal } = AntdApp.useApp()

  const { id } = useParams()
  const queryClient = useQueryClient()
  const [isSignaModalOpen, setIsSignaModalOpen] = useState(false)
  const isEditMode = !!id

  const handleSignaSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['mastersigna'] })
  }

  // Batch options per item row
  type BatchOption = {
    batchNumber: string
    expiryDate: string | null
    availableStock: number
    firstReceivedDate?: string
  }
  const [batchOptionsMap, setBatchOptionsMap] = useState<Map<string, BatchOption[]>>(new Map())
  const [batchLoadingMap, setBatchLoadingMap] = useState<Map<string, boolean>>(new Map())
  const [batchSortModeMap, setBatchSortModeMap] = useState<Map<string, boolean>>(new Map())

  const sortBatches = useCallback(
    (batches: BatchOption[], rowKey: string): BatchOption[] => {
      const isFefo = batchSortModeMap.get(rowKey) ?? true
      return [...batches].sort((a, b) => {
        if (isFefo) {
          if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate)
          if (a.expiryDate) return -1
          if (b.expiryDate) return 1
          if (a.firstReceivedDate && b.firstReceivedDate)
            return a.firstReceivedDate.localeCompare(b.firstReceivedDate)
          return 0
        }
        if (a.firstReceivedDate && b.firstReceivedDate)
          return a.firstReceivedDate.localeCompare(b.firstReceivedDate)
        return a.batchNumber.localeCompare(b.batchNumber)
      })
    },
    [batchSortModeMap]
  )

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

  const { data: itemSource, isLoading: itemLoading } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list', 'for-medication-request'],
    queryFn: () => {
      const api = (window.api?.query as any).item
      if (!api?.list) throw new Error('API item tidak tersedia.')
      return api.list().then((res: any) => res)
    }
  })

  const { data: inventoryByLocation } = useQuery({
    queryKey: ['inventoryStock', 'by-location', 'FARM', 'for-medication-request'],
    queryFn: async () => {
      const api = (window.api?.query as any).inventoryStock
      if (!api?.listByLocation) throw new Error('API stok per lokasi tidak tersedia.')
      return await api.listByLocation({ kodeLokasi: 'FARM', items: 1000, depth: 1 })
    }
  })

  const farmStockMap = useMemo(() => {
    const arr = Array.isArray(inventoryByLocation?.result) ? inventoryByLocation!.result! : []
    const farm = arr.find((l: any) => l.kodeLokasi?.toUpperCase() === 'FARM')
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

  const { data: requesterData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => (window.api?.query as any).kepegawaian?.list()
  })

  const { data: signaData, isLoading: signaLoading } = useQuery({
    queryKey: ['mastersigna', 'listAll'],
    queryFn: () => {
      const api = window.api?.query as any
      if (api?.mastersigna?.listAll) return api.mastersigna.listAll()
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
    return source
      .filter((item) => {
        const code = typeof item.kode === 'string' ? item.kode.trim().toUpperCase() : ''
        return code && farmStockMap.has(code)
      })
      .map((item: any) => {
        const unitCodeRaw = typeof item.kodeUnit === 'string' ? item.kodeUnit : item.unit?.kode
        const unitCode = unitCodeRaw ? unitCodeRaw.trim().toUpperCase() : ''
        const unitName = item.unit?.nama ?? unitCode
        const name = item.nama ?? item.kode ?? String(item.id)
        const label = unitName ? `${name} (${unitName})` : name

        const categoryId =
          typeof item.itemCategoryId === 'number' ? item.itemCategoryId : item.category?.id || null
        let categoryType = ''
        if (categoryId && itemCategoryMap.has(categoryId)) {
          categoryType = itemCategoryMap.get(categoryId) || ''
        } else {
          categoryType = (item.category?.categoryType || '').trim().toLowerCase()
        }

        return {
          value: item.id as number,
          label,
          unitCode,
          categoryId,
          categoryType,
          kekuatan: item.kekuatan
        }
      })
  }, [itemSource?.result, itemCategoryMap, farmStockMap])

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

  useEffect(() => {
    if (session?.user && requesterData?.result) {
      const employees = requesterData.result as any[]
      const sessionId = Number(session.user.id)
      const sessionUsername = String(session.user.username || '').trim()
      const foundEmployee = employees.find(
        (e) =>
          e.id === sessionId ||
          (typeof e.nik === 'string' && e.nik.trim() === sessionUsername) ||
          (typeof e.namaLengkap === 'string' && e.namaLengkap.trim() === sessionUsername)
      )
      if (foundEmployee) form.setFieldValue('resepturId', foundEmployee.id)
    }
  }, [session, requesterData, form])

  // Fetch Medication Request data (and its group siblings)
  const { data: existingData, isLoading: isFetchingData } = useQuery<any[]>({
    queryKey: ['medicationRequest', id, 'group'],
    queryFn: async () => {
      if (!id) return null
      const api = (window.api?.query as any).medicationRequest
      const res = await api.getById({ id: Number(id) })
      if (!res.success) throw new Error(res.message || 'Gagal mengambil data.')

      const mainRecord = res.data?.result || res.data || res.result
      const groupId = mainRecord?.groupIdentifier?.value

      if (groupId) {
        const groupRes = await api.list({ limit: 100, groupIdentifier: groupId })
        if (groupRes.success && Array.isArray(groupRes.data)) {
          return groupRes.data
        }
        return [mainRecord]
      }
      return [mainRecord]
    },
    enabled: isEditMode
  })

  const { onFinish: onCreate, createLoading } = useMedicationRequestCreate(itemOptions, itemSource)
  const { onFinish: onUpdate, updateLoading } = useMedicationRequestUpdate(
    id || '',
    itemOptions,
    itemSource
  )

  const onFinish = (values: FormData) => {
    if (isEditMode) onUpdate(values)
    else onCreate(values)
  }

  // Mapping logic: FHIR-like data -> Form UI (Multiple Items Support)
  useEffect(() => {
    if (existingData && Array.isArray(existingData) && isEditMode) {
      const main = existingData[0]
      const mappedData: Partial<FormData> = {
        status: main.status,
        intent: main.intent,
        priority: main.priority,
        patientId: main.patientId,
        encounterId: main.encounterId,
        requesterId: main.requesterId,
        resepturId: main.recorderId,
        roomId: main.roomId,
        items: [],
        compounds: [],
        otherItems: []
      }

      existingData.forEach((data: any) => {
        const categories = Array.isArray(data.category) ? data.category : []
        const isCompound = categories.some(
          (c: any) => c.code === 'compound' || c.text?.toLowerCase() === 'racikan'
        )
        const dosageArr = Array.isArray(data.dosageInstruction) ? data.dosageInstruction : []
        const instructionText = dosageArr.length > 0 ? dosageArr[0].text : ''
        const quantityValue = data.dispenseRequest?.quantity?.value
        const quantityUnit = data.dispenseRequest?.quantity?.unit

        if (isCompound) {
          const ingredients = (
            Array.isArray(data.supportingInformation) ? data.supportingInformation : []
          ).filter((info: any) => (info.resourceType || info.resource_type) === 'Ingredient')
          mappedData.compounds?.push({
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
          })
        } else if (data.medicationId) {
          mappedData.items?.push({
            medicationId: data.medicationId,
            dosageInstruction: instructionText,
            quantity: quantityValue,
            quantityUnit: quantityUnit,
            note: data.note
          })
        } else if (data.itemId) {
          mappedData.otherItems?.push({
            itemId: data.itemId,
            quantity: quantityValue,
            instruction: instructionText,
            note: data.note
          })
        }
      })

      form.setFieldsValue(mappedData as FormData)
    }
  }, [existingData, isEditMode, form])

  useEffect(() => {
    if (!isEditMode) {
      form.setFieldsValue({
        status: MedicationRequestStatus.ACTIVE,
        intent: MedicationRequestIntent.ORDER,
        priority: MedicationRequestPriority.ROUTINE,
        authoredOn: dayjs(),
        items: [],
        compounds: [],
        otherItems: []
      })
    }
  }, [form, isEditMode])

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6 pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? 'Edit Permintaan Obat' : 'Permintaan Obat Baru'}
          </h2>
          <Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>
            Kembali
          </Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
            <div className="md:col-span-2 bg-gray-50 p-0 mb-4">
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) =>
                  prev.patientId !== curr.patientId || prev.encounterId !== curr.encounterId
                }
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
                        setFieldsValue({ patientId: undefined, encounterId: undefined })
                      }
                    }}
                  />
                )}
              </Form.Item>
              <Form.Item name="patientId" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="encounterId" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="manualPatientName" hidden>
                <Input />
              </Form.Item>
              <Form.Item name="manualMedicalRecordNumber" hidden>
                <Input />
              </Form.Item>
            </div>

            <div className="space-y-2">
              <Form.Item label="Lokasi/Ruangan" name="roomId">
                <SelectAsync
                  entity="room"
                  display="roomCodeId"
                  output="id"
                  placeHolder="Pilih Lokasi"
                />
              </Form.Item>
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select
                  options={Object.values(MedicationRequestStatus).map((v) => ({
                    label: v,
                    value: v
                  }))}
                />
              </Form.Item>
              <Form.Item label="Tujuan" name="intent" rules={[{ required: true }]}>
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
            </div>

            <div className="space-y-2">
              <Form.Item label="Dokter" name="requesterId">
                <SelectAsync
                  display="namaLengkap"
                  entity="kepegawaian"
                  output="id"
                  filters={{ hakAksesId: 'doctor' }}
                />
              </Form.Item>
              <Form.Item label="Reseptur" name="resepturId">
                <SelectAsync display="namaLengkap" entity="kepegawaian" output="id" />
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
              className="px-6 bg-orange-600 border-none"
            >
              Simpan
            </Button>
            <Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>
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
