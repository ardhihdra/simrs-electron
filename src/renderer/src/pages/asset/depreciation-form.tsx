import { Button, Form, Select, InputNumber } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'

interface AssetDepreciationPayload {
  assetId: number
  year: number
  bookValue: number
  depreciationValue: number
}

export function AssetDepreciationForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm<AssetDepreciationPayload>()
  const { data: assets } = useQuery({ queryKey: ['asset', 'list'], queryFn: () => window.api?.query?.asset?.list?.() as any })
  const createMutation = useMutation({
    mutationKey: ['assetDepreciation', 'create'],
    mutationFn: (payload: AssetDepreciationPayload) => {
      const fn = window.api?.query?.assetDepreciation?.create
      if (!fn) throw new Error('API assetDepreciation tidak tersedia.')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetDepreciation', 'list'] })
      navigate('/dashboard/asset/depreciation')
    }
  })

  const assetOptions = (assets?.result || []).map((a) => ({ label: a.assetCode, value: a.id }))

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tambah Depresiasi</h2>
      <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
        <Form.Item name="assetId" label="Aset" rules={[{ required: true }]}> 
          <Select options={assetOptions} showSearch />
        </Form.Item>
        <Form.Item name="year" label="Tahun" rules={[{ required: true }]}> 
          <InputNumber min={1900} max={3000} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="bookValue" label="Nilai Buku" rules={[{ required: true }]}> 
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="depreciationValue" label="Nilai Depresiasi" rules={[{ required: true }]}> 
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Simpan</Button>
          <Button className="ml-2" onClick={() => navigate('/dashboard/asset/depreciation')}>Batal</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AssetDepreciationForm

