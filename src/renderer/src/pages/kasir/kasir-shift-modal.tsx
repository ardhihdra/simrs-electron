import { Form, Input, InputNumber, Modal, Table, Typography, Descriptions, Divider, Button } from 'antd'
import { useEffect, useMemo, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PrinterOutlined } from '@ant-design/icons'
import { useProfileStore } from '../../store/profileStore'

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
  const { profile } = useProfileStore()
  const currentNote = Form.useWatch('note', form)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef
  })

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
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Batal
        </Button>,
        mode === 'CLOSE' && (
          <Button 
            key="print" 
            icon={<PrinterOutlined />} 
            onClick={() => handlePrint()}
          >
            Cetak Laporan
          </Button>
        ),
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {mode === 'OPEN' ? 'Buka Kasir' : 'Tutup Kasir'}
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <div ref={printRef} className="print:p-0 print:text-[10pt]">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { margin: 10mm; }
              .ant-descriptions-item-label, .ant-descriptions-item-content { padding: 4px 8px !important; font-size: 9pt !important; }
              .ant-table-cell { padding: 2px 4px !important; font-size: 9pt !important; }
              .ant-table-summary .ant-table-cell { font-size: 10pt !important; }
              h3.ant-typography { font-size: 14pt !important; margin-bottom: 8px !important; }
              .ant-divider { margin: 8px 0 !important; }
            }
          `}} />
          
          {/* Header khusus print */}
          <div className="hidden print:block mb-4 border-b border-gray-800 pb-2">
            <Title level={3} className="text-center uppercase mb-2">LAPORAN PENUTUPAN KASIR</Title>
            <div className="flex justify-between items-end px-2">
               <div className="flex flex-col">
                 <Text className="text-[8pt] uppercase text-gray-500">Petugas Kasir</Text>
                 <Text className="text-sm font-bold uppercase">{profile?.username || '-'}</Text>
               </div>
               <div className="text-right flex flex-col">
                 <Text className="text-[8pt] uppercase text-gray-500">Waktu Cetak</Text>
                 <Text className="text-xs italic">{new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</Text>
               </div>
            </div>
          </div>

          {mode === 'CLOSE' && summaryData && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 print:bg-white print:border-none print:p-0">
            <Title level={5} className="text-blue-600 print:text-sm print:mb-2">Ringkasan Pendapatan Shift</Title>
            <Descriptions 
              bordered 
              size="small" 
              column={2}
              labelStyle={{ width: '20%' }}
              contentStyle={{ width: '30%' }}
            >
              <Descriptions.Item label="Total Pendapatan">{formatCurrency(summaryData.totalRevenue || 0)}</Descriptions.Item>
              <Descriptions.Item label="Total Tunai">{formatCurrency(summaryData.totalCash || 0)}</Descriptions.Item>
              <Descriptions.Item label="Total Bank/Transfer">{formatCurrency(summaryData.totalBank || 0)}</Descriptions.Item>
              <Descriptions.Item label="Total Pasien Rajal">{summaryData.totalOutpatient || 0}</Descriptions.Item>
              <Descriptions.Item label="Total Pasien Ranap">{summaryData.totalInpatient || 0}</Descriptions.Item>
              <Descriptions.Item label="Ekspektasi Kas">
                 <Text strong type="success">{formatCurrency(summaryData.expectedFinalCash || 0)}</Text>
              </Descriptions.Item>
            </Descriptions>
            <div className="hidden print:flex justify-between items-center mt-2 px-2">
                  <Text className="text-[8pt] italic text-gray-500">Ekspektasi Kas = Saldo Awal + Total Tunai</Text>
                  <div className="text-right flex items-center gap-2">
                     <Text className="text-[8pt] uppercase text-gray-400">Selisih:</Text>
                     <div className="text-sm font-bold">
                        <DiscrepancyTitle expectedFinalCash={summaryData.expectedFinalCash} />
                     </div>
                  </div>
            </div>
            <div className="print:hidden">
              <Divider dashed className="my-3" />
              <div className="flex justify-between items-center px-2">
                  <Text type="secondary" className="text-xs">Ekspektasi Kas dihitung dari (Saldo Awal + Total Tunai).</Text>
                  <div className="text-right">
                      <div className="text-xs uppercase text-gray-400">Selisih</div>
                      <DiscrepancyTitle expectedFinalCash={summaryData.expectedFinalCash} />
                  </div>
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
          className="mb-4"
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

        <div className="mt-4 print:hidden">
          <Form.Item name="note" label="Catatan">
            <Input.TextArea rows={2} placeholder="Tambahkan catatan jika ada..." />
          </Form.Item>
        </div>

        {/* Tampilan Note Khusus Print */}
        <div className="hidden print:block mt-2 border-t pt-2">
           <Text strong className="text-xs block mb-1">Catatan:</Text>
           <div className="text-[9pt] italic leading-tight min-h-[1em]">
              {currentNote || '-'}
           </div>
        </div>

        {/* Signature Section Khusus Print */}
        <div className="hidden print:flex justify-between mt-8 px-10">
           <div className="text-center w-48">
              <Text className="block mb-12 text-[8pt] uppercase">Kasir,</Text>
              <div className="border-b border-gray-800 w-full mb-1"></div>
              <Text className="text-[8pt] italic">( {profile?.username || 'Nama Lengkap'} )</Text>
           </div>
           
           <div className="text-center w-48">
              <Text className="block mb-12 text-[8pt] uppercase">Supervisor/Verifikator,</Text>
              <div className="border-b border-gray-800 w-full mb-1"></div>
              <Text className="text-[8pt] italic">( Tanda Tangan & Nama )</Text>
           </div>
        </div>
      </div>
    </Form>
  </Modal>
  )
}
