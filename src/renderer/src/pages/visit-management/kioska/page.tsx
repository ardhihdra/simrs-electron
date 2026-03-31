import { BarcodeOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { hasValidationErrors, notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, Button, Card, DatePicker, Form, Input, Select, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

type QueueResult = {
  formattedQueueNumber?: string
  queueNumber?: number | string
  queueDate?: string
}

export default function KioskaPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [lastQueue, setLastQueue] = useState<QueueResult | null>(null)

  const visitDate = Form.useWatch('visitDate', form)
  const poliId = Form.useWatch('poliId', form)

  const doctorQueryInput = useMemo(
    () => ({
      date: visitDate ? dayjs(visitDate).format('YYYY-MM-DD') : undefined,
      poliId: poliId ? Number(poliId) : undefined
    }),
    [visitDate, poliId]
  )

  const createQueue = client.visitManagement.register.useMutation()
  const { data: poliData } = client.visitManagement.poli.useQuery({})
  const doctorsQuery = client.registration.getAvailableDoctors.useQuery(doctorQueryInput, {
    enabled: !!doctorQueryInput.date && !!doctorQueryInput.poliId,
    queryKey: ['kioska-availableDoctors', doctorQueryInput]
  })

  const poliOptions = useMemo(
    () =>
      (poliData?.result || []).map((poli) => ({
        label: poli.name,
        value: String(poli.id)
      })),
    [poliData]
  )

  const availableDoctors = useMemo(() => {
    const data = doctorsQuery.data as any
    return data?.result?.doctors || data?.data?.doctors || data?.doctors || []
  }, [doctorsQuery.data])

  const doctorOptions = useMemo(
    () =>
      availableDoctors.map((doctor: any) => {
        const timeLabel =
          doctor.timeSlot?.startTime && doctor.timeSlot?.endTime
            ? ` (${doctor.timeSlot.startTime} - ${doctor.timeSlot.endTime})`
            : ''

        return {
          value: String(doctor.doctorScheduleId),
          label: `${doctor.doctorName || 'Dokter'}${timeLabel}`
        }
      }),
    [availableDoctors]
  )

  useEffect(() => {
    form.setFieldValue('doctorScheduleId', undefined)
  }, [visitDate, poliId, form])

  const handleDummyScanBarcode = () => {
    const dummyCard = `CARD-${dayjs().format('YYYYMMDDHHmmss')}`
    form.setFieldValue('memberCardNumber', dummyCard)
    message.success('Barcode dummy berhasil di-scan')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (!availableDoctors.length) {
        message.error('Dokter belum tersedia untuk tanggal dan poli yang dipilih')
        return
      }

      const selectedDoctor = availableDoctors.find(
        (doctor: any) => String(doctor.doctorScheduleId) === String(values.doctorScheduleId)
      )
      if (!selectedDoctor) {
        message.error('Harap pilih dokter yang tersedia')
        return
      }

      const formattedVisitDate = dayjs(values.visitDate).format('YYYY-MM-DD')
      const cardNote = values.memberCardNumber
        ? `KIOSKA_CARD:${values.memberCardNumber}`
        : undefined

      const response = await createQueue.mutateAsync({
        queueDate: formattedVisitDate,
        visitDate: formattedVisitDate,
        practitionerId: Number(selectedDoctor.doctorId),
        doctorScheduleId: Number(selectedDoctor.doctorScheduleId),
        registrationType: 'OFFLINE',
        paymentMethod: 'CASH',
        reason: 'Registrasi Kioska',
        notes: cardNote
      })

      if ((response as any)?.success === false) {
        throw new Error((response as any)?.message || 'Gagal mengambil antrian')
      }

      const result = ((response as any)?.result || {}) as QueueResult
      setLastQueue(result)
      message.success('Antrian berhasil diambil')
    } catch (error: any) {
      if (hasValidationErrors(error)) {
        notifyFormValidationError(form, message, error, 'Lengkapi data antrian terlebih dahulu.')
        return
      }
      message.error(error?.message || 'Gagal mengambil antrian')
    }
  }

  return (
    <div>
      <Card title="Kioska - Ambil Antrian">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ visitDate: dayjs() }}
          onFinish={handleSubmit}
          onFinishFailed={(errorInfo) =>
            notifyFormValidationError(form, message, errorInfo, 'Lengkapi data antrian terlebih dahulu.')
          }
        >
          <Form.Item
            name="visitDate"
            label="Tanggal Kunjungan"
            rules={[{ required: true, message: 'Tanggal wajib diisi' }]}
          >
            <DatePicker allowClear={false} style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item name="poliId" label="Poli" rules={[{ required: true, message: 'Pilih poli' }]}>
            <Select
              placeholder="Pilih Poli"
              showSearch
              optionFilterProp="label"
              options={poliOptions}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="doctorScheduleId"
            label="Dokter"
            rules={[{ required: true, message: 'Pilih dokter' }]}
          >
            <Select
              placeholder={
                !doctorQueryInput.date || !doctorQueryInput.poliId
                  ? 'Pilih tanggal dan poli terlebih dahulu'
                  : 'Pilih dokter'
              }
              showSearch
              optionFilterProp="label"
              options={doctorOptions}
              loading={doctorsQuery.isLoading || doctorsQuery.isRefetching}
              disabled={!doctorQueryInput.date || !doctorQueryInput.poliId}
              size="large"
            />
          </Form.Item>

          <Form.Item name="memberCardNumber" label="Nomor Kartu Anggota (Opsional)">
            <Input
              placeholder="Scan atau masukkan nomor kartu"
              addonAfter={
                <Button
                  type="text"
                  icon={<BarcodeOutlined />}
                  onClick={handleDummyScanBarcode}
                  className="px-0"
                >
                  Scan Dummy
                </Button>
              }
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={createQueue.isPending}>
              Ambil Antrian
            </Button>
            <Typography.Text type="secondary">
              {doctorsQuery.isLoading
                ? 'Memuat jadwal dokter...'
                : availableDoctors.length
                  ? `Dokter tersedia: ${availableDoctors.length}`
                  : 'Belum ada dokter tersedia untuk kombinasi tanggal/poli ini'}
            </Typography.Text>
          </Space>
        </Form>

        {lastQueue && (
          <div className="mt-4">
            <Card className="mt-4" size="small" title="Antrian Terakhir">
              <Typography.Paragraph className="mb-1">
                Nomor:{' '}
                <strong>{lastQueue.formattedQueueNumber || lastQueue.queueNumber || '-'}</strong>
              </Typography.Paragraph>
              <Typography.Paragraph className="mb-0">
                Tanggal: {lastQueue.queueDate || dayjs().format('YYYY-MM-DD')}
              </Typography.Paragraph>
            </Card>
          </div>
        )}
      </Card>
    </div>
  )
}
