import { useEffect } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router'

import { RawatInapTransferPage } from './RawatInapTransferPage'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'
import { getAvailableBedsForWard, getTransferSourceBed, useRawatInapStore } from './rawat-inap.state'

export default function RawatInapTransferRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const state = useRawatInapStore((store) => store.state)
  const prepareTransferDraft = useRawatInapStore((store) => store.prepareTransferDraft)
  const updateTransferDraft = useRawatInapStore((store) => store.updateTransferDraft)
  const submitTransfer = useRawatInapStore((store) => store.submitTransfer)

  useEffect(() => {
    if (!state.transferDraft.sourceBedId && state.selectedBedId) {
      prepareTransferDraft({ sourceBedId: state.selectedBedId })
    }
  }, [prepareTransferDraft, state.selectedBedId, state.transferDraft.sourceBedId])

  const sourceBed = getTransferSourceBed(state)

  return (
    <RawatInapTransferPage
      state={state}
      onBack={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      onCancel={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      onTransferReasonChange={(transferReason) => updateTransferDraft({ transferReason })}
      onTargetWardChange={(targetWardId) => {
        const firstAvailableBed = getAvailableBedsForWard(state, targetWardId)[0]
        updateTransferDraft({
          targetWardId,
          targetBedId: firstAvailableBed?.id ?? ''
        })
      }}
      onTargetBedChange={(targetBedId) => updateTransferDraft({ targetBedId })}
      onTransferNoteChange={(transferNote) => updateTransferDraft({ transferNote })}
      onSubmit={() => {
        if (!sourceBed || !state.transferDraft.targetBedId) {
          message.error('Lengkapi bangsal tujuan dan bed tujuan terlebih dahulu')
          return
        }

        submitTransfer({
          sourceBedId: sourceBed.id,
          targetWardId: state.transferDraft.targetWardId,
          targetBedId: state.transferDraft.targetBedId,
          transferReason: state.transferDraft.transferReason,
          transferNote: state.transferDraft.transferNote
        })
        message.success('Transfer antar bangsal berhasil diproses di state sementara')
        navigate(RAWAT_INAP_PAGE_PATHS.bedMap)
      }}
    />
  )
}
