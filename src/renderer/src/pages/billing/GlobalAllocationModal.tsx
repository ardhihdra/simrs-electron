import { SyncOutlined } from '@ant-design/icons'
import { Button, Col, InputNumber, Modal, Row, Statistic, Typography } from 'antd'
import DebouncedInputNumber from './DebouncedInputNumber'

const { Text } = Typography

interface Summary {
  total: number
  asuransi: number
  rs: number
  pasien: number
}

interface GlobalAllocationModalProps {
  open: boolean
  onCancel: () => void
  summary: Summary
  globalAsuransi: number
  globalRS: number
  setGlobalAsuransi: (val: number) => void
  setGlobalRS: (val: number) => void
  onApply: () => void
}

export default function GlobalAllocationModal({
  open,
  onCancel,
  summary,
  globalAsuransi,
  globalRS,
  setGlobalAsuransi,
  setGlobalRS,
  onApply
}: GlobalAllocationModalProps) {
  const pasienRemainder = summary.total - globalAsuransi - globalRS
  const isOverAllocated = pasienRemainder < 0

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-700 pb-2 border-b">
          <SyncOutlined />
          <span>Alokasi Otomatis (Plafon Global)</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Batal
        </Button>,
        <Button
          key="reset"
          danger
          onClick={() => {
            setGlobalAsuransi(0)
            setGlobalRS(0)
          }}
        >
          Reset Alokasi
        </Button>,
        <Button
          key="apply"
          type="primary"
          icon={<SyncOutlined />}
          onClick={onApply}
          disabled={isOverAllocated || (globalAsuransi === 0 && globalRS === 0)}
        >
          Terapkan Alokasi
        </Button>
      ]}
    >
      <div className="py-6 space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100 px-8">
          <Statistic title="Total Tagihan" value={summary.total} prefix="Rp" />
        </div>

        <div className="space-y-4 px-4">
          <Row align="middle" gutter={16}>
            <Col span={7}>
              <Text strong className="text-slate-600">
                Plafon Asuransi
              </Text>
            </Col>
            <Col span={17}>
              <DebouncedInputNumber
                style={{ width: '100%' }}
                size="large"
                min={0}
                max={summary.total}
                value={globalAsuransi}
                onChange={(v: number) => setGlobalAsuransi(v || 0)}
                formatter={(value: number | string) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value: string) => Number(value.replace(/Rp\s?|(,*)/g, '')) || 0}
                debounceMs={300}
              />
            </Col>
          </Row>

          <Row align="middle" gutter={16}>
            <Col span={7}>
              <Text strong className="text-slate-600">
                Plafon RS
              </Text>
            </Col>
            <Col span={17}>
              <DebouncedInputNumber
                style={{ width: '100%' }}
                size="large"
                min={0}
                max={summary.total}
                value={globalRS}
                onChange={(v: number) => setGlobalRS(v || 0)}
                formatter={(value: number | string) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value: string) => Number(value.replace(/Rp\s?|(,*)/g, '')) || 0}
                debounceMs={300}
              />
            </Col>
          </Row>

          <Row align="middle" gutter={16}>
            <Col span={7}>
              <Text strong className={isOverAllocated ? 'text-red-600' : 'text-green-600'}>
                Tanggungan Pasien
              </Text>
              <div className="text-xs text-slate-400">(sisa otomatis)</div>
            </Col>
            <Col span={17}>
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                value={pasienRemainder}
                disabled
                status={isOverAllocated ? 'error' : undefined}
                formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                className={isOverAllocated ? 'bg-red-50' : 'bg-green-50'}
              />
              {isOverAllocated && (
                <Text type="danger" className="text-xs mt-1 block">
                  Total plafon melebihi total tagihan!
                </Text>
              )}
            </Col>
          </Row>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-100 flex items-start gap-2">
          <Text type="secondary" className="text-xs">
            ⓘ Masukkan plafon asuransi dan plafon RS. Sisa tagihan akan otomatis menjadi tanggungan
            pasien dan dibagi secara proporsional ke semua item.
          </Text>
        </div>
      </div>
    </Modal>
  )
}
