import { forwardRef } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

export interface FollowUpData {
  id?: string | number
  controlDate: string
  poliTujuan: string
  dokterTujuan: string
  jenisKontrol: string
  diagnosis: string
  notes?: string
  issuedAt?: string
  doctorName?: string
  doctorSip?: string
  signatureUrl?: string
}

interface FollowUpLetterProps {
  data: FollowUpData
  patientData: any
}

export const FollowUpLetter = forwardRef<HTMLDivElement, FollowUpLetterProps>(
  ({ data, patientData }, ref) => {
    if (!data || !patientData) return null

    const patient = patientData.patient
    const age = patient?.birthDate ? dayjs().diff(dayjs(patient.birthDate), 'year') : '-'
    const gender = patient?.gender === 'male' ? 'Laki-laki' : 'Perempuan'
    const issuedDate = data.issuedAt
      ? dayjs(data.issuedAt).format('DD MMMM YYYY')
      : dayjs().format('DD MMMM YYYY')

    const letterId = data.id || '-'
    const year = dayjs(data.issuedAt).format('YYYY')

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
          <div className="text-lg font-bold uppercase underline tracking-wider">
            SURAT RENCANA KONTROL (FOLLOW UP)
          </div>
          <div className="text-sm mt-1">
            No: {letterId}/KTR/{year}
          </div>
        </div>

        {/* Data Pasien */}
        <div className="pl-6 mb-6">
          <span className="font-bold underline block mb-2">Data Pasien:</span>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '170px', paddingBottom: '4px' }}>No. Rekam Medis</td>
                <td style={{ width: '16px' }}>:</td>
                <td className="font-bold">{patient?.medicalRecordNumber || '-'}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>Nama Pasien</td>
                <td>:</td>
                <td>{patient?.name || '-'}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>Tgl. Lahir / Umur</td>
                <td>:</td>
                <td>
                  {patient?.birthDate ? dayjs(patient.birthDate).format('DD MMMM YYYY') : '-'} /{' '}
                  {age} Th
                </td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>Jenis Kelamin</td>
                <td>:</td>
                <td>{gender}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Isi Rencana Kontrol */}
        <div className="border p-4 bg-gray-50 mb-6" style={{ background: '#fafafa' }}>
          <span className="font-bold underline block mb-4 text-center">
            Rencana Kontrol Selanjutnya
          </span>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <tbody>
              <tr>
                <td
                  style={{ width: '150px', paddingBottom: '8px', verticalAlign: 'top' }}
                  className="font-semibold"
                >
                  Tanggal Kontrol
                </td>
                <td style={{ width: '16px', verticalAlign: 'top' }}>:</td>
                <td style={{ verticalAlign: 'top' }} className="font-bold text-lg">
                  {data.controlDate ? dayjs(data.controlDate).format('dddd, DD MMMM YYYY') : '-'}
                </td>
              </tr>
              <tr>
                <td
                  style={{ paddingBottom: '8px', verticalAlign: 'top' }}
                  className="font-semibold"
                >
                  Poli Tujuan
                </td>
                <td style={{ verticalAlign: 'top' }}>:</td>
                <td style={{ verticalAlign: 'top' }}>{data.poliTujuan || '-'}</td>
              </tr>
              <tr>
                <td
                  style={{ paddingBottom: '8px', verticalAlign: 'top' }}
                  className="font-semibold"
                >
                  Dokter Tujuan
                </td>
                <td style={{ verticalAlign: 'top' }}>:</td>
                <td style={{ verticalAlign: 'top' }}>{data.dokterTujuan || '-'}</td>
              </tr>
              <tr>
                <td
                  style={{ paddingBottom: '8px', verticalAlign: 'top' }}
                  className="font-semibold"
                >
                  Jenis Kontrol
                </td>
                <td style={{ verticalAlign: 'top' }}>:</td>
                <td style={{ verticalAlign: 'top' }}>{data.jenisKontrol || '-'}</td>
              </tr>
              <tr>
                <td
                  style={{ paddingBottom: '8px', verticalAlign: 'top' }}
                  className="font-semibold"
                >
                  Diagnosis
                </td>
                <td style={{ verticalAlign: 'top' }}>:</td>
                <td style={{ verticalAlign: 'top' }}>{data.diagnosis || '-'}</td>
              </tr>
              {data.notes && (
                <tr>
                  <td style={{ verticalAlign: 'top' }} className="font-semibold">
                    Catatan
                  </td>
                  <td style={{ verticalAlign: 'top' }}>:</td>
                  <td style={{ verticalAlign: 'top', whiteSpace: 'pre-line' }}>{data.notes}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Penutup */}
        <p className="mb-10 text-justify">
          Surat Rencana Kontrol (SRK) ini diterbitkan sebagai pengingat jadwal kontrol pasien pada
          tanggal dan poliklinik yang telah ditentukan. Harap membawa surat ini beserta kelengkapan
          pendaftaran lainnya pada saat kontrol.
        </p>

        {/* TTD */}
        <div className="flex justify-between items-end">
          <div className="text-center text-sm" style={{ width: '220px' }}>
            <div className="mb-20">Pasien / Keluarga,</div>
            <div className="font-bold underline">( ............................... )</div>
          </div>

          <div className="text-center" style={{ minWidth: '220px' }}>
            <div className="mb-1">Garut, {issuedDate}</div>
            <div className="mb-1">Dokter Pemeriksa,</div>
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

FollowUpLetter.displayName = 'FollowUpLetter'
