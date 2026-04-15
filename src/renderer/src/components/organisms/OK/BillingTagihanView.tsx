import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography
} from 'antd'
import { DollarOutlined, PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useReactToPrint } from 'react-to-print'
import { BillingTagihanLetter } from './BillingTagihanLetter'
import type {
  BillingChargeRow,
  BillingComputedData,
  BillingKomponenRow,
  BillingLetterMeta
} from './billing-types'

const { Text } = Typography

export type {
  BillingChargeRow,
  BillingComputedData,
  BillingKomponenRow,
  BillingLetterMeta
} from './billing-types'

interface BillingTagihanViewProps {
  computedData?: BillingComputedData | null
  warnings?: string[]
  letterMeta?: BillingLetterMeta
  isLoading?: boolean
  emptyState?: string
}

const formatCurrency = (value: number): string => `Rp ${Number(value || 0).toLocaleString('id-ID')}`

export const TagihanOKView = ({
  computedData,
  warnings = [],
  letterMeta,
  isLoading = false,
  emptyState = 'Belum ada data tagihan untuk ditampilkan.'
}: BillingTagihanViewProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const dedupedWarnings = useMemo(
    () => Array.from(new Set((warnings || []).filter(Boolean))),
    [warnings]
  )

  const canPrint = Boolean(computedData && computedData.chargeRows.length > 0)

  const documentTitle = useMemo(() => {
    const code = String(letterMeta?.transactionCode || '').trim()
    const sanitizedCode = code ? code.replace(/[^a-zA-Z0-9_-]/g, '_') : ''
    return `Rincian_Tagihan_OK_${sanitizedCode || dayjs().format('YYYYMMDD_HHmmss')}`
  }, [letterMeta?.transactionCode])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle
  })

  if (isLoading) {
    return (
      <Card className="shadow-none border-gray-100">
        <div className="py-10 flex justify-center">
          <Spin tip="Menghitung tagihan operasi..." />
        </div>
      </Card>
    )
  }

  if (!computedData || computedData.chargeRows.length === 0) {
    return (
      <div className="space-y-4">
        <Alert
          type="info"
          showIcon
          message="Tagihan akan dihitung dari paket pengajuan, tarif kelas aktif, dan BHP non-included."
        />
        <Card size="small" className="shadow-none border-gray-200">
          <Empty description={emptyState} />
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="!space-y-3">
        <Alert
          type="success"
          showIcon
          message="Tagihan dihitung dari paket pengajuan + kelas tarif + BHP tambahan (non-included)."
        />

        {dedupedWarnings.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`Ada ${dedupedWarnings.length} catatan validasi tarif.`}
            description={
              <ul className="list-disc pl-5 mb-0">
                {dedupedWarnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            }
          />
        )}

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Total Tarif Paket"
                value={computedData.totals.tarifPaketTotal}
                formatter={(v) => formatCurrency(Number(v || 0))}
                valueStyle={{ color: '#3b82f6', fontSize: 14 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Total BHP Tambahan"
                value={computedData.totals.bhpTambahanTotal}
                formatter={(v) => formatCurrency(Number(v || 0))}
                valueStyle={{ color: '#d97706', fontSize: 14 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Grand Total"
                value={computedData.totals.grandTotal}
                formatter={(v) => formatCurrency(Number(v || 0))}
                valueStyle={{ color: '#16a34a', fontWeight: 'bold', fontSize: 14 }}
              />
            </Card>
          </Col>
        </Row>

        <Card size="small" title="Ringkasan Tagihan" className="shadow-none border-gray-200">
          <Table<BillingChargeRow>
            dataSource={computedData.chargeRows}
            rowKey="key"
            size="small"
            pagination={false}
            columns={[
              {
                title: 'Kategori',
                dataIndex: 'kategori',
                key: 'kategori',
                width: 140,
                render: (value) => (
                  <Tag color={value === 'Tarif Paket' ? 'blue' : 'orange'}>{value}</Tag>
                )
              },
              { title: 'Paket', dataIndex: 'paket', key: 'paket' },
              { title: 'Keterangan', dataIndex: 'keterangan', key: 'keterangan' },
              { title: 'Kelas', dataIndex: 'kelas', key: 'kelas', width: 110 },
              {
                title: 'Qty',
                dataIndex: 'jumlah',
                key: 'jumlah',
                width: 70,
                align: 'right' as const
              },
              { title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 90 },
              {
                title: 'Harga/Unit',
                dataIndex: 'harga',
                key: 'harga',
                width: 150,
                align: 'right' as const,
                render: (value: number) => formatCurrency(value)
              },
              {
                title: 'Subtotal',
                dataIndex: 'subtotal',
                key: 'subtotal',
                width: 150,
                align: 'right' as const,
                render: (value: number) => <Text strong>{formatCurrency(value)}</Text>
              }
            ]}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7}>
                  <Text strong>Grand Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#16a34a' }}>
                    {formatCurrency(computedData.totals.grandTotal)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>

        <Card
          size="small"
          title="Rincian Komponen Tarif (Informasi Transparansi)"
          className="shadow-none border-gray-200"
        >
          {computedData.komponenRows.length === 0 ? (
            <Empty description="Komponen tarif belum tersedia untuk kelas paket terpilih." />
          ) : (
            <Table<BillingKomponenRow>
              dataSource={computedData.komponenRows}
              rowKey="key"
              size="small"
              pagination={false}
              columns={[
                { title: 'Paket', dataIndex: 'paket', key: 'paket' },
                { title: 'Kelas', dataIndex: 'kelas', key: 'kelas', width: 110 },
                { title: 'Tindakan', dataIndex: 'tindakan', key: 'tindakan' },
                { title: 'Komponen', dataIndex: 'komponen', key: 'komponen' },
                {
                  title: 'Nominal',
                  dataIndex: 'nominal',
                  key: 'nominal',
                  width: 150,
                  align: 'right' as const,
                  render: (value: number) => formatCurrency(value)
                }
              ]}
            />
          )}
        </Card>

        <Alert
          type="success"
          showIcon
          message="Tagihan ini sudah siap diterbitkan ke sistem billing."
        />
        <div className="flex justify-end gap-2">
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => setIsPreviewOpen(true)}
            disabled={!canPrint}
          >
            Cetak Rincian
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            style={{ background: '#10b981', border: 'none' }}
          >
            Terbitkan Tagihan
          </Button>
        </div>
      </div>

      <Modal
        title="Preview Rincian Tagihan Operasi"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        width={920}
        centered
        footer={[
          <Button key="close" onClick={() => setIsPreviewOpen(false)}>
            Tutup
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
        ]}
        styles={{
          body: { padding: 0, background: '#f0f2f5', maxHeight: '80vh', overflow: 'auto' }
        }}
      >
        <div className="p-4 flex justify-center">
          {canPrint && (
            <BillingTagihanLetter
              ref={printRef}
              computedData={computedData}
              warnings={dedupedWarnings}
              letterMeta={letterMeta}
            />
          )}
        </div>
      </Modal>
    </>
  )
}
