import { Button, Form, Input, Select, DatePicker, InputNumber } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'

interface AssetMaintenancePayload {
  assetId: number
  type: 'PREVENTIVE' | 'REPAIR' | 'CALIBRATION'
  vendor?: string | null
  scheduleDate?: string | null
  actualDate?: string | null
  cost?: number | null
  nextDueDate?: string | null
  documentUrl?: string | null
}

export function AssetMaintenanceForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm<AssetMaintenancePayload>()
  const { data: assets } = useQuery({ queryKey: ['asset', 'list'], queryFn: () => window.api?.query?.asset?.list?.() as any })
  const createMutation = useMutation({
    mutationKey: ['assetMaintenance', 'create'],
    mutationFn: (payload: AssetMaintenancePayload) => {
      const fn = window.api?.query?.assetMaintenance?.create
      if (!fn) throw new Error('API assetMaintenance tidak tersedia.')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetMaintenance', 'list'] })
      navigate('/dashboard/asset/maintenance')
    }
  })

  const assetOptions = (assets?.result || []).map((a) => ({ label: a.assetCode, value: a.id }))

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tambah Pemeliharaan/Kalibrasi</h2>
      <Form form={form} layout="vertical" onFinish={(values) => createMutation.mutate(values)}>
        <Form.Item name="assetId" label="Aset" rules={[{ required: true }]}> 
          <Select options={assetOptions} showSearch />
        </Form.Item>
        <Form.Item name="type" label="Tipe" rules={[{ required: true }]}> 
          <Select options={[{ label: 'Preventive', value: 'PREVENTIVE' }, { label: 'Repair', value: 'REPAIR' }, { label: 'Calibration', value: 'CALIBRATION' }]} />
        </Form.Item>
        <Form.Item name="vendor" label="Vendor"> 
          <Input />
        </Form.Item>
        <Form.Item name="scheduleDate" label="Jadwal"> 
          <DatePicker style={{ width: '100%' }} onChange={(d) => form.setFieldValue('scheduleDate', d ? dayjs(d).toISOString() : null)} />
        </Form.Item>
        <Form.Item name="actualDate" label="Tanggal Realisasi"> 
          <DatePicker style={{ width: '100%' }} onChange={(d) => form.setFieldValue('actualDate', d ? dayjs(d).toISOString() : null)} />
        </Form.Item>
        <Form.Item name="cost" label="Biaya"> 
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="nextDueDate" label="Jatuh Tempo Berikutnya"> 
          <DatePicker style={{ width: '100%' }} onChange={(d) => form.setFieldValue('nextDueDate', d ? dayjs(d).toISOString() : null)} />
        </Form.Item>
        <Form.Item name="documentUrl" label="Dokumen"> 
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Simpan</Button>
          <Button className="ml-2" onClick={() => navigate('/dashboard/asset/maintenance')}>Batal</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AssetMaintenanceForm

