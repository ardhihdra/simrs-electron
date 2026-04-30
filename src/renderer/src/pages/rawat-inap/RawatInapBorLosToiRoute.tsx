import { Alert } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'

import { client } from '../../utils/client'
import { RawatInapBorLosToiPage } from './RawatInapBorLosToiPage'

type DateRangeValue = [Dayjs, Dayjs]

export default function RawatInapBorLosToiRoute() {
  const [range, setRange] = useState<DateRangeValue>([dayjs().startOf('month'), dayjs()])
  const queryInput = {
    fromDate: range[0].format('YYYY-MM-DD'),
    toDate: range[1].format('YYYY-MM-DD')
  }
  const reportQuery = client.inpatientReporting.getBorLosToiReport.useQuery(queryInput, {
    queryKey: ['inpatientReporting.getBorLosToiReport', queryInput]
  })

  return (
    <div>
      {reportQuery.isError ? (
        <div className="p-[16px]">
          <Alert
            type="warning"
            showIcon
            message="Laporan BOR / LOS / TOI belum bisa dimuat"
            description={reportQuery.error?.message ?? 'Terjadi kesalahan saat memuat laporan.'}
          />
        </div>
      ) : null}
      <RawatInapBorLosToiPage
        report={reportQuery.data ?? null}
        loading={reportQuery.isLoading || reportQuery.isRefetching}
        initialRange={range}
        onFilter={setRange}
        onRefresh={() => void reportQuery.refetch()}
      />
    </div>
  )
}
