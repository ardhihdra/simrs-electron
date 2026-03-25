import { client } from '@renderer/utils/client'
import { App, DatePicker, Form, Input, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'

interface ReferralModalProps {
  open: boolean
  record?: any
  practitionerId?: string | number
  onClose: () => void
  onSuccess: () => void
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
  const referMutation = client.registration.referPatient.useMutation()

  const referralType = Form.useWatch('referralType', form)
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

  const allSchedulesQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: referralDate ? dayjs(referralDate).format('YYYY-MM-DD') : undefined
    },
    {
      enabled: referralType === 'internal' && !!referralDate,
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
      enabled: referralType === 'internal' && !!referralDate && !!targetPoliId,
      queryKey: ['availableDoctors_referral', { date: referralDate, poliId: targetPoliId }]
    }
  )

  const internalDoctorOptions = useMemo(() => {
    const data = internalDoctorsQuery.data as any
    const doctors = data?.result?.doctors || data?.data?.doctors || data?.doctors || []
    return doctors.map((d: any) => ({
      value: d.doctorScheduleId,
      label: `${d.doctorName}${d.timeSlot ? ` (${d.timeSlot.startTime} - ${d.timeSlot.endTime})` : ''}`
    }))
  }, [internalDoctorsQuery.data])

  const handleOk = () => {
    form.submit()
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  const handleFinish = async (values: any) => {
    try {
      await referMutation.mutateAsync({
        encounterId: record?.encounterId,
        referringPractitionerId: Number(practitionerId),
        referringPractitionerName: 'Petugas Pendaftaran',
        direction: 'outgoing',
        referralType: values.referralType,
        referralDate: values.date ? values.date.toISOString() : new Date().toISOString(),
        diagnosisCode: values.diagnosisCode,
        diagnosisText: values.diagnosisText,
        keadaanKirim: values.keadaanKirim,
        reasonForReferral: values.reasonForReferral,
        targetOrganizationName:
          values.referralType === 'internal' ? 'RS Internal' : values.targetOrganizationName,
        targetDepartemenId:
          values.referralType === 'internal' ? Number(values.targetDepartemenId) : undefined,
        doctorScheduleId:
          values.referralType === 'internal' ? values.doctorScheduleId : undefined,
        targetPractitionerName:
          values.referralType === 'external' ? values.targetPractitionerName : undefined
      })
      message.success('Pasien berhasil dirujuk')
      form.resetFields()
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
        initialValues={{ referralType: 'internal' }}
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
