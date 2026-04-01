import { CreditCardOutlined } from '@ant-design/icons'
import ServiceKioskPage from '..'

function NonMedicQueueCashierKioskPage() {
    return (
        <ServiceKioskPage
            title="KIOSK Kasir"
            description="Halaman sentuh untuk pengambilan nomor antrean kasir dengan tombol besar, informasi jelas, dan fokus penggunaan di monitor touch screen."
            serviceTypeCode="CASHIER"
            serviceLabel="Kasir"
            icon={<CreditCardOutlined className="text-2xl" />}
        />
    )
}

export default NonMedicQueueCashierKioskPage
