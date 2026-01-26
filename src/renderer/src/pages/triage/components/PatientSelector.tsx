import { client } from '@renderer/utils/client'
import { Form, Select } from 'antd'

export default function PatientSelector() {
  const form = Form.useFormInstance()
  const encounterId = Form.useWatch('encounterId', form)

  const { data: listData, isLoading: listLoading } = client.encounter.list.useQuery({
    status: 'PLANNED',
    depth: 1
  })

  // Also fetch the specific encounter if we have an ID, to ensure it's in the list
  const { data: specificEncounterData, isLoading: specificLoading } =
    client.encounter.list.useQuery(
      {
        id: encounterId,
        depth: 1
      },
      {
        enabled: !!encounterId,
        queryKey: ['encounter', encounterId]
      }
    )

  const encounters = (listData as any)?.result || []
  const specificEncounter = (specificEncounterData as any)?.result?.[0]

  // Combine lists, removing duplicates
  const allEncounters = [...encounters]
  if (specificEncounter && !allEncounters.find((e) => e.id === specificEncounter.id)) {
    allEncounters.push(specificEncounter)
  }

  const isLoading = listLoading || (!!encounterId && specificLoading)

  return (
    <Form.Item
      name="encounterId"
      label="Pilih Pasien"
      rules={[{ required: true, message: 'Please select a patient encounter' }]}
    >
      <Select
        placeholder="Select from Checked In Patients"
        loading={isLoading}
        showSearch
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
        }
      >
        {allEncounters.map((encounter: any) => {
          const patientName = encounter?.patient?.name || 'Unknown Patient'
          const encounterDate = encounter?.createdAt
            ? new Date(encounter.createdAt).toLocaleString()
            : ''
          return (
            <Select.Option key={encounter.id} value={encounter.id}>
              {`${patientName} - ${encounterDate}`}
            </Select.Option>
          )
        })}
      </Select>
    </Form.Item>
  )
}
