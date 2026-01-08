import { Button, Form, Input } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'

interface FormData { nama: string; kode: string; noHp: string; alamat?: string | null; note?: string | null }

type SupplierApi = {
  read: (args: { id: number }) => Promise<{ success: boolean; result?: { nama: string; kode: string; noHp: string; alamat?: string | null; note?: string | null }; message?: string }>
  create: (data: FormData) => Promise<{ success: boolean; result?: { id?: number } & FormData; message?: string }>
  update: (data: FormData & { id: number }) => Promise<{ success: boolean; result?: { id?: number } & FormData; message?: string }>
}

export function SupplierForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = Boolean(id)
  const api = (window.api?.query as { suplier?: SupplierApi }).suplier

  const { data: detailData } = useQuery({
    queryKey: ['suplier', 'detail', id],
    queryFn: () => {
      const fn = api?.read
      if (!fn) throw new Error('API pemasok tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result as { nama: string; kode: string; noHp: string; alamat?: string | null; note?: string | null }
      form.setFieldsValue({ nama: data.nama, kode: data.kode, noHp: data.noHp, alamat: data.alamat ?? '', note: data.note ?? '' })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['suplier', 'create'],
    mutationFn: (data: FormData) => {
      const fn = api?.create
      if (!fn) throw new Error('API pemasok tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suplier', 'list'] })
      navigate('/dashboard/farmasi/suppliers')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['suplier', 'update'],
    mutationFn: (data: FormData & { id: number }) => {
      const fn = api?.update
      if (!fn) throw new Error('API pemasok tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suplier', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['suplier', 'detail', id] })
      navigate('/dashboard/farmasi/suppliers')
    }
  })

  const onFinish = (values: FormData) => {
    const payload = { ...values, alamat: values.alamat?.trim() || null, note: values.note?.trim() || null }
    if (isEdit) updateMutation.mutate({ ...payload, id: Number(id) })
    else createMutation.mutate(payload)
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">{isEdit ? 'Edit Pemasok' : 'Pemasok Baru'}</h2>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item label="Nama" name="nama" rules={[{ required: true, message: 'Nama harus diisi' }]}> 
            <Input placeholder="Contoh: PT Pemasok Farma" />
          </Form.Item>
          <Form.Item label="Kode" name="kode" rules={[{ required: true, message: 'Kode harus diisi' }]}> 
            <Input placeholder="Contoh: SUP01" />
          </Form.Item>
          <Form.Item label="No HP" name="noHp" rules={[{ required: true, message: 'No HP harus diisi' }]}> 
            <Input placeholder="08xxxxxxxxxx" />
          </Form.Item>
          <Form.Item label="Alamat" name="alamat"> 
            <Input.TextArea rows={3} placeholder="Opsional" />
          </Form.Item>
          <Form.Item label="Catatan" name="note"> 
            <Input.TextArea rows={3} placeholder="Opsional" />
          </Form.Item>
          <Form.Item>
            <div className="flex gap-2 justify-center">
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>{isEdit ? 'Update' : 'Simpan'}</Button>
              <Button onClick={() => navigate('/dashboard/farmasi/suppliers')}>Batal</Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default SupplierForm
