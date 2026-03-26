import { RoomTransferInput } from '@main/rpc/procedure/room'
import { rpc } from '@renderer/utils/client'
import { message } from 'antd'
import { useState } from 'react'
import { EncounterDischargeInput, EncounterFinishInput } from 'simrs-types'

interface UseEncounterActionsParams {
  onSuccess: () => void
}

interface UseEncounterActionsReturn {
  loading: string | null
  handleStart: (encounterId: string) => Promise<void>
  handleFinish: (encounterId: string, disposition?: string) => Promise<void>
  handleDischarge: (encounterId: string, disposition: string) => Promise<void>
  handleTransfer: (data: RoomTransferInput) => Promise<void>
}

export function useEncounterActions({
  onSuccess
}: UseEncounterActionsParams): UseEncounterActionsReturn {
  const [loading, setLoading] = useState<string | null>(null)

  const handleStart = async (encounterId: string): Promise<void> => {
    setLoading(`${encounterId}-start`)
    try {
      await rpc.encounter.start(encounterId)
      message.success('Encounter dimulai')
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memulai encounter'
      message.error(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  const handleFinish = async (encounterId: string, disposition?: string): Promise<void> => {
    setLoading(`${encounterId}-finish`)
    try {
      const input: EncounterFinishInput = { id: encounterId, dischargeDisposition: disposition }
      await rpc.encounter.finish(input)
      message.success('Encounter selesai')
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyelesaikan encounter'
      message.error(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  const handleDischarge = async (encounterId: string, disposition: string): Promise<void> => {
    setLoading(`${encounterId}-discharge`)
    try {
      const input: EncounterDischargeInput = { id: encounterId, dischargeDisposition: disposition }
      await rpc.encounter.discharge(input)
      message.success('Pasien dipulangkan')
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memulangkan pasien'
      message.error(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  const handleTransfer = async (data: RoomTransferInput): Promise<void> => {
    setLoading(`${data.encounterId}-transfer`)
    try {
      await rpc.room.transfer(data)
      message.success('Pasien berhasil dipindahkan')
      onSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal memindahkan pasien'
      message.error(errorMessage)
    } finally {
      setLoading(null)
    }
  }

  return {
    loading,
    handleStart,
    handleFinish,
    handleDischarge,
    handleTransfer
  }
}
