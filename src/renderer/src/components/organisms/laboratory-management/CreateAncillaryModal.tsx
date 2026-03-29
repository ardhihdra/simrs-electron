import { SaveOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, Button, Card, Col, Form, Input, Modal, Row, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'

interface PatientItem {
  id: string
  name?: string
  identifier?: string
  mrn?: string
}

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

interface CreateAncillaryModalProps {
  open: boolean
  onClose: () => void
}

type EncounterCategory = 'LABORATORY' | 'RADIOLOGY'
type ArrivalType = 'WALK_IN' | 'REFERRAL' | 'EMERGENCY' | 'APPOINTMENT' | 'INTERNAL_ORDER'

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

export default function CreateAncillaryModal({ open, onClose }: CreateAncillaryModalProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const [patientSearch, setPatientSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const category = Form.useWatch('category', form) as EncounterCategory | undefined
  const patientId = Form.useWatch('patientId', form) as string | undefined

  const patientParams = useMemo(() => {
    const params: Record<string, string> = { page: '1', items: '30' }
    if (patientSearch.trim()) {
      params.q = patientSearch.trim()
      params.fields = 'name,identifier,mrn'
    }
    return params
  }, [patientSearch])

  const { data: patientsData, isLoading: isLoadingPatients } = client.query.entity.useQuery(
    {
      model: 'patient',
      method: 'get',
      params: patientParams
    },
    {
      enabled: open,
      queryKey: ['ancillary-patient-search', patientParams]
    } as any
  )

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

  const { data: serviceRequestsData, isLoading: isLoadingServiceRequests } = client.query.entity.useQuery(
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
      enabled: open,
      queryKey: ['ancillary-kepegawaian-doctors', doctorParams]
    } as any
  )

  const patientOptions = useMemo(() => {
    const patients = normalizeList<PatientItem>(patientsData)
    return patients.map((p) => ({
      value: String(p.id),
      label: `${p.name || 'Unknown Patient'} (${p.identifier || p.mrn || p.id})`
    }))
  }, [patientsData])

  const selectedPatient = useMemo(() => {
    const patients = normalizeList<PatientItem>(patientsData)
    return patients.find((p) => String(p.id) === String(patientId)) || null
  }, [patientsData, patientId])

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
    const pegawai = normalizeList<KepegawaianItem>(doctorsData)

    return pegawai
      .filter((item) => isDoctorPegawai(item))
      .map((item) => ({
        value: Number(item.id),
        label: `${item.namaLengkap || 'Dokter'} (${item.nik || item.id})`
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
    setPatientSearch('')
    setDoctorSearch('')
    onClose()
  }

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        category: 'LABORATORY',
        arrivalType: 'WALK_IN'
      })
    }
  }, [open, form])

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
            notifyFormValidationError(form, message, errorInfo, 'Lengkapi data encounter penunjang terlebih dahulu.')
          }
        >
          <Row gutter={24}>
            <Col span={10}>
              <Card title="Informasi Pasien" size="small">
                <Form.Item
                  name="patientId"
                  label="Pasien"
                  rules={[{ required: true, message: 'Harap pilih pasien' }]}
                >
                  <Select
                    showSearch
                    placeholder="Cari pasien..."
                    loading={isLoadingPatients}
                    options={patientOptions}
                    filterOption={false}
                    onSearch={setPatientSearch}
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item
                  name="category"
                  label="Kategori Penunjang"
                  rules={[{ required: true, message: 'Harap pilih kategori' }]}
                >
                  <Select
                    options={[
                      { value: 'LABORATORY', label: 'Laboratorium' },
                      { value: 'RADIOLOGY', label: 'Radiologi' }
                    ]}
                  />
                </Form.Item>

                <Form.Item name="serviceRequestId" label="Service Request (opsional)">
                  <Select
                    showSearch
                    allowClear
                    placeholder={
                      patientId ? 'Pilih service request (opsional)' : 'Pilih pasien terlebih dahulu'
                    }
                    loading={isLoadingServiceRequests}
                    disabled={!patientId}
                    options={serviceRequestOptions}
                    optionFilterProp="label"
                  />
                </Form.Item>

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
                  label="Dokter Pemeriksa"
                  rules={[{ required: true, message: 'Harap pilih dokter' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pilih Dokter"
                    loading={isLoadingDoctors}
                    options={doctorOptions}
                    optionFilterProp="label"
                    filterOption={false}
                    onSearch={setDoctorSearch}
                    notFoundContent="Dokter tidak ditemukan"
                  />
                </Form.Item>

                <Form.Item
                  name="requestedByPractitionerId"
                  label="Requested By Practitioner ID (opsional)"
                >
                  <Input placeholder="Contoh: 123" />
                </Form.Item>

                <Form.Item name="episodeOfCareId" label="Episode Of Care ID (opsional)">
                  <Input placeholder="UUID episode of care" />
                </Form.Item>
              </Card>

              <Card title="Ringkasan" size="small">
                <div className="text-sm text-gray-600 flex flex-col gap-2">
                  <div>
                    <span className="font-medium">Pasien:</span> {selectedPatient?.name || '-'} (
                    {selectedPatient?.identifier || selectedPatient?.mrn || patientId || '-'})
                  </div>
                  <div>
                    <span className="font-medium">Jumlah Service Request Tersedia:</span>{' '}
                    {serviceRequestOptions.length}
                  </div>
                  <div>
                    <span className="font-medium">Catatan:</span> Service Request dan unit tujuan tidak
                    wajib saat pembuatan encounter.
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </Modal>
  )
}
