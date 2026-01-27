/**
 * EncounterTransition Page
 */

import { client } from '@renderer/utils/client'
import { message, Tabs, Typography } from 'antd'
import { useState } from 'react'
import { DischargeModal } from './components/DischargeModal'
import { EncounterList } from './components/EncounterList'
import { RujukanModal } from './components/RujukanModal'
import { type TransferBedFormValues, TransferBedModal } from './components/TransferBedModal'
import { useEncounterActions } from './hooks/useEncounterActions'
import { Encounter } from './types'

const { Title, Text } = Typography

export default function EncounterTransitionPage() {
  // Modal state
  const [dischargeModal, setDischargeModal] = useState<{
    visible: boolean
    encounterId: string | null
  }>({ visible: false, encounterId: null })
  const [transferModal, setTransferModal] = useState<{
    visible: boolean
    encounterId: string | null
  }>({ visible: false, encounterId: null })
  const [rujukanModal, setRujukanModal] = useState<{
    visible: boolean
    encounterId: string | null
  }>({ visible: false, encounterId: null })

  const [selectedDisposition, setSelectedDisposition] = useState<string>('')

  // Data fetching using useQuery and window.api.query
  const {
    data: queryData,
    isLoading,
    refetch
  } = client.encounter.list.useQuery({
    depth: 1
  })

  // Safe access to result array
  const encounters = (queryData as any)?.result || []

  // Actions hook
  const { loading, handleStart, handleDischarge, handleTransfer } = useEncounterActions({
    onSuccess: () => {
      refetch()
      setDischargeModal({ visible: false, encounterId: null })
      setTransferModal({ visible: false, encounterId: null })
      setSelectedDisposition('')
    }
  })

  const handleDischargeConfirm = async (): Promise<void> => {
    if (!dischargeModal.encounterId || !selectedDisposition) {
      message.warning('Pilih disposisi pulang terlebih dahulu')
      return
    }
    await handleDischarge(dischargeModal.encounterId, selectedDisposition)
  }

  const handleTransferConfirm = async (values: TransferBedFormValues): Promise<void> => {
    if (!transferModal.encounterId) return

    await handleTransfer({
      encounterId: transferModal.encounterId,
      ...values,
      newRoomCodeId: values.newRoomCodeId,
      newBedCodeId: values.newBedCodeId,
      newClassOfCareCodeId: values.newClassOfCareCodeId,
      transferReason: values.transferReason
    })
  }

  const handleRujukanConfirm = (referralType: string): void => {
    console.log('Rujukan confirmed:', referralType)
    message.success(`Pasien berhasil dirujuk (${referralType})`)
    closeRujukanModal()
  }

  const openDischargeModal = (encounterId: string): void => {
    setDischargeModal({ visible: true, encounterId })
  }

  const closeDischargeModal = (): void => {
    setDischargeModal({ visible: false, encounterId: null })
    setSelectedDisposition('')
  }

  const openTransferModal = (encounterId: string): void => {
    setTransferModal({ visible: true, encounterId })
  }

  const closeTransferModal = (): void => {
    setTransferModal({ visible: false, encounterId: null })
  }

  const openRujukanModal = (encounterId: string): void => {
    setRujukanModal({ visible: true, encounterId })
  }

  const closeRujukanModal = (): void => {
    setRujukanModal({ visible: false, encounterId: null })
  }

  const encounterList = (encounters as Encounter[]) || []

  return (
    <div className="p-6">
      <Title level={2}>Transisi Encounter</Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        Kelola status encounter pasien: mulai, selesaikan, atau pulangkan pasien.
      </Text>

      <Tabs
        defaultActiveKey="general"
        items={[
          {
            key: 'general',
            label: 'Rawat Jalan / Inap',
            children: (
              <EncounterList
                encounters={encounterList.filter((e) => e.encounterType !== 'LAB')}
                isLoading={isLoading}
                actionLoading={loading}
                onStart={handleStart}
                onTransfer={openTransferModal}
                onDischarge={openDischargeModal}
                onRujukan={openRujukanModal}
              />
            )
          },
          {
            key: 'lab',
            label: 'Laboratorium',
            children: (
              <EncounterList
                encounters={encounters.filter((e) => e.encounterType === 'LAB')}
                isLoading={isLoading}
                actionLoading={loading}
                onStart={handleStart}
                onTransfer={openTransferModal}
                onDischarge={openDischargeModal}
                onRujukan={openRujukanModal}
              />
            )
          }
        ]}
      />

      <DischargeModal
        visible={dischargeModal.visible}
        loading={loading?.includes('-discharge') ?? false}
        selectedDisposition={selectedDisposition}
        onDispositionChange={setSelectedDisposition}
        onConfirm={handleDischargeConfirm}
        onCancel={closeDischargeModal}
      />

      <TransferBedModal
        visible={transferModal.visible}
        loading={loading?.includes('-transfer') ?? false}
        onConfirm={handleTransferConfirm}
        onCancel={closeTransferModal}
      />

      <RujukanModal
        visible={rujukanModal.visible}
        // loading={loading?.includes('-rujukan') ?? false}
        onConfirm={handleRujukanConfirm}
        onCancel={closeRujukanModal}
      />
    </div>
  )
}
