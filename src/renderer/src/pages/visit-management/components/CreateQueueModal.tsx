import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { client } from '@renderer/utils/client'
import { PatientAttributes } from '@shared/patient'
import { App, Button, DatePicker, Drawer, Form, Input, Select, Space } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'

export type CreateQueueModalProps = {
  open: boolean
  onClose: () => void
  patient?: PatientAttributes
  onSuccess?: () => void
  showDate?: boolean
}

const CreateQueueModal = ({
  open,
  onClose,
  patient,
  onSuccess,
  showDate = true
}: CreateQueueModalProps) => {
  const [form] = Form.useForm()
  const createQueue = client.visitManagement.register.useMutation()
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

  const { message } = App.useApp()

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        visitDate: dayjs(),
        paymentMethod: 'CASH'
      })
    } else {
      form.resetFields()
      createQueue.reset()
    }
  }, [open, form, patient])

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

      message.success('Antrian berhasil dibuat')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      // Error handling is managed by react-query/client usually, but we can show message here too
      console.error(error)
      message.error(error.message || 'Gagal membuat antrian')
    }
  }

  return (
    <Drawer
      title={patient ? `Pendaftaran Pasien: ${patient.name}` : 'Buat Antrian'}
      width={600}
      open={open}
      onClose={onClose}
      maskClosable={false}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={createQueue.isPending}>
            Daftar
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          visitDate: dayjs(),
          paymentMethod: 'CASH'
        }}
      >
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

        {needsMitra && (
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
              label="Mitra Code"
              rules={[{ required: true, message: 'Harap isi mitra code' }]}
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
        )}

        {needsMitra &&
          !mitraQuery.isLoading &&
          !mitraQuery.isRefetching &&
          mitraOptions.length === 0 && (
            <div style={{ color: '#a8071a' }}>
              Data mitra tidak ditemukan untuk metode pembayaran ini.
            </div>
          )}

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
          doctorOptions.length === 0 && (
            <div style={{ color: '#a8071a' }}>
              Tidak ada dokter tersedia untuk tanggal dan poli yang dipilih.
            </div>
          )}
      </Form>
    </Drawer>
  )
}

export default CreateQueueModal
