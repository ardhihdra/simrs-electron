import { MedicineBoxOutlined } from '@ant-design/icons'
import ServiceKioskPage from '..'

function NonMedicQueuePharmacyKioskPage() {
    return (
        <ServiceKioskPage
            title="KIOSK Farmasi"
            description="Halaman sentuh untuk pengambilan nomor antrean farmasi, dibuat supaya mudah dibaca dari monitor besar di area tunggu."
            serviceTypeCode="PHARMACY"
            serviceLabel="Farmasi"
            icon={<MedicineBoxOutlined className="text-2xl" />}
        />
    )
}

export default NonMedicQueuePharmacyKioskPage
