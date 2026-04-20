import { SaveOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import PatientLookupSelector from '@renderer/components/organisms/patient/PatientLookupSelector'
import { client } from '@renderer/utils/client'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, Button, Card, Col, Empty, Form, Modal, Row, Select, Space, Tag, Typography } from 'antd'
import type { PatientAttributes } from 'simrs-types'
import { useEffect, useMemo, useState } from 'react'

interface ServiceRequestItem {
  id: string | number
  status?: string
  categories?: Array<{ code?: string; display?: string }>
  codes?: Array<{ code?: string; display?: string }>
}

interface KepegawaianItem {
  id: number
  namaLengkap?: string
  nik?: string
  hakAksesId?: string
  hakAkses?: {
    kode?: string
    nama?: string
  }
}

interface DoctorSpecialityItem {
  id: number
  kepegawaianId?: number
  specialityId?: number
  isActive?: boolean
  dokter?: KepegawaianItem
  speciality?: {
    id?: number
    kode?: string
    nama?: string
    isActive?: boolean
  }
}

interface CreateAncillaryModalProps {
  open: boolean
  onClose: () => void
  fixedCategory?: EncounterCategory
}

type EncounterCategory = 'LABORATORY' | 'RADIOLOGY'
type ArrivalType = 'WALK_IN' | 'REFERRAL' | 'EMERGENCY' | 'APPOINTMENT' | 'INTERNAL_ORDER'

const ANCILLARY_SPECIALITY_CODE_MAP: Record<EncounterCategory, string> = {
  LABORATORY: 'SP-PK',
  RADIOLOGY: 'SP-RAD'
}

function normalizeList<T>(data: unknown): T[] {
  const raw = data as any
  return (raw?.result || raw?.data || raw || []) as T[]
}

function isCategoryMatch(category: EncounterCategory, sr: ServiceRequestItem): boolean {
  const categoryValues = (sr.categories || [])
    .map((c) => `${c.code || ''} ${c.display || ''}`.toLowerCase())
    .join(' ')

  if (!categoryValues) return true

  if (category === 'LABORATORY') {
    return categoryValues.includes('laboratory') || categoryValues.includes('lab')
  }

  return (
    categoryValues.includes('radiology') ||
    categoryValues.includes('imaging') ||
    categoryValues.includes('rad')
  )
}

