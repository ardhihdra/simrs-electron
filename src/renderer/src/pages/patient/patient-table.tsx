import { client } from '@renderer/utils/client'

export function PatientTable() {
  const data = client.patient.list.useQuery({
    page: 1
  })
  return (
    <div>
      {data.data?.result?.map((item) => (
        <div key={item.id}>
          {item.medicalRecordNumber} - {item.name}
        </div>
      ))}
    </div>
  )
}

export default PatientTable
