import { Form, Input, Button, DatePicker, Select, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { PatientAttributes } from '@shared/patient'
import dayjs, { type Dayjs } from 'dayjs'

type PatientFormValues = Omit<PatientAttributes, 'birthDate'> & { birthDate: Dayjs }

function PatientForm() {
  const [form] = Form.useForm<PatientFormValues>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const params = useParams<{ id: string }>()
  const isEdit = !!params.id

  const detail = useQuery({
    queryKey: ['patient', 'detail', params.id],
    queryFn: () => {
      const fn = window.api?.query?.patient?.getById
      if (!fn || !params.id) throw new Error('API patient tidak tersedia')
      return fn({ id: Number(params.id) })
    },
    enabled: isEdit
  })

  useEffect(() => {
    const item = detail.data?.data as Partial<PatientAttributes> | undefined
    if (item) {
      form.setFieldsValue({
        kode: item.kode,
        identifier: item.identifier ?? undefined,
        name: item.name,
        gender: item.gender,
        birthDate: item.birthDate ? dayjs(item.birthDate as unknown as string) : undefined,
        placeOfBirth: item.placeOfBirth ?? undefined,
        phone: item.phone ?? undefined,
        email: item.email ?? undefined,
        addressLine: item.addressLine ?? undefined,
        province: item.province ?? undefined,
        city: item.city ?? undefined,
        district: item.district ?? undefined,
        village: item.village ?? undefined,
        postalCode: item.postalCode ?? undefined,
        country: item.country ?? undefined,
        maritalStatus: item.maritalStatus ?? undefined
      })
    }
  }, [detail.data, form])

  const createMutation = useMutation({
    mutationKey: ['patient', 'create'],
    mutationFn: async (payload: PatientAttributes) => {
      const createFn = window.api?.query?.patient?.create
      if (!createFn) {
        throw new Error('API patient tidak tersedia. Silakan restart aplikasi/dev server.')
      }
      const result = await createFn(payload)
      if (!result.success) throw new Error(result.error || 'Failed to create patient')
      return result
    },
    onSuccess: () => {
      message.success('Pasien berhasil disimpan')
      form.resetFields()
      navigate('/dashboard/patient')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['patient', 'update'],
    mutationFn: async (payload: PatientAttributes & { id: number }) => {
      const updateFn = window.api?.query?.patient?.update
      if (!updateFn) throw new Error('API patient tidak tersedia')
      const result = await updateFn({ ...payload, id: payload.id })
      if (!result.success) throw new Error(result.error || 'Failed to update patient')
      return result
    },
    onSuccess: () => {
      message.success('Pasien berhasil diperbarui')
      navigate('/dashboard/patient')
    }
  })

  const onFinish = async (values: PatientFormValues) => {
    try {
      setSubmitting(true)
      const payload: PatientAttributes = {
        active: values.active ?? true,
        identifier: values.identifier ?? null,
        kode: values.kode,
        name: values.name,
        gender: values.gender,
        birthDate: values.birthDate.toDate(),
        placeOfBirth: values.placeOfBirth ?? null,
        phone: values.phone ?? null,
        email: values.email ?? null,
        addressLine: values.addressLine ?? null,
        province: values.province ?? null,
        city: values.city ?? null,
        district: values.district ?? null,
        village: values.village ?? null,
        postalCode: values.postalCode ?? null,
        country: values.country ?? null,
        maritalStatus: values.maritalStatus ?? null
      }
      if (isEdit && params.id) {
        await updateMutation.mutateAsync({ ...payload, id: Number(params.id) })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="my-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="w-full"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Kode" name="kode" rules={[{ required: true, message: 'Kode wajib' }]}>
            <Input placeholder="Kode pasien" />
          </Form.Item>
          <Form.Item label="NIK" name="identifier" rules={[{ required: true, message: 'NIK wajib' }]}>
            <Input placeholder="Nomor Induk Kependudukan" />
          </Form.Item>
          <Form.Item label="Nama" name="name" rules={[{ required: true, message: 'Nama wajib' }]}>
            <Input placeholder="Nama pasien" />
          </Form.Item>
          <Form.Item label="Gender" name="gender" rules={[{ required: true, message: 'Pilih gender' }]}>
            <Select placeholder="Pilih gender">
              <Select.Option value="male">Laki-laki</Select.Option>
              <Select.Option value="female">Perempuan</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Tanggal Lahir" name="birthDate" rules={[{ required: true, message: 'Tanggal lahir wajib' }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item label="Tempat Lahir" name="placeOfBirth">
            <Input placeholder="Tempat lahir" />
          </Form.Item>
          <Form.Item label="Nomor Telepon" name="phone">
            <Input placeholder="Nomor telepon" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="Alamat" name="addressLine">
            <Input placeholder="Alamat" />
          </Form.Item>
          <Form.Item label="Desa" name="village">
            <Input placeholder="Desa" />
          </Form.Item>
          <Form.Item label="Kecamatan" name="district">
            <Input placeholder="Kecamatan" />
          </Form.Item>
          <Form.Item label="Kota" name="city">
            <Input placeholder="Kota" />
          </Form.Item>
          <Form.Item label="Provinsi" name="province">
            <Input placeholder="Provinsi" />
          </Form.Item>
          <Form.Item label="Kode Pos" name="postalCode">
            <Input placeholder="Kode pos" />
          </Form.Item>
          <Form.Item label="Negara" name="country">
            <Input placeholder="Negara" />
          </Form.Item>
          <Form.Item label="Status Pernikahan" name="maritalStatus" rules={[{ required: true, message: 'Pilih status pernikahan' }]}>
            <Select placeholder="Pilih status pernikahan">
              <Select.Option value="single">Belum menikah</Select.Option>
              <Select.Option value="married">Menikah</Select.Option>
              <Select.Option value="divorced">Cerai</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item className="text-right">
          <Button type="primary" htmlType="submit" className="mr-2" loading={submitting}>
            {isEdit ? 'Update' : 'Simpan'}
          </Button>
          <Button
            htmlType="button"
            onClick={() => {
              form.resetFields()
              navigate('/dashboard/patient')
            }}
          >
            Batal
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default PatientForm
