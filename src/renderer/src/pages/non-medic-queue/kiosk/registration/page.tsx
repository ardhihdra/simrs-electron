import { TeamOutlined } from '@ant-design/icons'
import ServiceKioskPage from '..'

function NonMedicQueueRegistrationKioskPage() {
  return (
    <ServiceKioskPage
      title="KIOSK Pendaftaran"
      description="Halaman untuk pengambilan nomor antrean pendaftaran."
      serviceTypeCode="REGISTRASI"
      serviceLabel="Pendaftaran"
      icon={<TeamOutlined className="text-2xl" />}
    />
  )
}

export default NonMedicQueueRegistrationKioskPage
