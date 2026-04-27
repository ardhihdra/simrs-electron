import { App } from 'antd'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { client } from '../../utils/client'
import { RawatInapBedMapPage } from './RawatInapBedMapPage'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'
import {
  syncRawatInapStateWithBedMapSnapshot,
  useRawatInapStore
} from './rawat-inap.state'

export default function RawatInapBedMapRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const bedMapQuery = client.room.bedMap.useQuery({})
  const state = useRawatInapStore((store) => store.state)
  const hydrateBedMap = useRawatInapStore((store) => store.hydrateBedMap)
  const selectWard = useRawatInapStore((store) => store.selectWard)
  const selectBed = useRawatInapStore((store) => store.selectBed)
  const prepareTransferDraft = useRawatInapStore((store) => store.prepareTransferDraft)

  useEffect(() => {
    if (bedMapQuery.data) {
      hydrateBedMap(bedMapQuery.data)
    }
  }, [bedMapQuery.data, hydrateBedMap])

  if (bedMapQuery.isLoading && !bedMapQuery.data) {
    return (
      <DesktopNoticePanel
        title="Memuat Peta Bed"
        description="Snapshot bangsal dan bed rawat inap sedang diambil dari backend."
      />
    )
  }

  if (bedMapQuery.isError) {
    return (
      <div className="flex flex-col gap-[12px]">
        <DesktopNoticePanel
          tone="warning"
          title="Peta Bed belum bisa dimuat"
          description={bedMapQuery.error?.message ?? 'Terjadi kesalahan saat memuat data peta bed.'}
        />
        <div>
          <DesktopButton emphasis="primary" onClick={() => void bedMapQuery.refetch()}>
            Coba Lagi
          </DesktopButton>
        </div>
      </div>
    )
  }

  const viewState = bedMapQuery.data ? syncRawatInapStateWithBedMapSnapshot(state, bedMapQuery.data) : state
  const searchParams = new URLSearchParams(location.search)
  const fullscreenParam = searchParams.get('contentFullscreen')
  const isFullscreenMode = fullscreenParam === '1' || fullscreenParam?.toLowerCase() === 'true'

  const toggleFullscreen = () => {
    const nextSearchParams = new URLSearchParams(location.search)

    if (isFullscreenMode) {
      nextSearchParams.delete('contentFullscreen')
    } else {
      nextSearchParams.set('contentFullscreen', '1')
    }

    const nextSearch = nextSearchParams.toString()
    navigate({
      pathname: location.pathname,
      search: nextSearch ? `?${nextSearch}` : ''
    })
  }

  return (
    <RawatInapBedMapPage
      state={viewState}
      isFullscreenMode={isFullscreenMode}
      onSelectWard={(wardId) => selectWard({ wardId })}
      onSelectBed={(bedId) => selectBed({ bedId })}
      onToggleFullscreen={toggleFullscreen}
      onOpenAdmisi={() => navigate(RAWAT_INAP_PAGE_PATHS.admisi)}
      onOpenTransfer={() => {
        if (!viewState.selectedBedId) {
          message.warning('Pilih bed pasien terlebih dahulu')
          return
        }

        prepareTransferDraft({ sourceBedId: viewState.selectedBedId })
        navigate(RAWAT_INAP_PAGE_PATHS.transfer)
      }}
      onOpenCppt={() => message.info('Halaman CPPT belum diimplementasikan pada scope ini')}
      onOpenDischarge={() => message.info('Halaman pulang belum diimplementasikan pada scope ini')}
    />
  )
}
