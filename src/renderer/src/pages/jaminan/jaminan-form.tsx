import { Button, Card, Form, Input, Select, Tag, theme } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'

interface JaminanFormData {
  nama: string
  kode: string
  keterangan?: string
  status: 'active' | 'inactive'
}

export function JaminanForm() {
  const { token } = theme.useToken()
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

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header Card */}
      <Card bodyStyle={{ padding: '20px 24px' }} bordered={false}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard/registration/jaminan')}
                style={{ color: token.colorTextSecondary }}
                className="hover:opacity-80 transition-opacity bg-transparent border-none p-0 cursor-pointer flex items-center gap-1 text-sm font-medium"
              >
                <ArrowLeftOutlined />
                <span>Master Jaminan</span>
              </button>
            </div>
            <h1 style={{ color: token.colorText }} className="text-2xl font-bold mb-0">
              {isEdit ? 'Edit Jaminan' : 'Tambah Jaminan'}
            </h1>
            <p style={{ color: token.colorTextTertiary }} className="text-sm m-0">
              {isEdit
                ? 'Perbarui data jaminan atau asuransi pasien'
                : 'Isi formulir berikut untuk menambahkan data jaminan baru'}
            </p>
          </div>
          <Tag
            color={isEdit ? 'blue' : 'green'}
            className="px-3 py-1 text-sm m-0 border-0"
            style={{ fontWeight: 500 }}
          >
            {isEdit ? 'Mode Edit' : 'Data Baru'}
          </Tag>
        </div>
      </Card>

      {/* Form Card */}
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ status: 'active' }}>
        <Card bodyStyle={{ padding: '20px 24px' }} bordered={false} title="Informasi Jaminan">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              label={<span className="font-medium">Kode Jaminan</span>}
              name="kode"
              rules={[{ required: true, message: 'Kode jaminan harus diisi' }]}
            >
              <Input placeholder="Contoh: BPJS, ASWASTA" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Nama Jaminan</span>}
              name="nama"
              rules={[{ required: true, message: 'Nama jaminan harus diisi' }]}
            >
              <Input placeholder="Contoh: BPJS Kesehatan" size="large" />
            </Form.Item>
          </div>

          <Form.Item label={<span className="font-medium">Keterangan</span>} name="keterangan">
            <Input.TextArea rows={3} placeholder="Keterangan tambahan (opsional)" />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium">Status</span>}
            name="status"
            rules={[{ required: true, message: 'Status harus dipilih' }]}
          >
            <Select placeholder="Pilih status" size="large">
              <Select.Option value="active">Aktif</Select.Option>
              <Select.Option value="inactive">Tidak Aktif</Select.Option>
            </Select>
          </Form.Item>
        </Card>

        {/* Action Footer */}
        <Card bodyStyle={{ padding: '16px 24px' }} bordered={false} className="mt-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              size="large"
              onClick={() => navigate('/dashboard/registration/jaminan')}
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
              {isEdit ? 'Update Jaminan' : 'Simpan Jaminan'}
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  )
}

export default JaminanForm
