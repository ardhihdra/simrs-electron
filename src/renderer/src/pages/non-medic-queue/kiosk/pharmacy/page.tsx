import { MedicineBoxOutlined } from '@ant-design/icons'
import ServiceKioskPage from '..'

function NonMedicQueuePharmacyKioskPage() {
  return (
    <ServiceKioskPage
      title="KIOSK Farmasi"
      description="Halaman untuk pengambilan nomor antrean farmasi."
      serviceTypeCode="PHARMACY"
      serviceLabel="Farmasi"
      icon={<MedicineBoxOutlined className="text-2xl" />}
    />
  )
}

export default NonMedicQueuePharmacyKioskPage
