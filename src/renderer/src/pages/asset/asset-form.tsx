import { Button, Form, Input, Select, DatePicker, InputNumber } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'

type AssetStatus = 'REGISTERED' | 'IN_USE' | 'MAINTENANCE' | 'BROKEN' | 'DISPOSED'
type AssetCondition = 'GOOD' | 'FAIR' | 'POOR'

interface AssetPayload {
  assetCode: string
  assetMasterId: number
  serialNumber?: string | null
  purchaseDate?: string | null
  purchasePrice?: number | null
  fundingSource?: 'BLUD' | 'APBN' | 'HIBAH' | null
  currentLocationId?: number | null
  status: AssetStatus
  condition: AssetCondition
}

export function AssetForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm<AssetPayload>()
  const { data: masters } = useQuery({
    queryKey: ['assetMaster', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.assetMaster?.list
      if (!fn) throw new Error('API assetMaster tidak tersedia.')
      return fn()
    }
  })
  const { data: locations } = useQuery({
    queryKey: ['departemen', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.departemen?.list
      if (!fn) throw new Error('API departemen tidak tersedia.')
      return fn()
    }
  })
  const createMutation = useMutation({
    mutationKey: ['asset', 'create'],
    mutationFn: (payload: AssetPayload) => {
      const fn = window.api?.query?.asset?.create
      if (!fn) throw new Error('API asset tidak tersedia.')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', 'list'] })
      navigate('/dashboard/asset/register')
    }
  })

  const masterOptions = (masters?.result || []).map((m) => ({ label: m.name, value: m.id }))
  const locationOptions = (locations?.result || []).map((l) => ({ label: l.nama, value: l.id }))

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tambah Aset</h2>
      <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
        <Form.Item name="assetCode" label="Kode Aset" rules={[{ required: true }]}> 
          <Input />
        </Form.Item>
        <Form.Item name="assetMasterId" label="Master Aset" rules={[{ required: true }]}> 
          <Select options={masterOptions} showSearch />
        </Form.Item>
        <Form.Item name="serialNumber" label="Serial"> 
          <Input />
        </Form.Item>
        <Form.Item name="purchaseDate" label="Tanggal Pembelian"> 
          <DatePicker style={{ width: '100%' }} onChange={(d) => form.setFieldValue('purchaseDate', d ? dayjs(d).toISOString() : null)} />
        </Form.Item>
        <Form.Item name="purchasePrice" label="Harga Pembelian"> 
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="fundingSource" label="Sumber Dana"> 
          <Select options={[{ label: 'BLUD', value: 'BLUD' }, { label: 'APBN', value: 'APBN' }, { label: 'Hibah', value: 'HIBAH' }]} />
        </Form.Item>
        <Form.Item name="currentLocationId" label="Lokasi Saat Ini"> 
          <Select options={locationOptions} showSearch />
        </Form.Item>
        <Form.Item name="status" label="Status" initialValue="REGISTERED" rules={[{ required: true }]}> 
          <Select options={[{ label: 'REGISTERED', value: 'REGISTERED' }, { label: 'IN_USE', value: 'IN_USE' }, { label: 'MAINTENANCE', value: 'MAINTENANCE' }, { label: 'BROKEN', value: 'BROKEN' }, { label: 'DISPOSED', value: 'DISPOSED' }]} />
        </Form.Item>
        <Form.Item name="condition" label="Kondisi" initialValue="GOOD" rules={[{ required: true }]}> 
          <Select options={[{ label: 'GOOD', value: 'GOOD' }, { label: 'FAIR', value: 'FAIR' }, { label: 'POOR', value: 'POOR' }]} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Simpan</Button>
          <Button className="ml-2" onClick={() => navigate('/dashboard/asset/register')}>Batal</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AssetForm

