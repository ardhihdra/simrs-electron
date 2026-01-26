import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { CallingSection } from './CallingSection'
import { WaitingSection } from './WaitingSection'

export default function EncounterMonitor() {
  const startDate = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Start of today
    return now.toISOString()
  }, [])
  const queueList = useQuery({
    queryKey: ['queue', 'list'],
    queryFn: async () => {
      const fn = window.api.query.queueticket.list
      if (!fn) {
        throw new Error('Failed to load data')
      }
      return fn({
        startDate: startDate
      })
    },
    refetchInterval: 5000,
    staleTime: 5000
  })

  return (
    <div className="flex flex-col gap-6">
      <CallingSection tickets={queueList.data?.data || []} />
      <WaitingSection tickets={queueList.data?.data || []} />
    </div>
  )
}
