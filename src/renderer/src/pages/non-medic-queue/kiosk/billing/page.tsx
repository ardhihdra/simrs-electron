import { WalletOutlined } from '@ant-design/icons'
import ServiceKioskPage from '..'

function NonMedicQueueBillingKioskPage() {
  return (
    <ServiceKioskPage
      title="KIOSK Billing"
      description="Halaman untuk pengambilan nomor antrean billing."
      serviceTypeCode="BILLING"
      serviceLabel="Billing"
      icon={<WalletOutlined className="text-2xl" />}
    />
  )
}

export default NonMedicQueueBillingKioskPage
