import React from 'react'

import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { client } from '../../utils/client'
import { RawatInapPasienPage } from './RawatInapPasienPage'

void React

export default function RawatInapPasienRoute() {
  const query = client.encounter.inpatientPatients.useQuery({})

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

  return <RawatInapPasienPage items={query.data?.items ?? []} />
}
