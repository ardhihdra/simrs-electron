import { Card } from 'antd'
import { useState } from 'react'
import { SelectPoli } from '@renderer/components/molecules/SelectPoli'
import { EncounterListResult } from '@shared/encounter'

import { useEncounterMonitor } from '@renderer/hooks/query/use-encounter'

export default function EncounterMonitor() {
  const { data } = useEncounterMonitor()

  const [filterService, setFilterService] = useState<string | undefined>(undefined)

  const filteredData = data?.data?.filter((item) =>
    !filterService || (item.serviceType && item.serviceType === filterService)
  )

  const grouped = filteredData?.reduce((acc, item) => {
    const key = item.serviceType || 'Unassigned'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, NonNullable<EncounterListResult['data']>>)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold">Monitor Kunjungan</h2>
        <SelectPoli
          valueType="name"
          placeholder="Filter Layanan"
          allowClear
          value={filterService}
          onChange={(val) => setFilterService(val as string)}
          className="w-full md:w-1/3"
        />
      </div>
      {grouped && Object.entries(grouped).map(([service, items]) => (
        <div key={service}>
          <h2 className="text-2xl font-bold mb-4 capitalize border-b pb-2">{service}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="p-4 aspect-square flex flex-col items-center justify-center text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-sm text-gray-500">{(item as any)?.encounterCode || 'N/A'}</div>
                <div className="text-xl font-semibold capitalize mb-2">{item.patient?.name}</div>
                <div className="text-sm text-gray-500">
                  {new Date(item.visitDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  <br />
                  <span className="text-lg font-bold text-blue-600">
                    {new Date(item.visitDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${item.status === 'finished' ? 'bg-green-100 text-green-800' :
                  item.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                  {item.status}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
      {(!grouped || Object.keys(grouped).length === 0) && (
        <div className="text-center text-gray-400 py-10">
          Belum ada data kunjungan
        </div>
      )}
    </div>
  )
}
