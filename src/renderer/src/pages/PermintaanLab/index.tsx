import { client } from '@renderer/utils/client'
import { PermintaanLabTable } from './PermintaanLabTable'

export default function PermintaanLab() {
  const { data, isLoading } = client.laboratory.listOrder.useQuery({})
  const list = data?.success ? data.result : []

  return (
    <div>
      <PermintaanLabTable data={list} isLoading={isLoading} />
    </div>
  )
}
