import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Typography,
  Space,
  Modal,
  Divider
} from 'antd'
import { SaveOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { InformedConsentLetter } from './InformedConsentLetter'
import { SignaturePadModal } from '../molecules/SignaturePadModal'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { AssessmentHeader } from './Assessment/AssessmentHeader'
import { InfoCircleOutlined } from '@ant-design/icons'

import { useCreateQuestionnaireResponse } from '@renderer/hooks/query/use-questionnaire-response'
import { QuestionnaireResponseStatus } from '@renderer/types/questionnaire.types'

const { Text, Paragraph, Title } = Typography
const { TextArea } = Input

interface InformedConsentFormProps {
  encounterId: string
  patientData: any
}

export const InformedConsentForm = ({ encounterId, patientData }: InformedConsentFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse'
  ])
  const { mutateAsync: createQuestionnaireResponse } = useCreateQuestionnaireResponse()

  const [sigModal, setSigModal] = useState<{ visible: boolean; type: string; title: string }>({
    visible: false,
    type: '',
    title: ''
  })
  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [formDataForPrint, setFormDataForPrint] = useState<any>(null)

  const handleFinish = async (values: any) => {
    try {
      const items = [
        { linkId: 'receiver-name', text: 'Nama Penerima', valueString: values.receiver_name },
        {
          linkId: 'receiver-birthdate',
          text: 'Tanggal Lahir Penerima',
          valueDateTime: values.receiver_birthdate?.toISOString()
        },
        {
          linkId: 'receiver-address',
          text: 'Alamat Penerima',
          valueString: values.receiver_address
        },
        { linkId: 'consent-type', text: 'Jenis Persetujuan', valueString: values.consent_type },

        // Checklist items
        {
          linkId: 'diagnosis',
          text: 'Diagnosis (WD & DD)',
          valueString: values.info_diagnosis,
          item: [
            {
              linkId: 'diagnosis-check',
              text: 'Sudah Dijelaskan',
              valueBoolean: values.check_diagnosis
            }
          ]
        },
        {
          linkId: 'basis',
          text: 'Dasar Diagnosis',
          valueString: values.info_basis,
          item: [
            { linkId: 'basis-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_basis }
          ]
        },
        {
          linkId: 'procedure',
          text: 'Tindakan Kedokteran',
          valueString: values.info_procedure,
          item: [
            {
              linkId: 'procedure-check',
              text: 'Sudah Dijelaskan',
              valueBoolean: values.check_procedure
            }
          ]
        },
        {
          linkId: 'indication',
          text: 'Indikasi Tindakan',
          valueString: values.info_indication,
          item: [
            {
              linkId: 'indication-check',
              text: 'Sudah Dijelaskan',
              valueBoolean: values.check_indication
            }
          ]
        },
        {
          linkId: 'method',
          text: 'Tata Cara',
          valueString: values.info_method,
          item: [
            { linkId: 'method-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_method }
          ]
        },
        {
          linkId: 'objective',
          text: 'Tujuan',
          valueString: values.info_objective,
          item: [
            {
              linkId: 'objective-check',
              text: 'Sudah Dijelaskan',
              valueBoolean: values.check_objective
            }
          ]
        },
        {
          linkId: 'risk',
          text: 'Risiko',
          valueString: values.info_risk,
          item: [
            { linkId: 'risk-check', text: 'Sudah Dijelaskan', valueBoolean: values.check_risk }
          ]
        },
        {
          linkId: 'complication',
          text: 'Komplikasi',
          valueString: values.info_complication,
          item: [
            {
              linkId: 'complication-check',
              text: 'Sudah Dijelaskan',
              valueBoolean: values.check_complication
            }
          ]
        },
        {
          linkId: 'prognosis',
          text: 'Prognosis',
          valueString: values.info_prognosis,
          item: [
            {
              linkId: 'prognosis-check',
              text: 'Sudah Dijelaskan',
              valueBoolean: values.check_prognosis
            }
          ]
        },
        {
          linkId: 'alternative',
          text: 'Alternatif & Risiko',
          valueString: values.info_alternative,
          item: [
            {
              linkId: 'alternative-check',
              text: 'Sudah Dijelaskan',
              valueBoolean: values.check_alternative
            }
          ]
        },

        // Witnesses
        { linkId: 'witness1', text: 'Saksi 1', valueString: values.witness1_name },
        { linkId: 'witness2', text: 'Saksi 2', valueString: values.witness2_name },

        // Signatures
        {
          linkId: 'signature-doctor',
          text: 'Tanda Tangan Dokter',
          valueString: signatures['doctor']
        },
        {
          linkId: 'signature-receiver',
          text: 'Tanda Tangan Penerima',
          valueString: signatures['receiver']
        },
        {
          linkId: 'signature-witness1',
          text: 'Tanda Tangan Saksi 1',
          valueString: signatures['witness1']
        },
        {
          linkId: 'signature-witness2',
          text: 'Tanda Tangan Saksi 2',
          valueString: signatures['witness2']
        }
      ]

      const payload = {
        encounterId,
        subjectId: patientData?.subjectId || patientData?.patient?.id || '',
        status: QuestionnaireResponseStatus.COMPLETED,
        authored: values.assessment_date?.toISOString() || new Date().toISOString(),
        authorId: values.performerId,
        items
      }

      await createQuestionnaireResponse(payload)
      message.success('Informed Consent berhasil disimpan')
    } catch (err: any) {
      console.error('Failed to save Informed Consent:', err)
      message.error(err.message || 'Gagal menyimpan Informed Consent')
    }
  }

  const openSigModal = (type: string, title: string) => {
    setSigModal({ visible: true, type, title })
  }

  const saveSignature = (dataUrl: string) => {
    setSignatures((prev) => ({ ...prev, [sigModal.type]: dataUrl }))
  }

  const handlePreviewPrint = () => {
    const values = form.getFieldsValue()
    const performer = performersData?.find((p: any) => p.id === values.performerId)
    setFormDataForPrint({
      ...values,
      info_date: values.assessment_date,
      doctor_executor: performer?.name || '',
      info_provider: performer?.name || ''
    })
    setIsPreviewVisible(true)
  }

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Informed_Consent_${patientData?.patient?.name || ''}`
  })

  const renderInfoRow = (label: string, name: string, checkboxName: string) => (
    <div className="mb-4">
      <Row gutter={16}>
        <Col span={18}>
          <Form.Item label={label} name={name} className="mb-1">
            <TextArea rows={2} placeholder={`Penjelasan tentang ${label.toLowerCase()}...`} />
          </Form.Item>
        </Col>
        <Col span={6} className="pt-8 text-right">
          <Form.Item name={checkboxName} valuePropName="checked" className="mb-0">
            <Checkbox>Sudah Dijelaskan</Checkbox>
          </Form.Item>
        </Col>
      </Row>
      <Divider className="my-2" />
    </div>
  )

  const signatureBox = (type: string, label: string) => (
    <div className="flex flex-col items-center bg-white p-4 rounded-xl border border-gray-100 ">
      <Text strong className="mb-3 uppercase text-[10px] tracking-widest text-gray-400">
        {label}
      </Text>
      <div className="border border-gray-100 w-full h-32 flex items-center justify-center mb-4 bg-gray-50/30 rounded-lg overflow-hidden relative group">
        {signatures[type] ? (
          <img
            src={signatures[type]}
            alt="Signature"
            className="max-h-full transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <EditOutlined className="text-2xl opacity-20" />
            <Text className="text-[10px] italic">Belum Ada TTD</Text>
          </div>
        )}
      </div>
      <Button
        icon={<EditOutlined />}
        size="small"
        block
        className="rounded-lg text-xs"
        onClick={() => openSigModal(type, label)}
      >
        Tanda Tangan
      </Button>
    </div>
  )

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="flex flex-col gap-4"
      initialValues={{
        assessment_date: dayjs(),
        receiver_name: patientData?.patient?.name || '',
        receiver_birthdate: patientData?.patient?.birthDate
          ? dayjs(patientData.patient.birthDate)
          : undefined,
        receiver_address: patientData?.patient?.addressLine || '',
        consent_type: 'agree'
      }}
    >
      <Card
        className="border-none  rounded-xl overflow-hidden"
        bodyStyle={{ background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}
      >
        <Space align="start">
          <InfoCircleOutlined className="text-blue-500 text-xl mt-1" />
          <div>
            <Title level={5} className="mb-0">
              Persetujuan Tindakan Kedokteran
            </Title>
            <Text type="secondary" className="text-xs">
              Sesuai PMK No. 290 Th 2008 tentang Persetujuan Tindakan Kedokteran
            </Text>
          </div>
        </Space>
      </Card>

      <Card title="1. Pemberian Informasi" className=" rounded-xl">
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
      </Card>

      <Card title="2. Penerima Informasi / Wali" className=" rounded-xl">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Nama Penerima" name="receiver_name" rules={[{ required: true }]}>
              <Input placeholder="Nama pasien/wali" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Tanggal Lahir" name="receiver_birthdate">
              <DatePicker className="w-full" format="DD MMM YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Alamat" name="receiver_address">
              <Input placeholder="Alamat lengkap" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="3. Jenis Informasi (Materi Edukasi)" className=" rounded-xl">
        {renderInfoRow('Diagnosis (WD & DD)', 'info_diagnosis', 'check_diagnosis')}
        {renderInfoRow('Dasar Diagnosis', 'info_basis', 'check_basis')}
        {renderInfoRow('Tindakan Kedokteran', 'info_procedure', 'check_procedure')}
        {renderInfoRow('Indikasi Tindakan', 'info_indication', 'check_indication')}
        {renderInfoRow('Tata Cara', 'info_method', 'check_method')}
        {renderInfoRow('Tujuan', 'info_objective', 'check_objective')}
        {renderInfoRow('Risiko', 'info_risk', 'check_risk')}
        {renderInfoRow('Komplikasi', 'info_complication', 'check_complication')}
        {renderInfoRow('Prognosis', 'info_prognosis', 'check_prognosis')}
        {renderInfoRow('Alternatif & Risiko', 'info_alternative', 'check_alternative')}
      </Card>

      <Card
        title="4. Pernyataan Persetujuan / Penolakan"
        className=" rounded-xl overflow-hidden"
        headStyle={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
      >
        <div className="mb-6">
          <Form.Item
            name="consent_type"
            label={<Text strong>Pernyataan Pasien / Keluarga</Text>}
            rules={[{ required: true }]}
          >
            <Select
              size="large"
              className="w-full"
              options={[
                { label: 'SAYA SETUJU (MENYETUJUI) Dilakukan Tindakan Tersebut', value: 'agree' },
                {
                  label: 'SAYA TIDAK SETUJU (MENOLAK) Dilakukan Tindakan Tersebut',
                  value: 'reject'
                }
              ]}
            />
          </Form.Item>
          <Paragraph className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            Terhadap diri saya sendiri / Istri / Suami / Anak / Ayah / Ibu saya dengan Nama
            <Text strong className="mx-2 text-blue-600 underline">
              {patientData?.patient?.name || '..........'}
            </Text>
            , Lahir pada tanggal
            <Text strong className="mx-2 text-blue-600 underline">
              {patientData?.patient?.birthDate || '..........'}
            </Text>
          </Paragraph>
        </div>

        <Row gutter={24}>
          <Col span={12}>
            <Paragraph className="text-xs text-justify italic mb-4 text-gray-500">
              &quot;Dengan ini saya menyatakan bahwa saya telah memberikan informasi di atas secara
              jujur and lengkap kepada pasien/wali.&quot;
            </Paragraph>
            {signatureBox('doctor', 'Dokter Pelaksana')}
          </Col>
          <Col span={12}>
            <Paragraph className="text-xs text-justify italic mb-4 text-gray-500">
              &quot;Dengan ini saya menyatakan bahwa saya telah menerima informasi, memahami
              sepenuhnya, dan telah diberikan kesempatan bertanya.&quot;
            </Paragraph>
            {signatureBox('receiver', 'Pasien / Penerima Informasi')}
          </Col>
        </Row>
      </Card>

      <Card title="5. Saksi-Saksi" className=" rounded-xl">
        <Row gutter={32}>
          <Col span={12}>
            <Form.Item label="Saksi 1 (Pihak Keluarga)" name="witness1_name">
              <Input placeholder="Nama lengkap saksi" className="mb-4" />
            </Form.Item>
            {signatureBox('witness1', 'Tanda Tangan Saksi 1')}
          </Col>
          <Col span={12}>
            <Form.Item label="Saksi 2 (Paramedis/Saksi RS)" name="witness2_name">
              <Input placeholder="Nama lengkap saksi" className="mb-4" />
            </Form.Item>
            {signatureBox('witness2', 'Tanda Tangan Saksi 2')}
          </Col>
        </Row>
      </Card>

      <div className="flex justify-end pt-4 pb-8">
        <Space size="middle">
          <Button
            size="large"
            icon={<PrinterOutlined />}
            onClick={handlePreviewPrint}
            className="px-8 h-12 rounded-lg"
          >
            Preview & Print
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            className="px-8 h-12 rounded-lg shadow-lg"
            onClick={() => form.submit()}
          >
            Simpan Final
          </Button>
        </Space>
      </div>

      <SignaturePadModal
        title={sigModal.title}
        visible={sigModal.visible}
        onClose={() => setSigModal({ ...sigModal, visible: false })}
        onSave={saveSignature}
      />

      <Modal
        title="Preview Cetak Informed Consent"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        width={900}
        centered
        footer={[
          <Button key="close" onClick={() => setIsPreviewVisible(false)}>
            Tutup
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Cetak Sekarang
          </Button>
        ]}
      >
        <div className="p-8 flex justify-center bg-gray-200">
          <InformedConsentLetter
            ref={printRef}
            data={formDataForPrint}
            patientData={patientData}
            signatures={signatures}
          />
        </div>
      </Modal>
    </Form>
  )
}
