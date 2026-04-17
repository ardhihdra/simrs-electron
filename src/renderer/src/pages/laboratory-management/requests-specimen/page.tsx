import { ArrowLeftOutlined } from '@ant-design/icons'
import { useLaboratoryActions } from '@renderer/pages/Laboratory/useLaboratoryActions'
import { client } from '@renderer/utils/client'
import { hasValidationErrors, notifyFormValidationError } from '@renderer/utils/form-feedback'
import { App, Button, Card, Descriptions, Form, Select, Spin, Tag, Typography } from 'antd'
import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useReactToPrint } from 'react-to-print'
import { resolveAncillaryRouteBase } from '../section-config'
import { buildSpecimenTypeOptions, getLatestCollectedSpecimen } from './page.helpers'

const { Title, Text } = Typography

export default function CollectSpecimenPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const record = (location.state as Record<string, any> | null) || {}
  const requestId = String(record.id || '')
  const sectionRouteBase =
    String(record.sectionRouteBase || '') || resolveAncillaryRouteBase(location.pathname)
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [savedSpecimen, setSavedSpecimen] = useState<Record<string, any> | null>(null)
  const labelPrintRef = useRef<HTMLDivElement>(null)
  const { handleCollectSpecimen, loading } = useLaboratoryActions()

  const {
    data: completeOrderData,
    isLoading: isLoadingOrder,
    refetch: refetchOrder
  } = client.laboratoryManagement.getCompleteOrder.useQuery(
    { id: requestId },
    {
      enabled: requestId.length > 0,
      queryKey: ['laboratoryManagement.getCompleteOrder', { id: requestId }]
    }
  )

  const { data: specimenTypeData, isLoading: isLoadingSpecimenTypes } =
    client.query.entity.useQuery(
      {
        model: 'referencecode',
        method: 'get',
        params: {
          category: 'SPECIMEN_TYPE',
          items: '100',
          sortBy: 'display',
          sortOrder: 'ASC'
        }
      },
      {
        queryKey: ['specimen-type-reference-codes']
      } as any
    )

  const { data: collectorRows = [], isLoading: isLoadingCollectors } = client.query.entity.useQuery(
    {
      model: 'kepegawaian',
      method: 'get',
      params: {
        hakAksesId: 'lab_technician',
        items: '100'
      }
    }
  )

  const orderDetail = (completeOrderData as Record<string, any> | undefined)?.result as
    | Record<string, any>
    | undefined
  const specimenTypeOptions = useMemo(() => {
    const raw = specimenTypeData as Record<string, any> | undefined
    const rows = (raw?.result || raw?.data || raw || []) as Array<Record<string, any>>
    return buildSpecimenTypeOptions(rows)
  }, [specimenTypeData])

  const collectorOptions = useMemo(() => {
    return collectorRows?.result?.map((item) => ({
      value: item.id,
      label: item.namaLengkap
    }))
  }, [collectorRows])

  const latestCollectedSpecimen = useMemo(() => {
    const specimens = Array.isArray(orderDetail?.specimens) ? orderDetail.specimens : []
    return getLatestCollectedSpecimen(specimens)
  }, [orderDetail?.specimens])

  const activeSpecimen = savedSpecimen || latestCollectedSpecimen
  const typeLabelById = useMemo(
    () => new Map(specimenTypeOptions.map((item) => [item.value, item.label])),
    [specimenTypeOptions]
  )

  const handlePrintLabel = useReactToPrint({
    contentRef: labelPrintRef,
    documentTitle: activeSpecimen?.labelNumber
      ? `Label_Specimen_${activeSpecimen.labelNumber}`
      : 'Label_Specimen'
  })

  if (!location.state) {
    return (
      <div className="p-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <div className="mt-4">No record selected</div>
      </div>
    )
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      console.log('Input:', {
        serviceRequestId: record.id,
        typeCodeId: values.typeCodeId,
        collectorPegawaiId: values.collectorPegawaiId
      })
      const result = await handleCollectSpecimen({
        serviceRequestId: record.id,
        typeCodeId: values.typeCodeId,
        collectorPegawaiId: values.collectorPegawaiId
      })
      setSavedSpecimen(result || null)
      await refetchOrder()
      handlePrintLabel()
    } catch (error) {
      console.error(error)
      if (hasValidationErrors(error)) {
        notifyFormValidationError(form, message, error, 'Lengkapi data sampel terlebih dahulu.')
      }
    }
  }

  const selectedTypeCodeId = String(
    form.getFieldValue('typeCodeId') || activeSpecimen?.typeCodeId || ''
  )

  const patientName = String(record.patient?.name || '-')
  const patientMrn = String(record.patient?.mrn || '-')
  const testDisplay = String(record.testDisplay || record.test?.name || '-')
  const testCode = String(record.test?.code || '-')
  const specimenTypeLabel = typeLabelById.get(selectedTypeCodeId) || '-'
  console.log(record)
  return (
    <div className="p-4">
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`${sectionRouteBase}/requests`)}
        >
          Back
        </Button>
      </div>

      <Card title="Pengambilan Sampel">
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <Text type="secondary">Pasien</Text>
            <Title level={5}>{patientName}</Title>
            <Text>{patientMrn}</Text>
          </div>
          <div>
            <Text type="secondary">Pemeriksaan</Text>
            <Title level={5}>{testDisplay}</Title>
            <Text>{testCode}</Text>
          </div>
        </div>

        {isLoadingOrder ? (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <Spin size="small" />
            <span>Memuat detail order specimen...</span>
          </div>
        ) : null}

        {activeSpecimen ? (
          <Card size="small" className="mb-6! bg-slate-50">
            <Descriptions size="small" column={2} title="Specimen Tersimpan">
              <Descriptions.Item label="No. Label">
                <Tag color="blue">{activeSpecimen.labelNumber || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">{activeSpecimen.status || 'COLLECTED'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Jenis Sampel">{specimenTypeLabel}</Descriptions.Item>
            </Descriptions>
          </Card>
        ) : null}

        <Form
          form={form}
          layout="vertical"
          onFinishFailed={(errorInfo) =>
            notifyFormValidationError(
              form,
              message,
              errorInfo,
              'Lengkapi data sampel terlebih dahulu.'
            )
          }
        >
          <Form.Item name="typeCodeId" label="Jenis Sampel" rules={[{ required: true }]}>
            <Select
              placeholder="Pilih Jenis Sampel"
              loading={isLoadingSpecimenTypes}
              options={specimenTypeOptions}
            />
          </Form.Item>

          <Form.Item
            name="collectorPegawaiId"
            label="Petugas Pengambil Specimen"
            rules={[{ required: true, message: 'Pilih petugas pengambil specimen' }]}
          >
            <Select
              placeholder="Pilih petugas pengambil specimen"
              loading={isLoadingCollectors}
              options={collectorOptions}
            />
          </Form.Item>

          <div className="flex gap-2">
            <Button type="primary" onClick={handleSubmit} loading={loading === 'collect-specimen'}>
              Simpan Sampel
            </Button>
            <Button onClick={() => navigate(`${sectionRouteBase}/requests`)}>Batal</Button>
            <Button onClick={() => handlePrintLabel()} disabled={!activeSpecimen?.labelNumber}>
              Print Label
            </Button>
          </div>
        </Form>

        <div className="sr-only">
          <div ref={labelPrintRef} className="p-4 text-black">
            <div style={{ width: '320px', border: '1px solid #111', padding: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>LABEL SPECIMEN LAB</div>
              <div style={{ fontSize: '28px', fontWeight: 700, margin: '8px 0' }}>
                {activeSpecimen?.labelNumber || '-'}
              </div>
              <div style={{ fontSize: '12px' }}>Pasien: {patientName}</div>
              <div style={{ fontSize: '12px' }}>No. RM: {patientMrn}</div>
              <div style={{ fontSize: '12px' }}>Pemeriksaan: {testDisplay}</div>
              <div style={{ fontSize: '12px' }}>Jenis Sampel: {specimenTypeLabel}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
