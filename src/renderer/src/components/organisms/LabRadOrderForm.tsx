import GenericTable from '@renderer/components/organisms/GenericTable'
import CreateServiceRequestForm from '@renderer/components/organisms/laboratory-management/CreateServiceRequestForm'
import { useMyProfile } from '@renderer/hooks/useProfile'
import { queryClient } from '@renderer/query-client'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client } from '@renderer/utils/client'
import { useQuery } from '@tanstack/react-query'
import { Alert, App, Button, Form, Input, Radio, Select, Spin, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import {
  useCreateServiceRequest,
  useServiceRequestByEncounter
} from '../../hooks/query/use-service-request'
import { PatientWithMedicalRecord } from '../../types/doctor.types'

interface LabRadOrderFormProps {
  encounterId: string
  patientData: PatientWithMedicalRecord
}

type OrderMode = 'direct' | 'internal-referral'

interface ServiceRequestRow {
  id?: number
  identifier?: string
  categories?: { code?: string; display?: string }[]
  codes?: { code?: string; display?: string }[]
  priority?: string
  status?: string
  patientInstruction?: string
  createdAt?: string
  encounterId?: string
}

interface SelectedServiceRequestCodeValue {
  masterServiceRequestCodeId: number
  code: string
  display: string
  system?: string
}

interface KepegawaianItem {
  id: string | number
  namaLengkap?: string
  nik?: string
  hakAksesId?: string
  hakAkses?: {
    kode?: string
    nama?: string
  }
}

interface EncounterListItem {
  id?: string
  partOfId?: string | null
  category?: string
  poliCodeId?: string | number | null
  queueTicket?: {
    poliCodeId?: string | number | null
  }
}

interface LokasiKerjaItem {
  id: string | number
  nama?: string
  kode?: string
}

interface PoliItem {
  id?: string | number
  name?: string
  nama?: string
}

function normalizeList<T>(data: unknown): T[] {
  const raw = data as { result?: T[]; data?: T[] } | T[]
  return (
    (raw as { result?: T[]; data?: T[] })?.result ??
    (raw as { data?: T[] })?.data ??
    (raw as T[]) ??
    []
  )
}

function isDoctorPegawai(pegawai: KepegawaianItem): boolean {
  const kode = String(pegawai.hakAkses?.kode || '').toLowerCase()
  const nama = String(pegawai.hakAkses?.nama || '').toLowerCase()
  const hakAksesId = String(pegawai.hakAksesId || '').toLowerCase()

  return (
    kode.includes('doctor') ||
    nama.includes('doctor') ||
    nama.includes('dokter') ||
    hakAksesId.includes('doctor') ||
    hakAksesId.includes('dokter')
  )
}

const columns: ColumnsType<ServiceRequestRow> = [
  // {
  //   title: 'Encounter',
  //   key: 'encounterId',
  //   render: (_, record) => {
  //     const encounter = String(record.encounterId || '-')
  //     return <Tag>{encounter}</Tag>
  //   }
  // },
  {
    title: 'Kategori',
    key: 'category',
    render: (_, record) => {
      const code = String(record.categories?.[0]?.code || '')
      const normalized = code.toUpperCase()
      const isLaboratory = normalized === 'LABORATORY' || normalized === 'LAB'
      return <Tag color={isLaboratory ? 'blue' : 'green'}>{code || '-'}</Tag>
    }
  },
  {
    title: 'Nama Pemeriksaan',
    key: 'display',
    render: (_, record) => record.codes?.[0]?.display ?? '-'
  },
  {
    title: 'Kode',
    key: 'code',
    render: (_, record) => record.codes?.[0]?.code ?? '-'
  },
  {
    title: 'Prioritas',
    key: 'priority',
    render: (_, record) => {
      const priority = record.priority
      const normalized = String(priority || '').toLowerCase()
      const colors: Record<string, string> = {
        routine: 'default',
        urgent: 'orange',
        asap: 'red',
        stat: 'red'
      }
      return <Tag color={colors[normalized] ?? 'default'}>{priority?.toUpperCase() ?? '-'}</Tag>
    }
  },
  {
    title: 'Status',
    key: 'status',
    render: (_, record) => {
      const status = record.status
      const colors: Record<string, string> = {
        active: 'processing',
        completed: 'success',
        'on-hold': 'warning',
        cancelled: 'error'
      }
      return <Tag color={colors[status ?? ''] ?? 'default'}>{status ?? '-'}</Tag>
    }
  },
  {
    title: 'Instruksi Pasien',
    dataIndex: 'patientInstruction',
    key: 'patientInstruction',
    render: (val?: string) => val ?? '-'
  },
  {
    title: 'Waktu Order',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (val?: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')
  }
]

export const LabRadOrderForm = ({ encounterId, patientData }: LabRadOrderFormProps) => {
  const [form] = Form.useForm()
  const [showForm, setShowForm] = useState(false)
  const [doctorSearch, setDoctorSearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const { profile } = useMyProfile()
  const { message } = App.useApp()
  const session = useModuleScopeStore((state) => state.session)

  const { data: serviceRequestData, isLoading, isError } = useServiceRequestByEncounter(encounterId, true)
  const selectedCategory = Form.useWatch('category', form) as
    | 'laboratory'
    | 'radiology'
    | undefined
  const orderMode = Form.useWatch('orderMode', form) as OrderMode | undefined

  const {
    data: encounterListData,
    isLoading: isLoadingEncounterList,
    isError: isErrorEncounterList
  } = client.query.entity.useQuery(
    {
      model: 'encounter',
      method: 'get',
      params: {
        patientId: patientData.patient.id,
        items: '200',
        sortBy: 'updatedAt',
        sortOrder: 'DESC'
      }
    },
    {
      queryKey: ['lab-rad-order-child-encounters', encounterId, patientData.patient.id]
    } as any
  )

  const childEncounterIds = useMemo(() => {
    const encounters = normalizeList<EncounterListItem>(encounterListData) ?? []
    return Array.from(
      new Set(
        encounters
          .filter((encounter) => String(encounter.partOfId || '') === String(encounterId))
          .map((encounter) => String(encounter.id || ''))
          .filter((id) => id && id !== String(encounterId))
      )
    )
  }, [encounterListData, encounterId])

  const parentPoliCodeId = useMemo(() => {
    const encounters = normalizeList<EncounterListItem>(encounterListData)
    const parentEncounter = encounters.find(
      (encounter) => String(encounter.id || '') === String(encounterId)
    )
    const directPoliCodeId = Number(parentEncounter?.poliCodeId)
    const queueTicketPoliCodeId = Number(parentEncounter?.queueTicket?.poliCodeId)

    if (Number.isInteger(directPoliCodeId) && directPoliCodeId > 0) {
      return directPoliCodeId
    }

    if (Number.isInteger(queueTicketPoliCodeId) && queueTicketPoliCodeId > 0) {
      return queueTicketPoliCodeId
    }

    return null
  }, [encounterListData, encounterId])

  const { data: sourcePoli } = useQuery({
    queryKey: ['poli', 'by-id', parentPoliCodeId],
    queryFn: async () => {
      const api = (window.api?.query as any)?.poli
      if (!api?.read || !parentPoliCodeId) return null

      const response = await api.read({ id: parentPoliCodeId })
      const record =
        response?.result ??
        response?.data?.result ??
        response?.data?.data ??
        response?.data ??
        null

      return record as PoliItem | null
    },
    enabled: Boolean(parentPoliCodeId)
  })

  const sourcePoliName = useMemo(() => {
    const name = String(sourcePoli?.name || sourcePoli?.nama || '').trim()
    if (name) return name
    return parentPoliCodeId ? `Poli #${parentPoliCodeId}` : undefined
  }, [sourcePoli, parentPoliCodeId])

  const sourceLocationId = useMemo(() => {
    const id = Number(session?.lokasiKerjaId)
    return Number.isInteger(id) && id > 0 ? id : null
  }, [session?.lokasiKerjaId])

  // const {
  //   data: childEncounterServiceRequests,
  //   isLoading: isLoadingChildServiceRequests,
  //   isError: isErrorChildServiceRequests
  // } = useQuery({
  //   queryKey: ['service-request', 'by-child-encounters', childEncounterIds],
  //   enabled: childEncounterIds.length > 0,
  //   queryFn: async () => {
  //     const fn = window.api?.query?.serviceRequest?.getByEncounter
  //     if (!fn) throw new Error('API serviceRequest tidak tersedia')

  //     const allResults = await Promise.all(
  //       childEncounterIds.map(async (childEncounterId) => {
  //         const response = await fn({ encounterId: childEncounterId })
  //         const result = Array.isArray(response?.result) ? response.result : []
  //         return result.map((item: ServiceRequestRow) => ({
  //           ...item,
  //           encounterId: childEncounterId
  //         }))
  //       })
  //     )

  //     return allResults.flat()
  //   }
  // })

  const activePractitionerId = Number(profile?.id ?? patientData.doctor?.id ?? NaN)
  const activePractitionerName = patientData.doctor?.name || profile?.username || 'Dokter Pengirim'

  const { createServiceRequest, isSubmitting } = useCreateServiceRequest({
    encounterId,
    patientId: patientData.patient.id,
    practitionerId: Number.isFinite(activePractitionerId) ? activePractitionerId : 1
  })
  const createInternalAncillaryOrder =
    client.registration.createInternalAncillaryOrder.useMutation()

  const doctorParams = useMemo(() => {
    const params: Record<string, string> = {
      page: '1',
      items: '200',
      include: 'hakAkses'
    }

    if (doctorSearch.trim()) {
      params.q = doctorSearch.trim()
      params.fields = 'namaLengkap,nik'
    }

    return params
  }, [doctorSearch])

  const { data: doctorsData, isLoading: isLoadingDoctors } = client.query.entity.useQuery(
    {
      model: 'kepegawaian',
      method: 'get',
      params: doctorParams
    },
    {
      enabled: showForm && orderMode === 'internal-referral',
      queryKey: ['lab-rad-order-internal-doctors', doctorParams]
    } as any
  )

  const locationParams = useMemo(() => {
    const params: Record<string, string> = {
      page: '1',
      items: '100'
    }

    if (locationSearch.trim()) {
      params.q = locationSearch.trim()
      params.fields = 'nama,kode'
    }

    return params
  }, [locationSearch])

  const { data: locationsData, isLoading: isLoadingLocations } = client.query.entity.useQuery(
    {
      model: 'lokasikerja',
      method: 'get',
      params: locationParams
    },
    {
      enabled: showForm && orderMode === 'internal-referral',
      queryKey: ['lab-rad-order-internal-locations', locationParams]
    } as any
  )

  const doctorOptions = useMemo(() => {
    const doctors = normalizeList<KepegawaianItem>(doctorsData)
    return doctors
      .filter((doctor) => isDoctorPegawai(doctor))
      .map((doctor) => ({
        value: String(doctor.id),
        label: `${doctor.namaLengkap || 'Dokter'}${doctor.nik ? ` (${doctor.nik})` : ''}`
      }))
  }, [doctorsData])

  const locationOptions = useMemo(() => {
    const locations = normalizeList<LokasiKerjaItem>(locationsData)
    return locations
      .map((location) => {
        const numericId = Number(location.id)
        if (!Number.isFinite(numericId) || numericId <= 0) return null

        const name = String(location.nama || 'Lokasi Kerja').trim()
        const code = String(location.kode || '').trim()

        return {
          value: numericId,
          label: code ? `${name} (${code})` : name
        }
      })
      .filter((item): item is { value: number; label: string } => item !== null)
  }, [locationsData])

  const existingOrders = useMemo(() => {
    const parentOrders = Array.isArray(serviceRequestData?.result)
      ? serviceRequestData.result.map((item: ServiceRequestRow) => ({
          ...item,
          encounterId
        }))
      : []
    // const childOrders = Array.isArray(childEncounterServiceRequests)
    //   ? childEncounterServiceRequests
    //   : []
    const merged = parentOrders
    // const merged = [...parentOrders, ...childOrders]

    return merged.sort((a, b) => {
      const left = dayjs(a.createdAt).valueOf()
      const right = dayjs(b.createdAt).valueOf()
      const leftSafe = Number.isFinite(left) ? left : 0
      const rightSafe = Number.isFinite(right) ? right : 0
      return rightSafe - leftSafe
    })
  }, [serviceRequestData?.result, encounterId])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (values.orderMode === 'internal-referral') {
        if (!Number.isFinite(activePractitionerId)) {
          throw new Error('Profil dokter pengirim tidak ditemukan. Silakan login ulang.')
        }

        const targetDoctorId = Number(values.targetPractitionerId)
        if (!Number.isFinite(targetDoctorId)) {
          throw new Error('Dokter tujuan rujukan internal belum dipilih')
        }

        const selectedServiceRequestCodes = Array.isArray(values.selectedServiceRequestCodes)
          ? (values.selectedServiceRequestCodes as SelectedServiceRequestCodeValue[])
          : []

        if (!parentPoliCodeId) {
          throw new Error(
            'poliCodeId encounter asal rujukan tidak ditemukan. Rujukan internal tidak dapat dibuat.'
          )
        }

        if (!sourceLocationId) {
          throw new Error(
            'Lokasi kerja asal tidak ditemukan. Pilih modul/lokasi kerja aktif terlebih dahulu sebelum membuat rujukan internal.'
          )
        }

        const targetDoctor = doctorOptions.find(
          (doctor) => String(doctor.value) === String(values.targetPractitionerId)
        )
        const targetLocationId = Number(values.targetLocationId)
        if (!Number.isFinite(targetLocationId) || targetLocationId <= 0) {
          throw new Error('Lokasi tujuan rujukan internal belum dipilih')
        }

        const targetLocation = locationOptions.find(
          (location) => Number(location.value) === targetLocationId
        )

        const result = await createInternalAncillaryOrder.mutateAsync({
          parentEncounterId: encounterId,
          parentPoliCodeId,
          sourcePoliName,
          sourceLocationId,
          patientId: patientData.patient.id,
          category: values.category === 'radiology' ? 'RADIOLOGY' : 'LABORATORY',
          referringPractitionerId: activePractitionerId,
          referringPractitionerName: activePractitionerName,
          targetPractitionerId: targetDoctorId,
          targetPractitionerName: targetDoctor?.label || 'Dokter Tujuan',
          targetLocationId,
          targetLocationName: targetLocation?.label,
          reasonForReferral: values.internalReferralReason || undefined,
          diagnosisText: values.diagnosisText || undefined,
          conditionAtTransfer: values.conditionAtTransfer || undefined,
          patientInstruction: values.patientInstruction || undefined,
          priority: String(values.priority || 'routine'),
          serviceRequests: selectedServiceRequestCodes.map((item) => ({
            masterServiceRequestCodeId: item.masterServiceRequestCodeId,
            code: item.code,
            display: item.display,
            system: item.system
          }))
        })

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['service-request', 'by-encounter', encounterId]
          }),
          queryClient.invalidateQueries({
            queryKey: ['service-request', 'by-encounter', result.childEncounterId]
          }),
          queryClient.invalidateQueries({
            queryKey: ['referrals', 'encounter', encounterId]
          }),
          queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey.some(
                (part) =>
                  typeof part === 'string' &&
                  ['encounter', 'service-request', 'referral', 'ancillary'].some((token) =>
                    part.includes(token)
                  )
              )
          })
        ])

        message.success('Rujukan internal penunjang berhasil dibuat')
      } else {
        await createServiceRequest(values)
      }

      form.resetFields()
      setDoctorSearch('')
      setLocationSearch('')
      setShowForm(false)
    } catch (error) {
      if (error !== null && typeof error === 'object' && 'errorFields' in error) return
      console.error('Error creating service request:', error)
      message.error(error instanceof Error ? error.message : 'Gagal menyimpan penunjang medis')
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setDoctorSearch('')
    setLocationSearch('')
    setShowForm(false)
  }

  const isInternalReferral = orderMode === 'internal-referral'
  const isSubmittingAny = isSubmitting || createInternalAncillaryOrder.isPending
  const internalTargetLabel =
    selectedCategory === 'radiology' ? 'Dokter Radiologi Tujuan' : 'Dokter Laboratorium Tujuan'
  const internalLocationLabel =
    selectedCategory === 'radiology' ? 'Lokasi Radiologi Tujuan' : 'Lokasi Laboratorium Tujuan'
  const internalHelpText =
    selectedCategory === 'radiology'
      ? 'Flow ini akan membuat child encounter radiologi, surat rujukan internal, lalu service request pada encounter baru. Poli asal dari encounter aktif dan lokasi tujuan yang dipilih akan ikut masuk ke surat rujukan.'
      : 'Flow ini akan membuat child encounter laboratorium, surat rujukan internal, lalu service request pada encounter baru. Poli asal dari encounter aktif dan lokasi tujuan yang dipilih akan ikut masuk ke surat rujukan.'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Pemeriksaan yang Sudah Diorder</span>
          {!showForm && (
            <Button type="primary" onClick={() => setShowForm(true)}>
              Tambah Penunjang Medis
            </Button>
          )}
        </div>
        {isLoading || isLoadingEncounterList ? (
          <div className="flex justify-center py-4">
            <Spin />
          </div>
        ) : isError || isErrorEncounterList ? (
          <Alert
            type="error"
            message="Gagal memuat data pemeriksaan encounter parent/sub encounter"
          />
        ) : !showForm ? (
          <GenericTable<ServiceRequestRow>
            columns={columns}
            dataSource={existingOrders}
            rowKey={(record) =>
              String(record.id ?? record.identifier ?? record.codes?.[0]?.code ?? 'unknown')
            }
            tableProps={{ locale: { emptyText: 'Belum ada pemeriksaan yang diorder' } }}
          />
        ) : (
          <></>
        )}
      </div>

      {showForm && (
        <div>
          <div className="font-medium mb-2">Tambah Penunjang Medis</div>
          <div className="mb-4">
            <CreateServiceRequestForm
              form={form}
              extraFields={() => (
                <>
                  {isInternalReferral ? (
                    <>
                      <Alert
                        type="info"
                        showIcon
                        className="mb-4"
                        message="Rujukan internal akan dibuat"
                        description={internalHelpText}
                      />
                      <div className="my-2"></div>
                      <Form.Item
                        name="targetPractitionerId"
                        label={internalTargetLabel}
                        rules={[
                          { required: true, message: 'Pilih dokter tujuan rujukan internal' }
                        ]}
                      >
                        <Select
                          showSearch
                          placeholder="Pilih dokter tujuan"
                          loading={isLoadingDoctors}
                          options={doctorOptions}
                          filterOption={false}
                          optionFilterProp="label"
                          onSearch={setDoctorSearch}
                          notFoundContent="Dokter tujuan tidak ditemukan"
                        />
                      </Form.Item>
                      <Form.Item
                        name="targetLocationId"
                        label={internalLocationLabel}
                        rules={[{ required: true, message: 'Pilih lokasi tujuan rujukan internal' }]}
                      >
                        <Select
                          showSearch
                          placeholder="Cari dan pilih lokasi tujuan"
                          loading={isLoadingLocations}
                          options={locationOptions}
                          filterOption={false}
                          optionFilterProp="label"
                          onSearch={setLocationSearch}
                          notFoundContent="Lokasi tujuan tidak ditemukan"
                        />
                      </Form.Item>
                      <Form.Item
                        name="conditionAtTransfer"
                        label="Keadaan Saat Kirim"
                        rules={[{ required: true, message: 'Keadaan saat kirim wajib diisi' }]}
                      >
                        <Input.TextArea
                          rows={2}
                          placeholder="Contoh: compos mentis, stabil, nyeri sedang"
                        />
                      </Form.Item>
                      <Form.Item name="diagnosisText" label="Diagnosa (opsional)">
                        <Input.TextArea
                          rows={2}
                          placeholder="Tambahkan diagnosa bila perlu dicantumkan pada surat rujukan"
                        />
                      </Form.Item>
                      <Form.Item
                        name="internalReferralReason"
                        label="Alasan Rujukan Internal (opsional)"
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="Tambahkan alasan rujukan internal bila diperlukan"
                        />
                      </Form.Item>
                    </>
                  ) : null}
                  <Form.Item
                    name="orderMode"
                    label="Mode Pembuatan Order"
                    initialValue="internal-referral"
                    rules={[{ required: true, message: 'Pilih mode order' }]}
                  >
                    <Radio.Group
                      options={[
                        { label: 'Order Langsung di Encounter Aktif', value: 'direct' },
                        { label: 'Rujukan Internal ke Lab/Rad', value: 'internal-referral' }
                      ]}
                    />
                  </Form.Item>
                </>
              )}
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={handleCancel}>Batal</Button>
            <Button type="primary" onClick={handleSubmit} loading={isSubmittingAny}>
              Simpan Penunjang Medis
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
