import type { PractitionerListInput } from '@main/rpc/procedure/practitioner'
import { client } from '@renderer/utils/client'
import { Form, Select } from 'antd'
import { useEffect, useState, useMemo } from 'react'

export default function PractitionerSelector() {
  const form = Form.useFormInstance()
  const [session, setSession] = useState<any>(null)
  
  const input: PractitionerListInput = { hakAksesId: 'nurse' }
  const { data, isLoading } = client.practitioner.list.useQuery(input)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await window.api.auth.getSession()
        if (res.success && res.user) {
            setSession(res.user)
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  const practitioners = useMemo(() => {
    return (data as any)?.result || []
  }, [data])

  useEffect(() => {
    if (session && practitioners.length > 0) {
        // Try to find practitioner matching current user
        // Assuming user.id maps to practitioner.id or some field
        // For now, let's select if the ID matches
        const match = practitioners.find(p => p.id === session.id || p.userId === session.id)
        if (match) {
            form.setFieldsValue({ practitionerId: match.id })
        } else if (session.hakAksesId === 'nurse') {
             // do nothing
        }
    }
  }, [session, practitioners, form])


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
