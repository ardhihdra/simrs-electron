import type { PractitionerListInput } from '@main/rpc/procedure/practitioner'
import { client } from '@renderer/utils/client'
import { Form, Select } from 'antd'

export default function PractitionerSelector() {
  const input: PractitionerListInput = { hakAksesId: 'nurse' }
  const { data, isLoading } = client.practitioner.list.useQuery(input)

  const practitioners = (data as any)?.result || []

  return (
    <Form.Item
      name="practitionerId"
      label="Pilih Petugas"
      rules={[{ required: true, message: 'Please select a practitioner' }]}
    >
      <Select
        placeholder="Pilih Petugas"
        loading={isLoading}
        showSearch
        optionFilterProp="children"
      >
        {practitioners.map((practitioner: any) => (
          <Select.Option key={practitioner.id} value={practitioner.id}>
            {practitioner.name || practitioner.namaLengkap}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  )
}
