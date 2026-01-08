import type { KepegawaianAttributes } from '@shared/kepegawaian'
import { JenisKelaminEnum } from '@shared/kepegawaian'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, DatePicker, Form, Input, message, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

type ReadResult = { success: boolean; data?: KepegawaianAttributes; error?: string }
type CreateResult = { success: boolean; data?: KepegawaianAttributes; error?: string }
type UpdateResult = { success: boolean; data?: KepegawaianAttributes; error?: string }

type PegawaiFormValues = Omit<KepegawaianAttributes, 'tanggalLahir'> & { tanggalLahir: Dayjs }

function PegawaiForm() {
  const [form] = Form.useForm<PegawaiFormValues>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const params = useParams()
  const isEdit = typeof params.id === 'string'

  const detail = useQuery<ReadResult>({
    queryKey: ['pegawai', 'detail', params.id ?? 'new'],
    enabled: isEdit,
    queryFn: async () => {
      const fn = window.api?.query?.pegawai?.getById
      if (!fn || !isEdit) return { success: true, data: undefined }
      const id = Number(params.id)
      return fn({ id }) as Promise<ReadResult>
    }
  })

  useEffect(() => {
    const data = detail.data?.data
    if (data) {
      form.setFieldsValue({
        namaLengkap: data.namaLengkap,
        email: data.email,
        nik: data.nik,
        tanggalLahir: data.tanggalLahir ? dayjs(data.tanggalLahir as Date) : undefined,
        jenisKelamin: data.jenisKelamin,
        alamat: data.alamat ?? undefined,
        nomorTelepon: data.nomorTelepon ?? undefined,
        hakAkses: data.hakAkses ?? undefined
      })
    }
  }, [detail.data?.data])

  const createMutation = useMutation({
    mutationKey: ['pegawai', 'create'],
    mutationFn: async (payload: KepegawaianAttributes) => {
      const fn = window.api?.query?.pegawai?.create
      if (!fn) throw new Error('API pegawai tidak tersedia')
      return fn({
        namaLengkap: String(payload.namaLengkap),
        email: String(payload.email),
        nik: String(payload.nik),
        tanggalLahir: payload.tanggalLahir instanceof Date ? payload.tanggalLahir : new Date(String(payload.tanggalLahir)),
        jenisKelamin: payload.jenisKelamin,
        alamat: payload.alamat ?? null,
        nomorTelepon: payload.nomorTelepon ?? null,
        hakAkses: payload.hakAkses ?? null
      }) as Promise<CreateResult>
    },
    onSuccess: (res) => {
      if (!res.success) {
        message.error(res.error || 'Gagal menyimpan pegawai')
        return
      }
      message.success('Pegawai berhasil disimpan')
      navigate('/dashboard/pegawai')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['pegawai', 'update'],
    mutationFn: async (payload: KepegawaianAttributes & { id: number }) => {
      const fn = window.api?.query?.pegawai?.update
      if (!fn) throw new Error('API pegawai tidak tersedia')
      return fn({
        id: Number(payload.id),
        namaLengkap: payload.namaLengkap,
        email: payload.email,
        nik: payload.nik,
        tanggalLahir: payload.tanggalLahir,
        jenisKelamin: payload.jenisKelamin,
        alamat: payload.alamat ?? null,
        nomorTelepon: payload.nomorTelepon ?? null,
        hakAkses: payload.hakAkses ?? null
      }) as Promise<UpdateResult>
    },
    onSuccess: (res) => {
      if (!res.success) {
        message.error(res.error || 'Gagal memperbarui pegawai')
        return
      }
      message.success('Pegawai berhasil diperbarui')
      navigate('/dashboard/pegawai')
    }
  })

  const onFinish = async (values: PegawaiFormValues) => {
    try {
      setSubmitting(true)
      const payload: KepegawaianAttributes = {
        ...values,
        tanggalLahir: values.tanggalLahir.toDate()
      }
      if (isEdit && typeof detail.data?.data?.id === 'number') {
        await updateMutation.mutateAsync({ ...payload, id: detail.data!.data!.id! })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="my-4">
      <Form form={form} layout="vertical" onFinish={onFinish} className="w-full">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="Nama Lengkap" name="namaLengkap" rules={[{ required: true, message: 'Nama lengkap wajib' }]}>
            <Input placeholder="Nama Lengkap" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Email wajib' }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item label="NIK" name="nik" rules={[{ required: true, message: 'NIK wajib' }]}>
            <Input placeholder="NIK" />
          </Form.Item>
          <Form.Item label="Tanggal Lahir" name="tanggalLahir" rules={[{ required: true, message: 'Tanggal lahir wajib' }]}>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label="Jenis Kelamin" name="jenisKelamin" rules={[{ required: true, message: 'Jenis kelamin wajib' }]}>
            <Select placeholder="Pilih jenis kelamin">
              <Select.Option value={JenisKelaminEnum.Laki}>Laki-Laki</Select.Option>
              <Select.Option value={JenisKelaminEnum.Perempuan}>Perempuan</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Hak Akses" name="hakAkses">
            <Select placeholder="Pilih hak akses" allowClear>
              <Select.Option value="doctor">Dokter</Select.Option>
              <Select.Option value="nurse">Perawat</Select.Option>
              <Select.Option value="pharmacist">Apoteker</Select.Option>
              <Select.Option value="lab_technician">Lab</Select.Option>
              <Select.Option value="radiologist">Radiologi</Select.Option>
              <Select.Option value="administrator">Administrator</Select.Option>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="admin_backoffice">Admin Backoffice</Select.Option>
              <Select.Option value="operator_gudang">Operator Gudang</Select.Option>
              <Select.Option value="receptionist">Resepsionis</Select.Option>
              <Select.Option value="accountant">Akuntan</Select.Option>
              <Select.Option value="patient">Pasien</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Nomor Telepon" name="nomorTelepon">
            <Input placeholder="Nomor Telepon" />
          </Form.Item>
          <Form.Item label="Alamat" name="alamat">
            <Input placeholder="Alamat" />
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
              navigate('/dashboard/pegawai')
            }}
          >
            Batal
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default PegawaiForm
