import { forwardRef } from 'react'
import dayjs from 'dayjs'
import { Typography, Row, Col } from 'antd'

const { Title, Text, Paragraph } = Typography

interface ReferralLetterProps {
  data: any
  patientData: any
}

export const ReferralLetter = forwardRef<HTMLDivElement, ReferralLetterProps>(
  ({ data, patientData }, ref) => {
    if (!data || !patientData) return null

    const patient = patientData.patient
    const age = patient.birthDate ? dayjs().diff(dayjs(patient.birthDate), 'year') : 0
    const targetName =
      data.targetOrganizationName ||
      data.targetDepartemen?.nama ||
      data.targetLocation?.nama ||
      data.targetPractitionerName ||
      (data.referralType === 'internal' ? data.targetUnit : data.targetFacility) ||
      '-'
    const referralNumber =
      data.internalReferralNumber ||
      data.externalReferralNumber ||
      (data.id ? `${data.id}/RUJ/${dayjs(data.createdAt).format('YYYY')}` : '-')
    const referralReason = data.reasonForReferral || data.reason || '-'
    const clinicalSummary =
      data.examinationSummary || data.clinicalSummary || data.diagnosisText || data.diagnosisCode
    const conditionAtTransfer = data.conditionAtTransfer || data.keadaanKirim
    const referringDoctorName =
      data.referringPractitionerName || patientData.doctorName || patientData.doctor?.name || 'Dr. Dokter'

    return (
      <div
        ref={ref}
        className="bg-white p-8 md:p-12 max-w-[210mm] mx-auto text-black"
        style={{ fontFamily: 'Times New Roman, serif' }}
      >
        <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
          <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-500 text-center border">
            Logo RS
          </div>
          <div className="text-center flex-1 px-4">
            <Title level={3} className="uppercase mb-0 tracking-wider">
              Rumah Sakit Rahayu Sentosa
            </Title>
            <Title level={4} className="uppercase mb-1 font-normal"></Title>
            <Text>Cigagade, Kec. Balubur Limbangan, Kabupaten Garut, Jawa Barat 44186</Text>
            <br />
            <Text>Telp: (021) 123-4567 | Email: info@rs-rahayusentosa.com</Text>
          </div>
          <div className="w-24"></div>
        </div>

        <div className="text-center mb-8">
          <Title level={3} className="underline uppercase mb-1">
            Surat Rujukan {data.referralType === 'internal' ? 'Internal' : 'External'}
          </Title>
          <Text className="text-lg">No: {referralNumber}</Text>
        </div>

        <div className="mb-6 text-lg">
          <Row>
            <Col span={4}>Kepada Yth.</Col>
            <Col span={20}>: {data.referralType === 'internal' ? `Poli/Unit ${targetName}` : targetName}</Col>
          </Row>
          <Row>
            <Col span={4}>Di Tempat</Col>
          </Row>
        </div>

        <Paragraph className="text-lg mb-6 text-justify">
          Dengan hormat, <br />
          Mohon pemeriksaan dan penanganan lebih lanjut terhadap pasien:
        </Paragraph>

        <div className="mb-8 pl-4">
          <table className="w-full text-lg border-collapse">
            <tbody>
              <tr>
                <td className="w-40 py-1">Nama Pasien</td>
                <td className="w-4 py-1">:</td>
                <td className="py-1 font-bold">{patient.name}</td>
              </tr>
              <tr>
                <td className="py-1">No. RM</td>
                <td>:</td>
                <td>{patient.medicalRecordNumber}</td>
              </tr>
              <tr>
                <td className="py-1">Umur / JK</td>
                <td>:</td>
                <td>
                  {age} Tahun / {patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                </td>
              </tr>
              <tr>
                <td className="py-1">Alamat</td>
                <td>:</td>
                <td>{patient.address?.[0]?.line?.[0] || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8 border p-4 bg-gray-50/50">
          <Title level={5} className="mb-2 uppercase border-b pb-1">
            Ringkasan Medis
          </Title>

          <div className="mb-4">
            <Text strong className="block mb-1">
              Alasan Rujukan:
            </Text>
            <Paragraph className="text-lg mb-0">{referralReason}</Paragraph>
          </div>

          {clinicalSummary && (
            <div className="mb-4">
              <Text strong className="block mb-1">
                Ringkasan Klinis / Diagnosis Sementara:
              </Text>
              <Paragraph className="text-lg mb-0 text-justify whitespace-pre-line">
                {clinicalSummary}
              </Paragraph>
            </div>
          )}

          {conditionAtTransfer && (
            <div className="mb-4">
              <Text strong className="block mb-1">
                Keadaan Saat Kirim:
              </Text>
              <Paragraph className="text-lg mb-0 text-justify whitespace-pre-line">
                {conditionAtTransfer}
              </Paragraph>
            </div>
          )}

          {data.treatmentSummary && (
            <div className="mb-0">
              <Text strong className="block mb-1">
                Terapi / Tindakan yang Sudah Diberikan:
              </Text>
              <Paragraph className="text-lg mb-0 text-justify whitespace-pre-line">
                {data.treatmentSummary}
              </Paragraph>
            </div>
          )}
        </div>

        <Paragraph className="text-lg mb-12">
          Demikian surat rujukan ini kami buat untuk dapat dipergunakan sebagaimana mestinya. Atas
          kerjasamanya kami ucapkan terima kasih.
        </Paragraph>

        <div className="flex justify-end mt-12">
          <div className="text-center w-64">
            <Text className="block text-lg mb-2">
              {dayjs(data.referralDate || data.createdAt).format('Garut, DD MMMM YYYY')}
            </Text>
            <div className="h-20 mb-2 flex items-center justify-center">
              {data.signatureUrl ? (
                <img src={data.signatureUrl} alt="TTD Dokter Pengirim" className="max-h-full" />
              ) : null}
            </div>
            <Text className="block text-lg font-bold underline">
              ( {referringDoctorName} )
            </Text>
            <Text className="block">Dokter Penanggung Jawab</Text>
          </div>
        </div>
      </div>
    )
  }
)

ReferralLetter.displayName = 'ReferralLetter'
