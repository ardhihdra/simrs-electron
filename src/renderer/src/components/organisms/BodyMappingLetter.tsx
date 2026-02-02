import { forwardRef } from 'react'
import dayjs from 'dayjs'
import { Typography, Row, Col } from 'antd'
import bodyFront from '../../assets/images/body_front.png'
import bodyBack from '../../assets/images/body_back.png'
import bodyLeft from '../../assets/images/body_left.png'
import bodyRight from '../../assets/images/body_right.png'

const { Title, Text } = Typography

interface BodyMappingLetterProps {
  data: any
  patientData: any
  bodyMapping: Record<string, string>
  signature: string
}

export const BodyMappingLetter = forwardRef<HTMLDivElement, BodyMappingLetterProps>(
  ({ data, patientData, bodyMapping, signature }, ref) => {
    if (!data || !patientData) return null

    const patient = patientData.patient
    const age = patient.birthDate ? dayjs().diff(dayjs(patient.birthDate), 'year') : 0

    const views = [
      { key: 'front', label: 'Tampak Depan', img: bodyFront },
      { key: 'back', label: 'Tampak Belakang', img: bodyBack },
      { key: 'left', label: 'Tampak Kiri', img: bodyLeft },
      { key: 'right', label: 'Tampak Kanan', img: bodyRight }
    ]

    return (
      <div
        ref={ref}
        className="bg-white p-8 md:p-12 max-w-[210mm] mx-auto text-black text-xs print:p-0"
        style={{ fontFamily: 'Times New Roman, serif' }}
      >
        {/* Header RS */}
        <div className="flex items-center justify-between border-b-4 border-double border-gray-400 pb-4 mb-6">
          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-[8px] text-gray-500 text-center border">
            Logo RS
          </div>
          <div className="text-center flex-1 px-4">
            <Title level={4} className="uppercase mb-0 tracking-wider">
              Rumah Sakit Rahayu Sentosa
            </Title>
            <Text className="text-[10px]">
              Cigagade, Kec. Balubur Limbangan, Kabupaten Garut, Jawa Barat 44186
            </Text>
            <br />
            <Text className="text-[10px]">
              Telp: (021) 123-4567 | Email: info@rs-rahayusentosa.com
            </Text>
          </div>
          <div className="w-16"></div>
        </div>

        <div className="text-center mb-6">
          <Title level={4} className="underline uppercase mb-1">
            Resume Medis Tubuh (Body Mapping)
          </Title>
          <Text>
            No. RM: {patient.medicalRecordNumber} | Nama: {patient.name} | Umur: {age} Th
          </Text>
        </div>

        {/* Anatomical Diagrams Grid */}
        <div className="mb-8">
          <Text strong className="block mb-4 border-b border-gray-400 uppercase">
            I. Anotasi Visual (Anatomical Mapping)
          </Text>
          <Row gutter={[16, 16]}>
            {views.map((view) => (
              <Col span={6} key={view.key}>
                <div className="border border-gray-300 rounded p-1 bg-gray-50 flex flex-col items-center">
                  <Text className="text-[10px] uppercase font-bold mb-1">{view.label}</Text>
                  <div
                    className="relative bg-white overflow-hidden"
                    style={{ width: '120px', height: '180px', border: '1px solid #eee' }}
                  >
                    {/* Background Image */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${view.img})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        opacity: 0.6
                      }}
                    />
                    {/* Drawing Layer */}
                    {bodyMapping[view.key] && (
                      <img
                        src={bodyMapping[view.key]}
                        className="relative z-10 w-full h-full object-contain"
                        alt={view.label}
                      />
                    )}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Clinical Findings */}
        <div className="mb-8">
          <Text strong className="block mb-2 border-b border-gray-400 uppercase">
            II. Deskripsi Temuan Klinis
          </Text>
          <div className="p-3 border border-gray-300 rounded bg-gray-50 min-h-[100px] whitespace-pre-wrap text-[11px]">
            {data.clinical_description || 'Tidak ada deskripsi temuan.'}
          </div>
        </div>

        {/* Additional Notes */}
        {data.additional_notes && (
          <div className="mb-8">
            <Text strong className="block mb-2 border-b border-gray-400 uppercase">
              III. Catatan Tambahan / Instruksi
            </Text>
            <div className="p-3 border border-gray-300 rounded bg-gray-50 whitespace-pre-wrap text-[11px]">
              {data.additional_notes}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="flex justify-end mt-12">
          <div className="text-center w-64">
            <Text className="block mb-2">
              Garut, {dayjs(data.report_date).format('DD MMMM YYYY')}
            </Text>
            <Text className="block mb-2">Dokter Pemeriksa,</Text>
            <div className="h-20 flex items-center justify-center mb-2">
              {signature ? (
                <img src={signature} className="max-h-full" alt="Signature" />
              ) : (
                <div className="h-20" />
              )}
            </div>
            <Text className="block font-bold underline">( {data.doctor_name} )</Text>
          </div>
        </div>

        <div className="mt-12 text-[9px] text-gray-400 italic border-t pt-2">
          Dokumen ini dicetak otomatis secara elektronik pada{' '}
          {dayjs().format('DD/MM/YYYY HH:mm:ss')}
        </div>
      </div>
    )
  }
)

BodyMappingLetter.displayName = 'BodyMappingLetter'
