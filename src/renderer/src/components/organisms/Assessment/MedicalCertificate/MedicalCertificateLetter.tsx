import { forwardRef } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

export type CertificateType = 'sakit' | 'sehat' | 'istirahat' | 'lainnya'

export interface MedicalCertificateData {
  id?: string | number
  certificateType: CertificateType
  diagnosis: string
  purpose?: string
  notes?: string
  validFrom?: string
  validUntil?: string
  restDays?: number
  issuedAt?: string
  doctorName?: string
  doctorSip?: string
  signatureUrl?: string
}

interface MedicalCertificateLetterProps {
  data: MedicalCertificateData
  patientData: any
}

const CERTIFICATE_TITLE_MAP: Record<CertificateType, string> = {
  sakit: 'SURAT KETERANGAN SAKIT',
  sehat: 'SURAT KETERANGAN SEHAT',
  istirahat: 'SURAT KETERANGAN ISTIRAHAT',
  lainnya: 'SURAT KETERANGAN DOKTER'
}

export const MedicalCertificateLetter = forwardRef<HTMLDivElement, MedicalCertificateLetterProps>(
  ({ data, patientData }, ref) => {
    if (!data || !patientData) return null

    const patient = patientData.patient
    const age = patient?.birthDate ? dayjs().diff(dayjs(patient.birthDate), 'year') : '-'
    const gender = patient?.gender === 'male' ? 'Laki-laki' : 'Perempuan'
    const issuedDate = data.issuedAt
      ? dayjs(data.issuedAt).format('DD MMMM YYYY')
      : dayjs().format('DD MMMM YYYY')

    const certId = data.id || '-'
    const year = dayjs(data.issuedAt).format('YYYY')
    const typeCode = data.certificateType?.substring(0, 3).toUpperCase() || 'SKT'

    const title = CERTIFICATE_TITLE_MAP[data.certificateType] || 'SURAT KETERANGAN DOKTER'

    return (
      <div
        ref={ref}
        className="bg-white p-10 max-w-[210mm] mx-auto text-black"
        style={{ fontFamily: 'Times New Roman, serif', fontSize: '13pt', lineHeight: 1.6 }}
      >
        {/* Kop Surat */}
        <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
          <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-500 border rounded">
            Logo RS
          </div>
          <div className="text-center flex-1 px-4">
            <div className="text-xl font-bold uppercase tracking-widest">
              Rumah Sakit Rahayu Sentosa
            </div>
            <div className="text-sm mt-1">
              Cigagade, Kec. Balubur Limbangan, Kabupaten Garut, Jawa Barat 44186
            </div>
            <div className="text-sm">Telp: (0262) 123-4567 | Email: info@rs-rahayusentosa.com</div>
          </div>
          <div className="w-20" />
        </div>

        {/* Judul */}
        <div className="text-center mb-6">
          <div className="text-lg font-bold uppercase underline tracking-wider">{title}</div>
          <div className="text-sm mt-1">
            No: {certId}/{typeCode}/{year}
          </div>
        </div>

        {/* Pembuka */}
        <p className="mb-4">
          Yang bertanda tangan di bawah ini, dokter pemeriksa pada Rumah Sakit Rahayu Sentosa,
          menerangkan bahwa:
        </p>

        {/* Data Pasien */}
        <div className="pl-6 mb-6">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '170px', paddingBottom: '4px' }}>Nama Pasien</td>
                <td style={{ width: '16px' }}>:</td>
                <td className="font-bold">{patient?.name || '-'}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>No. Rekam Medis</td>
                <td>:</td>
                <td>{patient?.medicalRecordNumber || '-'}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>Umur / Jenis Kelamin</td>
                <td>:</td>
                <td>
                  {age} Tahun / {gender}
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>Alamat</td>
                <td>:</td>
                <td>{patient?.address?.[0]?.line?.[0] || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Isi Surat */}
        <div className="border p-4 bg-gray-50 mb-6" style={{ background: '#fafafa' }}>
          {/* Diagnosis / Kondisi */}
          {data.diagnosis && (
            <div className="mb-3">
              <span className="font-bold block mb-1">Diagnosis / Kondisi Medis:</span>
              <span>{data.diagnosis}</span>
            </div>
          )}

          {/* Masa Istirahat (khusus sakit/istirahat) */}
          {(data.certificateType === 'sakit' || data.certificateType === 'istirahat') &&
            data.validFrom &&
            data.validUntil && (
              <div className="mb-3">
                <span className="font-bold block mb-1">Dianjurkan Istirahat:</span>
                <span>
                  {data.restDays} ({data.restDays}) hari,{' '}
                  {data.validFrom ? dayjs(data.validFrom).format('DD MMMM YYYY') : '-'} s/d{' '}
                  {data.validUntil ? dayjs(data.validUntil).format('DD MMMM YYYY') : '-'}
                </span>
              </div>
            )}

          {/* Tujuan surat */}
          {data.purpose && (
            <div className="mb-3">
              <span className="font-bold block mb-1">Keperluan:</span>
              <span>{data.purpose}</span>
            </div>
          )}

          {/* Keterangan tambahan */}
          {data.notes && (
            <div className="mb-0">
              <span className="font-bold block mb-1">Keterangan:</span>
              <span style={{ whiteSpace: 'pre-line' }}>{data.notes}</span>
            </div>
          )}
        </div>

        {/* Penutup */}
        <p className="mb-10">
          Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan
          sebagaimana mestinya.
        </p>

        {/* TTD */}
        <div className="flex justify-end">
          <div className="text-center" style={{ minWidth: '220px' }}>
            <div className="mb-1">Garut, {issuedDate}</div>
            <div className="mb-1">Dokter Pemeriksa,</div>
            {/* Ruang TTD — gambar jika ada, kosong jika tidak */}
            <div
              style={{
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {data.signatureUrl ? (
                <img
                  src={data.signatureUrl}
                  alt="Tanda Tangan"
                  style={{ maxHeight: '65px', maxWidth: '160px', objectFit: 'contain' }}
                />
              ) : null}
            </div>
            <div className="font-bold underline">
              ( {data.doctorName || 'dr. _______________'} )
            </div>
            {data.doctorSip && <div className="text-sm mt-1">SIP: {data.doctorSip}</div>}
          </div>
        </div>
      </div>
    )
  }
)

MedicalCertificateLetter.displayName = 'MedicalCertificateLetter'
