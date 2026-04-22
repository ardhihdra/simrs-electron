import { TeamOutlined } from '@ant-design/icons'
import ServiceKioskPage from '@renderer/pages/non-medic-queue/kiosk'

import { useKioskaGlobalFlow } from '../kioska-global-context'
import { buildNonMedicKioskPageProps } from '../non-medic-kiosk'

export function StepPublicQueueKiosk() {
  const { state } = useKioskaGlobalFlow()

  if (!state.publicQueue.target) {
    return null
  }

  const requiresPaymentMethod =
    state.publicQueue.target === 'rawat_inap' ||
    state.publicQueue.target === 'laboratory' ||
    state.publicQueue.target === 'radiology'

  if (requiresPaymentMethod && !state.publicQueue.paymentMethod) {
    return null
  }

  const kioskPageProps = buildNonMedicKioskPageProps(
    state.publicQueue.target,
    state.publicQueue.paymentMethod ?? undefined
  )

  return (
    <ServiceKioskPage
      {...kioskPageProps}
      showHeader={false}
      icon={<TeamOutlined className="text-2xl" />}
    />
  )
}
