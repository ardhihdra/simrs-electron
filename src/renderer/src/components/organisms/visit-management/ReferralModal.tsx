import { client } from '@renderer/utils/client'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, DatePicker, Form, Input, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

interface ReferralModalProps {
  open: boolean
  record?: any
  practitionerId?: string | number
  onClose: () => void
  onSuccess: () => void
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

function normalizeList<T>(data: unknown): T[] {
  const raw = data as any
  return (raw?.result || raw?.data || raw || []) as T[]
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

export default function ReferralModal({
  open,
  record,
  practitionerId,
  onClose,
  onSuccess
}: ReferralModalProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [targetDoctorSearch, setTargetDoctorSearch] = useState('')
  const referMutation = client.registration.referPatient.useMutation()

  const referralType = Form.useWatch('referralType', form)
  const internalTargetType = Form.useWatch('internalTargetType', form)
  const referralDate = Form.useWatch('date', form)
  const targetPoliId = Form.useWatch('targetDepartemenId', form)

  // Reset cascading selects when date changes
  useEffect(() => {
    form.setFieldValue('targetDepartemenId', undefined)
    form.setFieldValue('doctorScheduleId', undefined)
  }, [referralDate, form])

  // Reset doctor schedule when poli changes
  useEffect(() => {
    form.setFieldValue('doctorScheduleId', undefined)
  }, [targetPoliId, form])

  useEffect(() => {
    if (referralType === 'internal' && !internalTargetType) {
      form.setFieldValue('internalTargetType', 'POLI')
    }
    if (referralType !== 'internal') {
      form.setFieldValue('internalTargetType', undefined)
      form.setFieldValue('targetDepartemenId', undefined)
      form.setFieldValue('doctorScheduleId', undefined)
      form.setFieldValue('ancillaryTargetPractitionerId', undefined)
    }
  }, [referralType, internalTargetType, form])

  useEffect(() => {
    if (internalTargetType !== 'POLI') {
      form.setFieldValue('targetDepartemenId', undefined)
      form.setFieldValue('doctorScheduleId', undefined)
    } else {
      form.setFieldValue('ancillaryTargetPractitionerId', undefined)
    }
  }, [internalTargetType, form])

  const allSchedulesQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: referralDate ? dayjs(referralDate).format('YYYY-MM-DD') : undefined
    },
    {
      enabled: referralType === 'internal' && internalTargetType === 'POLI' && !!referralDate,
      queryKey: ['availableDoctors_all_referral', { date: referralDate }]
    }
  )

  const poliOptions = useMemo(() => {
    const data = allSchedulesQuery.data as any
    const doctors = data?.result?.doctors || data?.data?.doctors || data?.doctors || []
    const polisMap = new Map()
    doctors.forEach((d: any) => {
      if (d.poliId && d.poliName) polisMap.set(d.poliId, d.poliName)
    })
    return Array.from(polisMap.entries()).map(([id, name]) => ({ value: id, label: name }))
  }, [allSchedulesQuery.data])

