import { Button, Form, Input, Select, DatePicker } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'

interface AssetMovementPayload {
  assetId: number
  fromLocationId?: number | null
  toLocationId: number
  movedAt: string
  reason?: string | null
  approvedBy?: number | null
}

export function AssetMovementForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm<AssetMovementPayload>()
  const { data: assets } = useQuery({ queryKey: ['asset', 'list'], queryFn: () => window.api?.query?.asset?.list?.() as any })
  const { data: locations } = useQuery({ queryKey: ['departemen', 'list'], queryFn: () => window.api?.query?.departemen?.list?.() as any })
  const createMutation = useMutation({
    mutationKey: ['assetMovement', 'create'],
    mutationFn: (payload: AssetMovementPayload) => {
      const fn = window.api?.query?.assetMovement?.create
      if (!fn) throw new Error('API assetMovement tidak tersedia.')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetMovement', 'list'] })
      navigate('/dashboard/asset/movement')
    }
  })

  const assetOptions = (assets?.result || []).map((a) => ({ label: a.assetCode, value: a.id }))
  const locationOptions = (locations?.result || []).map((l) => ({ label: l.nama, value: l.id }))

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tambah Perpindahan Aset</h2>
      <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
        <Form.Item name="assetId" label="Aset" rules={[{ required: true }]}> 
          <Select options={assetOptions} showSearch />
        </Form.Item>
        <Form.Item name="fromLocationId" label="Dari"> 
          <Select options={locationOptions} showSearch />
        </Form.Item>
        <Form.Item name="toLocationId" label="Ke" rules={[{ required: true }]}> 
          <Select options={locationOptions} showSearch />
        </Form.Item>
        <Form.Item name="movedAt" label="Tanggal" rules={[{ required: true }]}> 
          <DatePicker style={{ width: '100%' }} onChange={(d) => form.setFieldValue('movedAt', d ? dayjs(d).toISOString() : '')} />
        </Form.Item>
        <Form.Item name="reason" label="Alasan"> 
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Simpan</Button>
          <Button className="ml-2" onClick={() => navigate('/dashboard/asset/movement')}>Batal</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AssetMovementForm

