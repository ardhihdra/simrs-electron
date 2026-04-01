import { Form, Input, InputNumber, Modal, Table, Typography, Descriptions, Divider } from 'antd'
import { useEffect, useMemo } from 'react'

const { Title, Text } = Typography

const denominations = [
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100
]

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}

interface DenomRow {
  key: string
  label: string
  value: number
}

// Subcomponent to isolate subtotal re-renders
const SubtotalCell = ({ value }: { value: number }) => {
  const form = Form.useFormInstance()
  const qty = Form.useWatch(`denom_${value}`, form) || 0
  return <Text>{formatCurrency(qty * value)}</Text>
}

// Subcomponent to isolate total cash re-renders
const TotalCashDisplay = () => {
  const form = Form.useFormInstance()
  const values = Form.useWatch([], form)
  
  const total = useMemo(() => {
    if (!values) return 0
    return denominations.reduce((acc, d) => {
      const qty = values[`denom_${d}`] || 0
      return acc + (qty * d)
    }, 0)
  }, [values])

  return <Text strong className="text-xl text-blue-600">{formatCurrency(total)}</Text>
}

// Subcomponent to isolate discrepancy re-renders in closing mode
const DiscrepancyTitle = ({ expectedFinalCash }: { expectedFinalCash: number }) => {
  const form = Form.useFormInstance()
  const values = Form.useWatch([], form)
  
  const totalCash = useMemo(() => {
    if (!values) return 0
    return denominations.reduce((acc, d) => {
        const qty = values[`denom_${d}`] || 0
        return acc + (qty * d)
    }, 0)
  }, [values])

  const diff = totalCash - (expectedFinalCash || 0)
  
  return (
    <Title level={4} type={diff < 0 ? 'danger' : 'success'}>
        {formatCurrency(diff)}
    </Title>
  )
}

export interface KasirShiftModalProps {
  visible: boolean
  mode: 'OPEN' | 'CLOSE'
  onCancel: () => void
  onConfirm: (values: any) => void
  loading?: boolean
  summaryData?: any // Calculated revenue etc. for CLOSE mode
}

export default function KasirShiftModal({
  visible,
  mode,
  onCancel,
  onConfirm,
  loading,
  summaryData
}: KasirShiftModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (visible) {
      form.resetFields()
      if (mode === 'OPEN') {
        denominations.forEach(d => form.setFieldValue(`denom_${d}`, 0))
      }
    }
  }, [visible, form, mode])

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const denomDetails: Record<string, number> = {}
      let total = 0
      denominations.forEach(d => {
        const qty = values[`denom_${d}`] || 0
        denomDetails[String(d)] = qty
        total += (qty * d)
      })
      
      onConfirm({
        ...(mode === 'OPEN' ? { initialCash: total, initialCashDetails: denomDetails } : { finalCash: total, finalCashDetails: denomDetails }),
        note: values.note
      })
    })
  }

  const columns = [
    {
      title: 'Pecahan',
      dataIndex: 'label',
      key: 'label',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Jumlah (Lembar/Keping)',
      dataIndex: 'value',
      key: 'value',
      render: (_: any, record: DenomRow) => (
        <Form.Item name={`denom_${record.value}`} noStyle initialValue={0}>
          <InputNumber min={0} defaultValue={0} className="w-full" precision={0} />
        </Form.Item>
      )
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      align: 'right' as const,
      render: (_: any, record: DenomRow) => <SubtotalCell value={record.value} />
    }
  ]

  const dataSource: DenomRow[] = denominations.map(d => ({
    key: String(d),
    label: formatCurrency(d),
    value: d
  }))

  return (
    <Modal
      title={mode === 'OPEN' ? 'Buka Kasir - Input Saldo Awal' : 'Tutup Kasir - Input Saldo Akhir'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText={mode === 'OPEN' ? 'Buka Kasir' : 'Tutup Kasir'}
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical">
        {mode === 'CLOSE' && summaryData && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Title level={5}>Ringkasan Shift</Title>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Total Pendapatan">{formatCurrency(summaryData.totalRevenue || 0)}</Descriptions.Item>
              <Descriptions.Item label="Total Tunai">{formatCurrency(summaryData.totalCash || 0)}</Descriptions.Item>
              <Descriptions.Item label="Total Bank/Transfer">{formatCurrency(summaryData.totalBank || 0)}</Descriptions.Item>
              <Descriptions.Item label="Total Pasien Rajal">{summaryData.totalOutpatient || 0}</Descriptions.Item>
              <Descriptions.Item label="Total Pasien Ranap">{summaryData.totalInpatient || 0}</Descriptions.Item>
              <Descriptions.Item label="Ekspektasi Kas">
                 <Text strong type="success">{formatCurrency(summaryData.expectedFinalCash || 0)}</Text>
              </Descriptions.Item>
            </Descriptions>
            <Divider dashed />
            <div className="flex justify-between items-center px-2">
                 <Text type="secondary">Ekspektasi Kas dihitung dari (Saldo Awal + Total Tunai).</Text>
                 <div className="text-right">
                    <div className="text-xs uppercase text-gray-400">Selisih</div>
                    <DiscrepancyTitle expectedFinalCash={summaryData.expectedFinalCash} />
                 </div>
            </div>
          </div>
        )}

        <Table 
          dataSource={dataSource} 
          columns={columns} 
          pagination={false} 
          size="small" 
          bordered
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row className="bg-blue-50">
                <Table.Summary.Cell index={0} colSpan={2}>
                  <Text strong>TOTAL KAS FISIK</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <TotalCashDisplay />
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <div className="mt-4">
          <Form.Item name="note" label="Catatan">
            <Input.TextArea rows={2} placeholder="Tambahkan catatan jika ada..." />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}
