import { CreditCardOutlined } from '@ant-design/icons'
import ServiceKioskPage from '..'

function NonMedicQueueCashierKioskPage() {
  return (
    <ServiceKioskPage
      title="KIOSK Kasir"
      description="Halaman untuk pengambilan nomor antrean kasir."
      serviceTypeCode="CASHIER"
      serviceLabel="Kasir"
      icon={<CreditCardOutlined className="text-2xl" />}
    />
  )
}

export default NonMedicQueueCashierKioskPage
