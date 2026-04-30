import React, { useState } from 'react'
import { App } from 'antd'

import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { client } from '../../utils/client'
import type { InpatientPatientListQuery } from '../../../../main/rpc/procedure/encounter.schemas'
import type { DesktopDispositionConfirmPayload } from '../../components/design-system/organisms/DesktopDispositionWorkflow'
import { RawatInapPasienPage } from './RawatInapPasienPage'

void React

const DEFAULT_QUERY: InpatientPatientListQuery = {
  page: 1,
  pageSize: 10,
  encounterStatus: 'IN_PROGRESS'
}

export default function RawatInapPasienRoute() {
  const { message } = App.useApp()
  const [queryParams, setQueryParams] = useState<InpatientPatientListQuery>(DEFAULT_QUERY)

  const query = client.encounter.inpatientPatients.useQuery(queryParams)
  const dischargeEncounterMutation = client.visitManagement.dischargeEncounter.useMutation({
    onSuccess: async () => {
      await query.refetch()
    }
  })

  const handleQueryChange = (patch: Partial<InpatientPatientListQuery>) =>
    setQueryParams((prev) => ({ ...prev, ...patch }))

  if (query.isLoading && !query.data) {
    return (
      <DesktopNoticePanel
        title="Memuat Daftar Pasien"
        description="Data pasien rawat inap sedang diambil dari backend."
      />
    )
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-[12px]">
        <DesktopNoticePanel
          tone="warning"
          title="Daftar Pasien belum bisa dimuat"
          description={query.error?.message ?? 'Terjadi kesalahan saat memuat data pasien.'}
        />
        <div>
          <DesktopButton emphasis="primary" onClick={() => void query.refetch()}>
            Coba Lagi
          </DesktopButton>
        </div>
      </div>
    )
  }

  return (
    <RawatInapPasienPage
      items={query.data?.items ?? []}
      total={query.data?.total ?? 0}
      loading={query.isFetching}
      queryParams={queryParams}
      statusCounts={query.data?.statusCounts}
      onQueryChange={handleQueryChange}
      isDispositionSubmitting={dischargeEncounterMutation.isPending}
      onDispositionConfirm={async (patient, payload: DesktopDispositionConfirmPayload) => {
        await dischargeEncounterMutation.mutateAsync({
          encounterId: patient.encounterId,
          dischargeDisposition: payload.dischargeDisposition,
          dischargeNote: payload.note || undefined
        })
        message.success('Disposisi rawat inap berhasil diproses')
      }}
      onDpjpSaved={() => void query.refetch()}
    />
  )
}