function buildServiceRequestLabel(sr: ServiceRequestItem): string {
  const codeLabel = (sr.codes || [])
    .slice(0, 2)
    .map((c) => c.display || c.code)
    .filter(Boolean)
    .join(', ')

  const status = sr.status ? String(sr.status).toUpperCase() : 'UNKNOWN'
  const requestCode = sr.id ? `SR#${sr.id}` : 'SR'
  return `${requestCode} - ${codeLabel || 'No code'} (${status})`
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

export default function CreateAncillaryModal({
  open,
  onClose,
  fixedCategory
}: CreateAncillaryModalProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const [selectedPatient, setSelectedPatient] = useState<PatientAttributes | undefined>(undefined)
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false)
  const [doctorSearch, setDoctorSearch] = useState('')
  const [requestedByDoctorSearch, setRequestedByDoctorSearch] = useState('')
  const category = Form.useWatch('category', form) as EncounterCategory | undefined
  const patientId = Form.useWatch('patientId', form) as string | undefined

  const serviceRequestParams = useMemo(() => {
    const params: Record<string, string> = {
      page: '1',
      items: '100',
      include: 'codes,categories'
    }

    if (patientId) {
      params.subjectId = patientId
    }

    return params
  }, [patientId])

  const { data: serviceRequestsData, isLoading: isLoadingServiceRequests } =
    client.query.entity.useQuery(
      {
        model: 'serviceRequest',
        method: 'get',
        params: serviceRequestParams
      },
      {
        enabled: open && !!patientId,
        queryKey: ['ancillary-service-request', serviceRequestParams]
      } as any
    )

  const ancillaryDoctorSpecialityParams = useMemo(() => {
    return {
      page: '1',
      items: '200',
      include: 'dokter,speciality'
    }
  }, [])

  const { data: ancillaryDoctorSpecialitiesData, isLoading: isLoadingAncillaryDoctors } =
    client.query.entity.useQuery(
      {
        model: 'doctorSpeciality',
        method: 'get',
        params: ancillaryDoctorSpecialityParams
      },
      {
        enabled: open && !!category,
        queryKey: ['ancillary-doctor-specialities', ancillaryDoctorSpecialityParams, category]
      } as any
    )

  const requestedByDoctorParams = useMemo(() => {
    const params: Record<string, string> = {
      page: '1',
      items: '200',
      include: 'hakAkses'
    }

    if (requestedByDoctorSearch.trim()) {
      params.q = requestedByDoctorSearch.trim()
      params.fields = 'namaLengkap,nik'
    }

    return params
  }, [requestedByDoctorSearch])

  const { data: doctorsData, isLoading: isLoadingDoctors } = client.query.entity.useQuery(
    {
      model: 'kepegawaian',
      method: 'get',
      params: requestedByDoctorParams
    },
    {
      enabled: open,
      queryKey: ['ancillary-kepegawaian-doctors', requestedByDoctorParams]
    } as any
  )

  const serviceRequestOptions = useMemo(() => {
    const requests = normalizeList<ServiceRequestItem>(serviceRequestsData)

    return requests
      .filter((sr) => !category || isCategoryMatch(category, sr))
      .map((sr) => ({
        value: String(sr.id),
        label: buildServiceRequestLabel(sr)
      }))
  }, [serviceRequestsData, category])

  const doctorOptions = useMemo(() => {
    if (!category) return []

    const specialityCode = ANCILLARY_SPECIALITY_CODE_MAP[category]
    const search = doctorSearch.trim().toLowerCase()
    const rows = normalizeList<DoctorSpecialityItem>(ancillaryDoctorSpecialitiesData)
    const uniqueDoctors = new Map<number, { value: number; label: string }>()

    rows.forEach((item) => {
      const doctor = item.dokter
      const speciality = item.speciality
      const doctorId = Number(doctor?.id ?? item.kepegawaianId)
      const doctorName = String(doctor?.namaLengkap || '').trim()
      const specialityKode = String(speciality?.kode || '').trim().toUpperCase()
      const isMatchSpeciality = specialityKode === specialityCode
      const isDoctor = doctor ? isDoctorPegawai(doctor) : false
      const isMatchSearch =
        !search ||
        doctorName.toLowerCase().includes(search) ||
        String(doctor?.nik || '').toLowerCase().includes(search)

      if (!doctorId || !doctorName || !isDoctor || !isMatchSpeciality || !isMatchSearch) return
      if (uniqueDoctors.has(doctorId)) return

      uniqueDoctors.set(doctorId, {
        value: doctorId,
        label: doctorName
      })
    })

    return Array.from(uniqueDoctors.values())
  }, [ancillaryDoctorSpecialitiesData, category, doctorSearch])

  const requestedByDoctorOptions = useMemo(() => {
    const pegawai = normalizeList<KepegawaianItem>(doctorsData)

    return pegawai
      .filter((item) => isDoctorPegawai(item))
      .map((item) => ({
        value: Number(item.id),
        label: `${item.namaLengkap || 'Dokter'}`
      }))
  }, [doctorsData])

  const createLaboratoryMutation = client.registration.createLaboratoryEncounter.useMutation()
  const createRadiologyMutation = client.registration.createRadiologyEncounter.useMutation()

  const handleSubmit = async (values: any) => {
    const requestedBy = values.requestedByPractitionerId
      ? Number(values.requestedByPractitionerId)
      : undefined
    const requestedByPractitionerId =
      typeof requestedBy === 'number' && !Number.isNaN(requestedBy) ? requestedBy : undefined

    const payload = {
      patientId: String(values.patientId),
      serviceRequestId: values.serviceRequestId ? String(values.serviceRequestId) : undefined,
      practitionerId: Number(values.practitionerId),
      requestedByPractitionerId,
      episodeOfCareId: values.episodeOfCareId ? String(values.episodeOfCareId) : undefined,
      arrivalType: (values.arrivalType || 'WALK_IN') as ArrivalType
    }

    try {
      if (values.category === 'LABORATORY') {
        await createLaboratoryMutation.mutateAsync(payload)
      } else {
        await createRadiologyMutation.mutateAsync(payload)
      }

      message.success(`Encounter ${String(values.category).toLowerCase()} berhasil dibuat`)
      handleClose()
    } catch (error: any) {
      console.error('Submit Error:', error)
      message.error(error.message || 'Gagal membuat encounter penunjang')
    }
  }

  const handleClose = () => {
    form.resetFields()
    setSelectedPatient(undefined)
    setIsPatientPickerOpen(false)
    setDoctorSearch('')
    setRequestedByDoctorSearch('')
    onClose()
  }

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        category: fixedCategory || 'LABORATORY',
        arrivalType: 'WALK_IN'
      })
    }
  }, [fixedCategory, open, form])

  return (
    <Modal
      title="Registrasi Encounter Penunjang Baru"
      open={open}
      onCancel={handleClose}
      width={900}
      footer={[
        <Button key="back" onClick={handleClose}>
          Batal
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={createLaboratoryMutation.isPending || createRadiologyMutation.isPending}
          onClick={() => form.submit()}
        >
          Simpan encounter
        </Button>
      ]}
    >
      <div className="py-2">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFinishFailed={(errorInfo) =>
            notifyFormValidationError(
              form,
              message,
              errorInfo,
              'Lengkapi data encounter penunjang terlebih dahulu.'
            )
          }
        >
          <Row gutter={24}>
            <Col span={10}>
              <Card title="Informasi Pasien" size="small">
                <Form.Item
                  label="Pasien"
                  required
                  validateStatus={!patientId ? 'error' : undefined}
                  help={!patientId ? 'Harap pilih pasien' : undefined}
                >
                  <div className="space-y-3">
                    <Button
                      icon={<SearchOutlined />}
                      onClick={() => setIsPatientPickerOpen(true)}
                      className="!rounded-xl"
                    >
                      {selectedPatient ? 'Ganti Pasien' : 'Pilih Pasien'}
                    </Button>

                    {selectedPatient ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <Space align="start">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <UserOutlined />
                          </div>
                          <div>
                            <Typography.Text strong>{selectedPatient.name || '-'}</Typography.Text>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Tag color="green">
                                RM {selectedPatient.medicalRecordNumber || '-'}
                              </Tag>
                              <Tag>NIK {selectedPatient.nik || '-'}</Tag>
                            </div>
                            <Typography.Paragraph
                              type="secondary"
                              style={{ marginBottom: 0, marginTop: 8 }}
                            >
                              {selectedPatient.address || 'Alamat belum tersedia'}
                            </Typography.Paragraph>
                          </div>
                        </Space>
                      </div>
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Belum ada pasien dipilih."
                      />
                    )}
                  </div>
                </Form.Item>

                <Form.Item
                  name="patientId"
                  rules={[{ required: true, message: 'Harap pilih pasien' }]}
                  hidden
                >
                  <input type="hidden" />
                </Form.Item>

                <Form.Item
                  name="category"
                  label="Kategori Penunjang"
                  rules={[{ required: true, message: 'Harap pilih kategori' }]}
                >
                  <Select
                    disabled={!!fixedCategory}
                    options={[
                      { value: 'LABORATORY', label: 'Laboratorium' },
                      { value: 'RADIOLOGY', label: 'Radiologi' }
                    ]}
                  />
                </Form.Item>

                {/* Service Request Dibuat setelah antrian */}
                {/* <Form.Item name="serviceRequestId" label="Service Request (opsional)">
                  <Select
                    showSearch
                    allowClear
                    placeholder={
                      patientId
                        ? 'Pilih service request (opsional)'
                        : 'Pilih pasien terlebih dahulu'
                    }
                    loading={isLoadingServiceRequests}
                    disabled={!patientId}
                    options={serviceRequestOptions}
                    optionFilterProp="label"
                  />
                </Form.Item> */}

                <Form.Item
                  name="arrivalType"
                  label="Arrival Type"
                  rules={[{ required: true, message: 'Harap pilih arrival type' }]}
                >
                  <Select
                    options={[
                      { value: 'WALK_IN', label: 'Walk In (default)' },
                      { value: 'REFERRAL', label: 'Referral' },
                      { value: 'EMERGENCY', label: 'Emergency' },
                      { value: 'APPOINTMENT', label: 'Appointment' },
                      { value: 'INTERNAL_ORDER', label: 'Internal Order' }
                    ]}
                  />
                </Form.Item>
              </Card>
            </Col>

            <Col span={14}>
              <Card title="Dokter & Tambahan" size="small" className="mb-4">
                <Form.Item
                  name="practitionerId"
                  label="Dokter"
                  rules={[{ required: true, message: 'Harap pilih dokter' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pilih Dokter"
                    loading={isLoadingAncillaryDoctors}
                    options={doctorOptions}
                    optionFilterProp="label"
                    filterOption={false}
                    onSearch={setDoctorSearch}
                    notFoundContent="Dokter tidak ditemukan"
                  />
                </Form.Item>

                <Form.Item name="requestedByPractitionerId" label="Dokter Pengirim (opsional)">
                  <Select
                    showSearch
                    allowClear
                    placeholder="Pilih Dokter Pengirim"
                    loading={isLoadingDoctors}
                    options={requestedByDoctorOptions}
                    optionFilterProp="label"
                    filterOption={false}
                    onSearch={setRequestedByDoctorSearch}
                    notFoundContent="Dokter tidak ditemukan"
                  />
                </Form.Item>

                {/* <Form.Item name="episodeOfCareId" label="Episode Of Care ID (opsional)">
                  <Input placeholder="UUID episode of care" />
                </Form.Item> */}
              </Card>

              <div className="mt-4">
                <Card title="Ringkasan" size="small">
                  <div className="text-sm text-gray-600 flex flex-col gap-2">
                    <div>
                      <span className="font-medium">Pasien:</span> {selectedPatient?.name || '-'} (
                      {selectedPatient?.medicalRecordNumber || '-'})
                    </div>
                    <div>
                      <span className="font-medium">Jumlah Service Request Tersedia:</span>{' '}
                      {serviceRequestOptions.length}
                    </div>
                    <div>
                      <span className="font-medium">Catatan:</span> Service Request dan unit tujuan
                      tidak wajib saat pembuatan encounter.
                    </div>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>
        </Form>
      </div>

      <Modal
        title="Pilih Pasien"
        open={isPatientPickerOpen}
        onCancel={() => setIsPatientPickerOpen(false)}
        footer={null}
        width={1100}
        destroyOnClose
      >
        <PatientLookupSelector
          value={selectedPatient}
          onChange={(patient) => {
            if (!patient) return
            setSelectedPatient(patient)
            form.setFieldValue('patientId', patient.id)
            setIsPatientPickerOpen(false)
          }}
          title="Cari Pasien"
          showSelectionSummary={false}
          showClearButton={false}
          createButtonLabel="Buat Pasien Baru"
        />
      </Modal>
    </Modal>
  )
}
