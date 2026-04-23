import { SafetyOutlined } from '@ant-design/icons'
import ServiceKioskPage from '..'

function NonMedicQueueRegistrationInsuranceKioskPage() {
  return (
    <ServiceKioskPage
      title="KIOSK Pendaftaran Asuransi"
      description="Halaman untuk pengambilan nomor antrean pendaftaran asuransi."
      serviceTypeCode="REGISTRASI_ASURANSI"
      serviceLabel="Pendaftaran Asuransi"
      icon={<SafetyOutlined className="text-2xl" />}
      payload={{
        LokasiKerjaCode: 'RJ'
      }}
    />
  )
}

export default NonMedicQueueRegistrationInsuranceKioskPage
