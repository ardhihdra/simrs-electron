import { Button, DatePicker, Form, Input, Select } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'

interface DoctorLeaveFormData {
  idPegawai: number
  tanggalMulai: Date
  tanggalSelesai: Date
  keterangan: string
  status: 'active' | 'cancelled'
}

export default function DoctorLeaveForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const isEdit = Boolean(id)

  const { data: detailData } = useQuery({
    queryKey: ['doctorLeave', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.doctorLeave?.getById
      if (!fn) throw new Error('API doctorLeave not found')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  const { data: pegawaiData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      return fn()
    }
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result
      form.setFieldsValue({
        idPegawai: data.idPegawai,
        tanggalMulai: dayjs(data.tanggalMulai),
        tanggalSelesai: dayjs(data.tanggalSelesai),
        keterangan: data.keterangan,
        status: data.status
      })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['doctorLeave', 'create'],
    mutationFn: (data: DoctorLeaveFormData) => {
      const fn = window.api?.query?.doctorLeave?.create
      if (!fn) throw new Error('API doctorLeave not found')

      const payload = {
        ...data,
        tanggalMulai: dayjs(data.tanggalMulai).format('YYYY-MM-DD'),
        tanggalSelesai: dayjs(data.tanggalSelesai).format('YYYY-MM-DD')
      }
      return fn(payload)
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['doctorLeave', 'list'] })
        navigate('/dashboard/registration/doctor-leave')
      } else {
        alert(data?.message || 'Gagal membuat cuti dokter')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat membuat cuti dokter')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['doctorLeave', 'update'],
    mutationFn: (data: DoctorLeaveFormData) => {
      const fn = window.api?.query?.doctorLeave?.update
      if (!fn) throw new Error('API doctorLeave not found')

      const payload = {
        id: Number(id),
        ...data,
        tanggalMulai: dayjs(data.tanggalMulai).format('YYYY-MM-DD'),
        tanggalSelesai: dayjs(data.tanggalSelesai).format('YYYY-MM-DD')
      }
      return fn(payload)
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['doctorLeave', 'list'] })
        navigate('/dashboard/registration/doctor-leave')
      } else {
        alert(data?.message || 'Gagal mengupdate cuti dokter')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat mengupdate cuti dokter')
    }
  })

  const onFinish = (values: DoctorLeaveFormData) => {
    if (isEdit) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isEdit ? 'Edit Cuti Dokter' : 'Tambah Cuti Dokter'}
        </h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: 'active'
          }}
        >
          <Form.Item
            label="Nama Dokter"
            name="idPegawai"
            rules={[{ required: true, message: 'Nama dokter harus diisi' }]}
          >
            <Select
              placeholder="Pilih nama dokter"
              showSearch
              optionFilterProp="children"
              loading={!pegawaiData}
            >
              {pegawaiData?.success &&
                pegawaiData.result?.map(
                  (pegawai: { email: string; id: number; namaLengkap: string }) => (
                    <Select.Option key={pegawai.id} value={pegawai.id}>
                      {pegawai.namaLengkap}
                    </Select.Option>
                  )
                )}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Tanggal Mulai"
              name="tanggalMulai"
              rules={[{ required: true, message: 'Tanggal mulai harus diisi' }]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" />
            </Form.Item>

            <Form.Item
              label="Tanggal Selesai"
              name="tanggalSelesai"
              rules={[{ required: true, message: 'Tanggal selesai harus diisi' }]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" />
            </Form.Item>
          </div>

          <Form.Item label="Keterangan" name="keterangan">
            <Input.TextArea rows={4} placeholder="Alasan cuti..." />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Status harus dipilih' }]}
          >
            <Select placeholder="Pilih status">
              <Select.Option value="active">Aktif</Select.Option>
              <Select.Option value="cancelled">Dibatalkan</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2 justify-center">
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? 'Update' : 'Simpan'}
              </Button>
              <Button onClick={() => navigate('/dashboard/registration/doctor-leave')}>
                Batal
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