  const internalDoctorsQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: referralDate ? dayjs(referralDate).format('YYYY-MM-DD') : undefined,
      poliId: targetPoliId ? Number(targetPoliId) : undefined
    },
    {
      enabled:
        referralType === 'internal' &&
        internalTargetType === 'POLI' &&
        !!referralDate &&
        !!targetPoliId,
      queryKey: ['availableDoctors_referral', { date: referralDate, poliId: targetPoliId }]
    }
  )

  const internalDoctorOptions = useMemo(() => {
    const data = internalDoctorsQuery.data as any
    const doctors = data?.result?.doctors || data?.data?.doctors || data?.doctors || []
    return doctors.map((d: any) => ({
      value: d.doctorScheduleId,
      label: `${d.doctorName}${d.timeSlot ? ` (${d.timeSlot.startTime} - ${d.timeSlot.endTime})` : ''}`,
      doctor: d
    }))
  }, [internalDoctorsQuery.data])

  const ancillaryDoctorParams = useMemo(() => {
    const params: Record<string, string> = {
      page: '1',
      items: '200',
      include: 'hakAkses',
      hakAksesId: 'doctor'
    }

    if (targetDoctorSearch.trim()) {
      params.q = targetDoctorSearch.trim()
      params.fields = 'namaLengkap,nik'
    }

    return params
  }, [targetDoctorSearch])

  const ancillaryDoctorsQuery = client.query.entity.useQuery(
    {
      model: 'kepegawaian',
      method: 'get',
      params: ancillaryDoctorParams
    },
    {
      enabled: open && referralType === 'internal' && internalTargetType !== 'POLI',
      queryKey: ['referral-ancillary-doctors', ancillaryDoctorParams]
    } as any
  )

  const ancillaryDoctors = useMemo(() => {
    const doctors = normalizeList<KepegawaianItem>(ancillaryDoctorsQuery.data)
    return doctors.filter((doctor) => isDoctorPegawai(doctor))
  }, [ancillaryDoctorsQuery.data])

  const ancillaryDoctorOptions = useMemo(() => {
    return ancillaryDoctors.map((doctor) => ({
      value: String(doctor.id),
      label: `${doctor.namaLengkap || 'Dokter'} (${doctor.nik || doctor.id})`
    }))
  }, [ancillaryDoctors])

  const handleOk = () => {
    form.submit()
  }

  const handleCancel = () => {
    form.resetFields()
    setTargetDoctorSearch('')
    onClose()
  }

  const handleFinish = async (values: any) => {
    const ancillaryTargetPractitioner = ancillaryDoctors.find(
      (doctor) => String(doctor.id) === String(values.ancillaryTargetPractitionerId)
    )
    const selectedInternalDoctor = internalDoctorOptions.find(
      (doctor) => Number(doctor.value) === Number(values.doctorScheduleId)
    )?.doctor

    try {
      if (
        values.referralType === 'internal' &&
        values.internalTargetType === 'POLI' &&
        !selectedInternalDoctor
      ) {
        throw new Error('Jadwal dokter tujuan tidak ditemukan. Silakan pilih ulang.')
      }

      await referMutation.mutateAsync({
        encounterId: record?.encounterId,
        referringPractitionerId: Number(practitionerId),
        referringPractitionerName: 'Petugas Pendaftaran',
        direction: 'outgoing',
        referralType: values.referralType,
        internalTargetType:
          values.referralType === 'internal' ? values.internalTargetType : undefined,
        referralDate: values.date ? values.date.toISOString() : new Date().toISOString(),
        diagnosisCode: values.diagnosisCode,
        diagnosisText: values.diagnosisText,
        keadaanKirim: values.keadaanKirim,
        conditionAtTransfer: values.keadaanKirim,
        reasonForReferral: values.reasonForReferral,
        targetOrganizationName:
          values.referralType === 'internal'
            ? values.internalTargetType === 'LABORATORY'
              ? 'Laboratorium Internal'
              : values.internalTargetType === 'RADIOLOGY'
                ? 'Radiologi Internal'
                : selectedInternalDoctor?.poliName || 'Poli Internal'
            : values.targetOrganizationName,
        doctorScheduleId:
          values.referralType === 'internal' && values.internalTargetType === 'POLI'
            ? values.doctorScheduleId
            : undefined,
        targetPractitionerId:
          values.referralType === 'internal'
            ? values.internalTargetType === 'POLI'
              ? String(selectedInternalDoctor?.doctorId || '')
              : String(values.ancillaryTargetPractitionerId)
            : undefined,
        targetPractitionerName:
          values.referralType === 'external'
            ? values.targetPractitionerName
            : values.referralType === 'internal'
              ? values.internalTargetType === 'POLI'
                ? selectedInternalDoctor?.doctorName
                : ancillaryTargetPractitioner?.namaLengkap
              : undefined
      })
      message.success('Pasien berhasil dirujuk')
      form.resetFields()
      setTargetDoctorSearch('')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Gagal merujuk pasien')
    }
  }

  return (
    <Modal
      title="Rujuk Pasien"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={referMutation.isPending}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onFinishFailed={(errorInfo) =>
          notifyFormValidationError(form, message, errorInfo, 'Lengkapi data rujukan terlebih dahulu.')
        }
        initialValues={{ referralType: 'internal', internalTargetType: 'POLI' }}
      >
        <p>
          Pasien: <b>{record?.patientName}</b>
        </p>

        <Form.Item
          name="referralType"
          label="Jenis Rujukan"
          rules={[{ required: true, message: 'Harap pilih jenis rujukan' }]}
        >
          <Select style={{ width: '100%' }}>
            <Select.Option value="internal">Internal (Antar Poli)</Select.Option>
            <Select.Option value="external">External (RS Lain)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="date"
          label="Tanggal Rujukan"
          rules={[{ required: true, message: 'Harap pilih tanggal' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        {referralType === 'internal' && (
          <>
            <Form.Item
              name="internalTargetType"
              label="Tujuan Internal"
              rules={[{ required: true, message: 'Harap pilih tujuan internal' }]}
            >
              <Select style={{ width: '100%' }}>
                <Select.Option value="POLI">Poli</Select.Option>
                <Select.Option value="LABORATORY">Laboratorium</Select.Option>
                <Select.Option value="RADIOLOGY">Radiologi</Select.Option>
              </Select>
            </Form.Item>

            {internalTargetType === 'POLI' && (
              <>
                <Form.Item
                  name="targetDepartemenId"
                  label="Poli Tujuan"
                  rules={[{ required: true, message: 'Harap pilih poli tujuan' }]}
                >
                  <Select
                    placeholder="Pilih Poli"
                    options={poliOptions}
                    loading={allSchedulesQuery.isLoading || allSchedulesQuery.isRefetching}
                    disabled={!referralDate}
                  />
                </Form.Item>
                <Form.Item
                  name="doctorScheduleId"
                  label="Jadwal Dokter Tujuan"
                  rules={[{ required: true, message: 'Harap pilih jadwal dokter' }]}
                >
                  <Select
                    placeholder="Pilih Dokter & Jam"
                    options={internalDoctorOptions}
                    loading={internalDoctorsQuery.isLoading}
                  />
                </Form.Item>
              </>
            )}

            {internalTargetType !== 'POLI' && (
              <>
                <Form.Item
                  name="ancillaryTargetPractitionerId"
                  label="Dokter Tujuan"
                  rules={[{ required: true, message: 'Harap pilih dokter tujuan' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pilih dokter tujuan"
                    loading={ancillaryDoctorsQuery.isLoading || ancillaryDoctorsQuery.isRefetching}
                    options={ancillaryDoctorOptions}
                    filterOption={false}
                    optionFilterProp="label"
                    onSearch={setTargetDoctorSearch}
                    notFoundContent="Dokter tidak ditemukan"
                  />
                </Form.Item>
                <p className="text-gray-500 text-sm">
                  Rujukan internal ke{' '}
                  {internalTargetType === 'LABORATORY' ? 'Laboratorium' : 'Radiologi'} akan langsung
                  membuat encounter baru tanpa membuat queue.
                </p>
              </>
            )}
          </>
        )}

        {referralType === 'external' && (
          <>
            <Form.Item
              name="targetOrganizationName"
              label="Faskes Tujuan"
              rules={[{ required: true, message: 'Harap isi faskes tujuan' }]}
            >
              <Input placeholder="Nama RS Tujuan" />
            </Form.Item>
            <Form.Item name="targetPractitionerName" label="Dokter Tujuan">
              <Input placeholder="Nama Dokter (jika ada)" />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="diagnosisText"
          label="Diagnosis"
          rules={[{ required: true, message: 'Harap isi diagnosis' }]}
        >
          <Input.TextArea placeholder="Diagnosis pasien" />
        </Form.Item>
        <Form.Item name="keadaanKirim" label="Keadaan Saat Kirim">
          <Input.TextArea placeholder="Keadaan Saat Kirim" />
        </Form.Item>
        <Form.Item
          name="reasonForReferral"
          label="Alasan Rujukan"
          rules={[{ required: true, message: 'Harap isi alasan rujukan' }]}
        >
          <Input.TextArea placeholder="Alasan merujuk pasien" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
