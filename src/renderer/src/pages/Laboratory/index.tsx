import { client } from '@renderer/utils/client'
import { Typography } from 'antd'
import { useState } from 'react'
import { LabEncounterList } from './LabEncounterList'
import { OrderModal } from './components/OrderModal'
import { useLaboratoryActions } from './useLaboratoryActions'

const { Title } = Typography

export default function LaboratoryPage() {
  const [filters] = useState({ limit: 10, offset: 0 })

  const { data, isLoading, refetch } = client.laboratory.listEncounters.useQuery(filters)
  const [modalType, setModalType] = useState<'order' | null>(null)

  const { handlePrintReport } = useLaboratoryActions(() => {
    refetch()
  })

  const [activeEncounter, setActiveEncounter] = useState<any>(null)
  const handleOpenOrder = (encounter: any) => {
    setActiveEncounter(encounter)
    setModalType('order')
  }

  const handleClose = () => {
    setModalType(null)
    setActiveEncounter(null)
  }

  const handleSuccess = () => {
    refetch() // Refresh list to see new request/status
    handleClose()
  }

  return (
    <div>
      <Title level={2}>Laboratory</Title>
      <LabEncounterList
        encounters={data?.result || []}
        isLoading={isLoading}
        onOpenOrder={handleOpenOrder}
        onPrint={(enc) => handlePrintReport(enc.id)}
      />

      {activeEncounter && (
        <>
          <OrderModal
            visible={modalType === 'order'}
            encounter={activeEncounter}
            onCancel={handleClose}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  )
}
