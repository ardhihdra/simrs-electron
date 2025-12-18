import { Button, Form, Input, Select } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'

interface JaminanFormData {
  nama: string
  kode: string
  keterangan?: string
  status: 'active' | 'inactive'
}

export function JaminanForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const isEdit = Boolean(id)

  const { data: detailData } = useQuery({
    queryKey: ['jaminan', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.jaminan?.getById
      if (!fn) throw new Error('API jaminan tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result
      form.setFieldsValue({
        nama: data.nama,
        kode: data.kode,
        keterangan: data.keterangan,
        status: data.status
      })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['jaminan', 'create'],
    mutationFn: (data: JaminanFormData) => {
      const fn = window.api?.query?.jaminan?.create
      if (!fn) throw new Error('API jaminan tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn(data)
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['jaminan', 'list'] })
        navigate('/dashboard/registration/jaminan')
      } else {
        alert(data?.message || 'Gagal membuat jaminan')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat membuat jaminan')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['jaminan', 'update'],
    mutationFn: (data: JaminanFormData & { id: number }) => {
      const fn = window.api?.query?.jaminan?.update
      if (!fn) throw new Error('API jaminan tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn(data)
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['jaminan', 'list'] })
        queryClient.invalidateQueries({ queryKey: ['jaminan', 'detail', id] })
        navigate('/dashboard/registration/jaminan')
      } else {
        alert(data?.message || 'Gagal mengupdate jaminan')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat mengupdate jaminan')
    }
  })

  const onFinish = (values: JaminanFormData) => {
    if (isEdit) {
      updateMutation.mutate({ ...values, id: Number(id) })
    } else {
      createMutation.mutate(values)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isEdit ? 'Edit Jaminan' : 'Tambah Jaminan'}
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
            label="Kode Jaminan"
            name="kode"
            rules={[{ required: true, message: 'Kode jaminan harus diisi' }]}
          >
            <Input placeholder="Contoh: BPJS, ASWASTA" />
          </Form.Item>

          <Form.Item
            label="Nama Jaminan"
            name="nama"
            rules={[{ required: true, message: 'Nama jaminan harus diisi' }]}
          >
            <Input placeholder="Contoh: BPJS Kesehatan" />
          </Form.Item>

          <Form.Item label="Keterangan" name="keterangan">
            <Input.TextArea rows={3} placeholder="Keterangan tambahan (opsional)" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Status harus dipilih' }]}
          >
            <Select placeholder="Pilih status">
              <Select.Option value="active">Aktif</Select.Option>
              <Select.Option value="inactive">Tidak Aktif</Select.Option>
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
              <Button onClick={() => navigate('/dashboard/registration/jaminan')}>Batal</Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default JaminanForm
