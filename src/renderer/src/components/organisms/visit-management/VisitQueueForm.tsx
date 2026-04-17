import PatientLookupSelector from '@renderer/components/organisms/patient/PatientLookupSelector'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { client } from '@renderer/utils/client'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import type { PatientAttributes } from '@shared/patient'
import { App, Button, DatePicker, Form, Input, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'

type VisitQueueFormProps = {
  patient?: PatientAttributes
  onPatientChange?: (patient?: PatientAttributes) => void
  onSuccess?: (response: any) => Promise<void> | void
  onCancel?: () => void
  showDate?: boolean
  showPatientLookup?: boolean
  patientRequired?: boolean
  submitLabel?: string
  cancelLabel?: string
  successMessage?: string | false
  defaultPaymentMethod?: 'CASH' | 'INSURANCE' | 'BPJS' | 'COMPANY'
}

export default function VisitQueueForm({
  patient,
  onPatientChange,
  onSuccess,
  onCancel,
  showDate = true,
  showPatientLookup = false,
  patientRequired = false,
  submitLabel = 'Daftar',
  cancelLabel = 'Batal',
  successMessage = 'Antrian berhasil dibuat',
  defaultPaymentMethod = 'CASH'
}: VisitQueueFormProps) {
  const [form] = Form.useForm()
  const createQueue = client.visitManagement.register.useMutation()
  const { message } = App.useApp()

  const visitDate = Form.useWatch('visitDate', form)
  const poliId = Form.useWatch('poliId', form)
  const paymentMethod = Form.useWatch('paymentMethod', form)
  const needsMitra =
    paymentMethod === 'INSURANCE' || paymentMethod === 'COMPANY' || paymentMethod === 'BPJS'

  const doctorQueryInput = useMemo(
    () => ({
      date: visitDate ? dayjs(visitDate).format('YYYY-MM-DD') : undefined,
      poliId: poliId ? Number(poliId) : undefined
    }),
    [visitDate, poliId]
  )

  const doctorsQuery = client.registration.getAvailableDoctors.useQuery(doctorQueryInput, {
    enabled: !!doctorQueryInput.date && !!doctorQueryInput.poliId,
    queryKey: ['availableDoctors', { date: doctorQueryInput.date, poliId: doctorQueryInput.poliId }]
  })

  const availableDoctors = useMemo(() => {
    const data = doctorsQuery.data as any
    return data?.result?.doctors || data?.data?.doctors || data?.doctors || []
  }, [doctorsQuery.data])

  const doctorOptions = useMemo(() => {
    return availableDoctors.map((doctor: any) => {
      const timeLabel =
        doctor.timeSlot?.startTime && doctor.timeSlot?.endTime
          ? ` (${doctor.timeSlot.startTime} - ${doctor.timeSlot.endTime})`
          : ''

      return {
        value: doctor.doctorScheduleId,
        label: `${doctor.doctorName || 'Dokter'}${timeLabel}`
      }
    })
  }, [availableDoctors])

  const mitraQueryInput = useMemo(
    () => ({
      type:
        paymentMethod === 'COMPANY'
          ? ('company' as const)
          : paymentMethod === 'BPJS'
            ? ('bpjs' as const)
            : ('insurance' as const),
      status: 'active'
    }),
    [paymentMethod]
  )

  const mitraQuery = client.visitManagement.getMitra.useQuery(mitraQueryInput, {
    enabled: needsMitra,
    queryKey: ['mitra', mitraQueryInput]
  })

  const mitraOptions = useMemo(() => {
    const data = mitraQuery.data as any
    const rows = data?.result || data?.data || []

    return rows.map((item: any) => ({
      value: item.id,
      label: item.name || item.nama || `Mitra ${item.id}`
    }))
  }, [mitraQuery.data])

  useEffect(() => {
    if (form.getFieldValue('visitDate') && form.getFieldValue('paymentMethod')) {
      return
    }

    form.setFieldsValue({
      visitDate: dayjs(),
      paymentMethod: defaultPaymentMethod
    })
  }, [defaultPaymentMethod, form])

  useEffect(() => {
    if (needsMitra) return

    form.setFieldsValue({
      mitraId: undefined,
      mitraCodeNumber: undefined,
      mitraCodeExpiredDate: undefined
    })
  }, [needsMitra, form])

  useEffect(() => {
    form.setFieldValue('doctorScheduleId', undefined)
  }, [visitDate, poliId, form])

  const handleSubmit = async (values: any) => {
    try {
      if (patientRequired && !patient?.id) {
        throw new Error('Pilih pasien terlebih dahulu sebelum membuat antrian poli.')
      }

      const selectedDoctor = availableDoctors.find(
        (doctor: any) => Number(doctor.doctorScheduleId) === Number(values.doctorScheduleId)
      )

      if (!selectedDoctor) {
        throw new Error('Dokter jadwal tidak ditemukan. Silakan pilih ulang dokter.')
      }

      const formattedVisitDate = dayjs(values.visitDate).format('YYYY-MM-DD')
      const mitraCodeExpiredDate = values.mitraCodeExpiredDate
        ? dayjs(values.mitraCodeExpiredDate).format('YYYY-MM-DD')
        : undefined

      const payload = {
        queueDate: formattedVisitDate,
        visitDate: formattedVisitDate,
        practitionerId: Number(selectedDoctor.doctorId),
        doctorScheduleId: Number(values.doctorScheduleId),
        registrationType: 'OFFLINE' as const,
        patientId: patient?.id,
        paymentMethod: values.paymentMethod,
        mitraId: needsMitra ? Number(values.mitraId) : undefined,
        mitraCodeNumber: needsMitra ? values.mitraCodeNumber || undefined : undefined,
        mitraCodeExpiredDate: needsMitra ? mitraCodeExpiredDate : undefined,
        mitraCode: needsMitra ? values.mitraCodeNumber || undefined : undefined,
        mitraExpiredAt: needsMitra ? mitraCodeExpiredDate : undefined,
        reason: values.reason || undefined,
        notes: values.notes || undefined
      }

      const response = await createQueue.mutateAsync(payload)
      if ((response as any)?.success === false) {
        throw new Error((response as any)?.message || 'Gagal membuat antrian')
      }

      await onSuccess?.(response)

      if (successMessage) {
        message.success(successMessage)
      }
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Gagal membuat antrian')
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onFinishFailed={(errorInfo) =>
        notifyFormValidationError(
          form,
          message,
          errorInfo,
          'Lengkapi data antrian terlebih dahulu.'
        )
      }
      initialValues={{
        visitDate: dayjs(),
        paymentMethod: defaultPaymentMethod
      }}
    >
      {showPatientLookup ? (
        <div className="mb-4">
          <PatientLookupSelector
            value={patient}
            onChange={(nextPatient) => onPatientChange?.(nextPatient)}
          />
        </div>
      ) : null}

      <Form.Item
        name="visitDate"
        label="Tanggal Kunjungan"
        rules={[{ required: true, message: 'Harap pilih tanggal' }]}
        hidden={!showDate}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="poliId"
        label="Poli"
        rules={[{ required: true, message: 'Harap pilih poli' }]}
      >
        <SelectAsync entity="poli" output="id" />
      </Form.Item>

      <Form.Item
        name="paymentMethod"
        label="Metode Pembayaran"
        rules={[{ required: true, message: 'Harap pilih metode pembayaran' }]}
      >
        <Select
          options={[
            { value: 'CASH', label: 'Tunai' },
            { value: 'INSURANCE', label: 'Asuransi' },
            { value: 'BPJS', label: 'BPJS' },
            { value: 'COMPANY', label: 'Perusahaan' }
          ]}
        />
      </Form.Item>

      {needsMitra ? (
        <>
          <Form.Item
            name="mitraId"
            label="Mitra"
            rules={[{ required: true, message: 'Harap pilih mitra' }]}
          >
            <Select
              options={mitraOptions}
              loading={mitraQuery.isLoading || mitraQuery.isRefetching}
              placeholder="Pilih mitra"
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="mitraCodeNumber"
            label="Nomor Kartu"
            rules={[{ required: true, message: 'Harap isi nomor kartu' }]}
          >
            <Input placeholder="Nomor kartu/nomor mitra" />
          </Form.Item>

          <Form.Item
            name="mitraCodeExpiredDate"
            label="Expired At"
            rules={[{ required: true, message: 'Harap pilih tanggal expired' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </>
      ) : null}

      {needsMitra &&
      !mitraQuery.isLoading &&
      !mitraQuery.isRefetching &&
      mitraOptions.length === 0 ? (
        <div style={{ color: '#a8071a', marginBottom: 16 }}>
          Data mitra tidak ditemukan untuk metode pembayaran ini.
        </div>
      ) : null}

      <Form.Item
        name="doctorScheduleId"
        label="Dokter"
        rules={[{ required: true, message: 'Harap pilih dokter' }]}
      >
        <Select
          options={doctorOptions}
          loading={doctorsQuery.isLoading || doctorsQuery.isRefetching}
          disabled={!doctorQueryInput.date || !doctorQueryInput.poliId}
          placeholder={
            !doctorQueryInput.date || !doctorQueryInput.poliId
              ? 'Pilih tanggal dan poli terlebih dahulu'
              : 'Pilih dokter'
          }
          showSearch
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item name="reason" label="Alasan Kunjungan">
        <Input placeholder="Contoh: Kontrol rutin" />
      </Form.Item>

      <Form.Item name="notes" label="Catatan">
        <Input.TextArea rows={3} placeholder="Catatan tambahan (opsional)" />
      </Form.Item>

      {!doctorsQuery.isLoading &&
      !doctorsQuery.isRefetching &&
      doctorQueryInput.date &&
      doctorQueryInput.poliId &&
      doctorOptions.length === 0 ? (
        <div style={{ color: '#a8071a', marginBottom: 16 }}>
          Tidak ada dokter tersedia untuk tanggal dan poli yang dipilih.
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? <Button onClick={onCancel}>{cancelLabel}</Button> : null}
        <Button type="primary" onClick={() => form.submit()} loading={createQueue.isPending}>
          {submitLabel}
        </Button>
      </div>
    </Form>
  )
}
