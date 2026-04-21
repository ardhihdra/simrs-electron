import type { ServiceKioskPayload } from '@renderer/pages/non-medic-queue/kiosk/public-location'

import type { KioskaNonMedicServiceType, KioskaRegistrationPaymentMethod } from '../public-client'
import type { KioskaNonMedicQueueTarget } from './kioska-global-types'

type NonMedicKioskPageProps = {
  title: string
  description: string
  serviceTypeCode: KioskaNonMedicServiceType
  serviceLabel: string
  payload?: ServiceKioskPayload
}

const registrationTargetLokasiKerjaCodeMap: Record<
  Extract<KioskaNonMedicQueueTarget, 'rawat_inap' | 'laboratory' | 'radiology'>,
  string
> = {
  rawat_inap: 'RI',
  laboratory: 'LAB',
  radiology: 'RAD'
}

export function buildNonMedicKioskPageProps(
  target: KioskaNonMedicQueueTarget,
  paymentMethod?: KioskaRegistrationPaymentMethod
): NonMedicKioskPageProps {
  if (target === 'billing') {
    return {
      title: 'KIOSK Billing',
      description: 'Halaman untuk pengambilan nomor antrean billing.',
      serviceTypeCode: 'BILLING',
      serviceLabel: 'Billing',
      payload: {
        LokasiKerjaCode: 'ADM'
      }
    }
  }

  if (target === 'cashier') {
    return {
      title: 'KIOSK Kasir',
      description: 'Halaman untuk pengambilan nomor antrean kasir.',
      serviceTypeCode: 'CASHIER',
      serviceLabel: 'Kasir',
      payload: {
        LokasiKerjaCode: 'KASIR'
      }
    }
  }

  if (target === 'pharmacy') {
    return {
      title: 'KIOSK Farmasi',
      description: 'Halaman untuk pengambilan nomor antrean farmasi.',
      serviceTypeCode: 'PHARMACY',
      serviceLabel: 'Farmasi',
      payload: {
        LokasiKerjaCode: 'FARM'
      }
    }
  }

  const isInsurance = paymentMethod === 'ASURANSI'

  return {
    title: isInsurance ? 'KIOSK Pendaftaran Asuransi' : 'KIOSK Pendaftaran',
    description: isInsurance
      ? 'Halaman untuk pengambilan nomor antrean pendaftaran asuransi.'
      : 'Halaman untuk pengambilan nomor antrean pendaftaran.',
    serviceTypeCode: isInsurance ? 'REGISTRASI_ASURANSI' : 'REGISTRASI',
    serviceLabel: isInsurance ? 'Pendaftaran Asuransi' : 'Pendaftaran',
    payload: {
      LokasiKerjaCode: registrationTargetLokasiKerjaCodeMap[target]
    }
  }
}
