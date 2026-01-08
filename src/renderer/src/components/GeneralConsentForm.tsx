import type { FormInstance } from 'antd'
import { Card, DatePicker, Form, Input, Radio, Select, Tabs, Typography } from 'antd'
import { useEffect } from 'react'
import { PatientAttributes } from 'simrs-types'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input

export interface GeneralConsentFormProps {
  form: FormInstance // Antd form instance
  patientData?: PatientAttributes | any
}

export function GeneralConsentForm({ form, patientData }: GeneralConsentFormProps) {
  const signer = Form.useWatch('signer', form)

  useEffect(() => {
    if (signer === 'patient' && patientData) {
      form.setFieldsValue({
        signerName: patientData.name,
        signerBirthDate: patientData.birthDate,
        signerAddress: patientData.addressLine,
        signerPhone: patientData.phone
      })
    }
  }, [signer, patientData, form])

  return (
    <Card className="shadow-sm">
      <div className="text-center mb-6">
        <Title level={3}>Persetujuan Umum (General Consent)</Title>
      </div>

      <Tabs
        defaultActiveKey="isi-form"
        items={[
          {
            key: 'isi-form',
            label: 'Isi Form',
            children: (
              <>
                <Form.Item label="Perawat" name="nurse" className="mb-6">
                  <Select placeholder="Pilih Perawat">
                    {/* TODO: Populate with real data */}
                    <Select.Option value="perawat1">Perawat 1</Select.Option>
                    <Select.Option value="perawat2">Perawat 2</Select.Option>
                  </Select>
                </Form.Item>

                <div className="mb-4">
                  <Text strong>Yang bertanda tangan di bawah ini:</Text>
                </div>

                <Form.Item name="signer" initialValue="patient">
                  <Radio.Group>
                    <Radio value="patient">Pasien</Radio>
                    <Radio value="guardian">Penanggung Jawab Pasien</Radio>
                  </Radio.Group>
                </Form.Item>

                <div className="grid grid-cols-[120px_10px_1fr] gap-y-2 mb-6">
                  <Text>Nama</Text>
                  <Text>:</Text>
                  <Form.Item name="signerName" noStyle>
                    <Input
                      bordered={signer === 'guardian'}
                      readOnly={signer === 'patient'}
                      placeholder="Nama"
                    />
                  </Form.Item>

                  <Text>Tanggal Lahir</Text>
                  <Text>:</Text>
                  <Form.Item name="signerBirthDate" noStyle>
                    {signer === 'patient' ? (
                      <DatePicker disabled className="w-full" format="DD/MM/YYYY" />
                    ) : (
                      <DatePicker className="w-full" format="DD/MM/YYYY" />
                    )}
                  </Form.Item>

                  <Text>Alamat</Text>
                  <Text>:</Text>
                  <Form.Item name="signerAddress" noStyle>
                    <TextArea
                      autoSize
                      bordered={signer === 'guardian'}
                      readOnly={signer === 'patient'}
                      placeholder="Alamat"
                    />
                  </Form.Item>

                  <Text>No Telp</Text>
                  <Text>:</Text>
                  <Form.Item name="signerPhone" noStyle>
                    <Input
                      bordered={signer === 'guardian'}
                      readOnly={signer === 'patient'}
                      placeholder="Nomor Telepon"
                    />
                  </Form.Item>
                </div>

                <div className="mb-4">
                  <Text>Selaku pasien dengan ini menyatakan persetujuan:</Text>
                </div>

                <div className="space-y-4">
                  <div>
                    <Text strong>1. PERSETUJUAN UNTUK PERAWATAN DAN PENGOBATAN</Text>
                    <Paragraph className="mt-2 text-justify">
                      Saya menyetujui untuk mendapatkan pelayanan di KLINIK SEHAT BAGENDIT sebagai
                      pasien rawat jalan tergantung kepada kebutuhan medis. Pengobatan dapat
                      meliputi seperti:
                      <ul className="list-disc pl-5 mt-1">
                        <li>Pemeriksaan fisik rutin</li>
                        <li>Pemeriksaan tanda-tanda vital</li>
                        <li>Prosedur seperti cairan infuse atau obat suntikan</li>
                        <li>Penggunaan produk farmasi dan obat obatan</li>
                      </ul>
                      Persetujuan yang saya berikan tidak termasuk untuk tindakan operasi minor.
                      Jika saya memutuskan untuk menghentikan perawatan medis untuk diri saya atau
                      yang menjadi perwalian saya, saya memahami bahwa KLINIK SEHAT BAGENDIT atau
                      dokter tidak bertanggung jawab atas hasil yang merugikan saya.
                    </Paragraph>
                  </div>

                  <div>
                    <Text strong>2. PERSETUJUAN PELEPASAN INFORMASI</Text>
                    <Paragraph className="mt-2 text-justify">
                      Saya memahami informasi di dalam diri saya, termasuk diagnosa, hasil
                      laboratorium dan hasil test diagnostik lainnya yang akan digunakan untuk
                      perawatan, KLINIK SEHAT BAGENDIT akan menjamin kerahasiaanya. Saya setuju
                      untuk membuka rahasia kedokteran terkait dengan kondisi Kesehatan, asuhan dan
                      pengobatan yang saya terima kepada perusahaan asuransi kesehatan atau
                      perusahaan lainnya atau pihak lain yang menjamin biaya saya.
                    </Paragraph>
                  </div>

                  {/* Add more sections as per the screenshot if needed, but these seem to be the visible ones */}
                </div>
              </>
            )
          },
          {
            key: 'upload-form',
            label: 'Upload Form',
            children: (
              <div className="p-4 text-center border-dashed border-2 border-gray-300 rounded-lg">
                <Text type="secondary">Fitur upload dokumen akan tersedia segera.</Text>
              </div>
            )
          }
        ]}
      />
    </Card>
  )
}
