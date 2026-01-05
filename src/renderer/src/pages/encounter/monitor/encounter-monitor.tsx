import { useQuery } from '@tanstack/react-query'
import { EncounterListResult } from '@renderer/pages/encounter/encounter-table'
import { Card } from 'antd'

export default function EncounterMonitor() {
  const { data } = useQuery<EncounterListResult>({
    queryKey: ['encounter', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })
  return (
    <div className="grid grid-cols-6 gap-2">
      {data?.data &&
        data.data.map((item) => (
          <Card
            key={item.id}
            className="p-4 aspect-square flex flex-col items-center justify-center"
          >
            <div className="text-xl font-semibold capitalize">{item.patient?.name}</div>
            <div className="text-sm text-gray-500">
              {new Date(item.visitDate).toLocaleDateString()} <br />
              {new Date(item.visitDate).toLocaleTimeString()}
            </div>
          </Card>
        ))}
    </div>
  )
}
