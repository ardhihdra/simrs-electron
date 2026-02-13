import { forwardRef } from 'react'
import dayjs from 'dayjs'
import { Typography } from 'antd'

const { Title, Text, Paragraph } = Typography

interface InformedConsentLetterProps {
  data: any
  patientData: any
  signatures: Record<string, string>
}

export const InformedConsentLetter = forwardRef<HTMLDivElement, InformedConsentLetterProps>(
  ({ data, patientData, signatures }, ref) => {
    if (!data || !patientData) return null

    const patient = patientData.patient

    const infoList = [
      { label: 'Diagnosis (WD & DD)', value: data.info_diagnosis, checked: data.check_diagnosis },
      { label: 'Dasar Diagnosis', value: data.info_basis, checked: data.check_basis },
      { label: 'Tindakan Kedokteran', value: data.info_procedure, checked: data.check_procedure },
      { label: 'Indikasi Tindakan', value: data.info_indication, checked: data.check_indication },
      { label: 'Tata Cara', value: data.info_method, checked: data.check_method },
      { label: 'Tujuan', value: data.info_objective, checked: data.check_objective },
      { label: 'Risiko', value: data.info_risk, checked: data.check_risk },
      { label: 'Komplikasi', value: data.info_complication, checked: data.check_complication },
      { label: 'Prognosis', value: data.info_prognosis, checked: data.check_prognosis },
      {
        label: 'Alternatif & Risiko',
        value: data.info_alternative,
        checked: data.check_alternative
      }
    ]

    return (
      <div
        ref={ref}
        className="bg-white p-8 md:p-12 max-w-[210mm] mx-auto text-black text-sm print:p-0"
        style={{ fontFamily: 'Times New Roman, serif' }}
      >
        <div className="flex items-center justify-between border-b-4 border-double border-gray-400 pb-4 mb-6">
          <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 text-center border">
            Logo RS
          </div>
          <div className="text-center flex-1 px-4">
            <Title level={4} className="uppercase mb-0 tracking-wider">
              Rumah Sakit Rahayu Sentosa
            </Title>
            <Text className="text-xs">
              Cigagade, Kec. Balubur Limbangan, Kabupaten Garut, Jawa Barat 44186
            </Text>
            <br />
            <Text className="text-xs">Telp: (021) 123-4567 | Email: info@rs-rahayusentosa.com</Text>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="text-center mb-6">
          <Title level={4} className="underline uppercase mb-1">
            Persetujuan Tindakan Kedokteran (Informed Consent)
          </Title>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6 border p-4 rounded bg-gray-50/20">
          <div>
            <Text strong className="block mb-2 border-b">
              1. PEMBERIAN INFORMASI
            </Text>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="w-24">Tanggal/Jam</td>
                  <td>: {dayjs(data.info_date).format('DD MMM YYYY HH:mm')}</td>
                </tr>
                <tr>
                  <td>Dokter Pelaksana</td>
                  <td>: {data.doctor_executor}</td>
                </tr>
                <tr>
                  <td>Pemberi Info</td>
                  <td>: {data.info_provider}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <Text strong className="block mb-2 border-b">
              2. PENERIMA INFORMASI
            </Text>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="w-24">Nama Penerima</td>
                  <td>: {data.receiver_name}</td>
                </tr>
                <tr>
                  <td>Tgl Lahir</td>
                  <td>: {dayjs(data.receiver_birthdate).format('DD MMM YYYY')}</td>
                </tr>
                <tr>
                  <td>Alamat</td>
                  <td>: {data.receiver_address}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6">
          <Text strong className="block mb-2">
            3. JENIS INFORMASI (MATERI EDUKASI)
          </Text>
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1 w-10 text-center">No</th>
                <th className="border border-gray-400 p-1 text-left">Jenis Informasi</th>
                <th className="border border-gray-400 p-1 text-left">Isi Informasi</th>
                <th className="border border-gray-400 p-1 w-20 text-center">Tanda (✓)</th>
              </tr>
            </thead>
            <tbody>
              {infoList.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 p-1 text-center">{idx + 1}</td>
                  <td className="border border-gray-400 p-1 font-bold">{item.label}</td>
                  <td className="border border-gray-400 p-1">{item.value || '-'}</td>
                  <td className="border border-gray-400 p-1 text-center">
                    {item.checked ? '✓' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-6 border border-gray-400 p-3 rounded">
          <Paragraph className="mb-2 italic">
            &quot;Dengan ini saya menyatakan bahwa saya telah memberikan informasi di atas secara
            jujur dan lengkap kepada pasien/wali.&quot;
          </Paragraph>
          <Paragraph className="mb-0 italic border-t pt-2">
            &quot;Dengan ini saya menyatakan bahwa saya telah menerima informasi, memahami
            sepenuhnya, dan telah diberikan kesempatan bertanya.&quot;
          </Paragraph>
        </div>

        <div className="mb-10 text-center border border-gray-300 p-3 bg-gray-50 uppercase font-bold text-base">
          SAYA {data.consent_type === 'agree' ? 'SETUJU (MENYETUJUI)' : 'TIDAK SETUJU (MENOLAK)'}{' '}
          DILAKUKAN TINDAKAN TERSEBUT
          <div className="text-xs font-normal normal-case mt-1">
            Terhadap diri saya sendiri / Istri / Suami / Anak / Ayah / Ibu saya dengan Nama{' '}
            <b>{patient.name}</b>, Lahir pada tanggal{' '}
            <b>{dayjs(patient.birthDate).format('DD MMM YYYY')}</b>.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-12 mb-8">
          <div className="text-center">
            <Text className="block mb-2">Dokter Pelaksana Tindakan</Text>
            <div className="h-24 flex items-center justify-center">
              {signatures.doctor ? (
                <img src={signatures.doctor} className="h-20" />
              ) : (
                <div className="h-20 w-40 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-300">
                  TTD Digital
                </div>
              )}
            </div>
            <Text className="block font-bold underline">( {data.doctor_executor} )</Text>
          </div>
          <div className="text-center">
            <Text className="block mb-2">Yang Membuat Pernyataan</Text>
            <div className="h-24 flex items-center justify-center">
              {signatures.receiver ? (
                <img src={signatures.receiver} className="h-20" />
              ) : (
                <div className="h-20 w-40 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-300">
                  TTD Digital
                </div>
              )}
            </div>
            <Text className="block font-bold underline">( {data.receiver_name} )</Text>
          </div>
          <div className="text-center">
            <Text className="block mb-2">Saksi 1 (Keluarga)</Text>
            <div className="h-24 flex items-center justify-center">
              {signatures.witness1 ? (
                <img src={signatures.witness1} className="h-20" />
              ) : (
                <div className="h-20 w-40 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-300">
                  TTD Digital
                </div>
              )}
            </div>
            <Text className="block font-bold underline">
              ( {data.witness1_name || '....................'} )
            </Text>
          </div>
          <div className="text-center">
            <Text className="block mb-2">Saksi 2 (Paramedis/RS)</Text>
            <div className="h-24 flex items-center justify-center">
              {signatures.witness2 ? (
                <img src={signatures.witness2} className="h-20" />
              ) : (
                <div className="h-20 w-40 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-300">
                  TTD Digital
                </div>
              )}
            </div>
            <Text className="block font-bold underline">
              ( {data.witness2_name || '....................'} )
            </Text>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 border-t pt-2 italic">
          Dicetak secara elektronik dari SIMRS Rahayu Sentosa pada{' '}
          {dayjs().format('DD/MM/YYYY HH:mm:ss')}
        </div>
      </div>
    )
  }
)

InformedConsentLetter.displayName = 'InformedConsentLetter'
