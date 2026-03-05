import { Button, Card, DatePicker, Form, Input, Select, Tag } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
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

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header Card */}
      <Card bodyStyle={{ padding: '20px 24px' }} className="border-none">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard/registration/doctor-leave')}
                className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm"
              >
                <ArrowLeftOutlined />
                <span>Daftar Cuti/Libur Dokter</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold mb-0">
              {isEdit ? 'Edit Cuti Dokter' : 'Tambah Cuti Dokter'}
            </h1>
            <p className="text-sm text-gray-400 m-0">
              {isEdit
                ? 'Perbarui data cuti atau hari libur dokter'
                : 'Isi formulir berikut untuk mencatat cuti atau hari libur dokter'}
            </p>
          </div>
          <Tag color={isEdit ? 'blue' : 'green'} className="px-3 py-1 text-sm m-0">
            {isEdit ? 'Mode Edit' : 'Data Baru'}
          </Tag>
        </div>
      </Card>

      {/* Form Card */}
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ status: 'active' }}>
        <Card bodyStyle={{ padding: '20px 24px' }} className="border-none" title="Informasi Cuti">
          <Form.Item
            label={<span className="font-medium">Nama Dokter</span>}
            name="idPegawai"
            rules={[{ required: true, message: 'Nama dokter harus diisi' }]}
          >
            <Select
              placeholder="Pilih nama dokter"
              showSearch
              optionFilterProp="children"
              loading={!pegawaiData}
              size="large"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label={<span className="font-medium">Tanggal Mulai</span>}
              name="tanggalMulai"
              rules={[{ required: true, message: 'Tanggal mulai harus diisi' }]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Tanggal Selesai</span>}
              name="tanggalSelesai"
              rules={[{ required: true, message: 'Tanggal selesai harus diisi' }]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" size="large" />
            </Form.Item>
          </div>

          <Form.Item label={<span className="font-medium">Keterangan</span>} name="keterangan">
            <Input.TextArea rows={4} placeholder="Alasan cuti atau keterangan tambahan..." />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium">Status</span>}
            name="status"
            rules={[{ required: true, message: 'Status harus dipilih' }]}
          >
            <Select placeholder="Pilih status" size="large">
              <Select.Option value="active">Aktif</Select.Option>
              <Select.Option value="cancelled">Dibatalkan</Select.Option>
            </Select>
          </Form.Item>
        </Card>

        {/* Action Buttons Card */}
        <Card bodyStyle={{ padding: '16px 24px' }} className="border-none mt-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              size="large"
              onClick={() => navigate('/dashboard/registration/doctor-leave')}
              icon={<ArrowLeftOutlined />}
            >
              Batal
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isLoading}
              icon={<SaveOutlined />}
            >
              {isEdit ? 'Update Cuti' : 'Simpan Cuti'}
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  )
}
