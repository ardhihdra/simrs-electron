import { Pie } from '@ant-design/charts'
import { Card } from 'antd'
import type { PaymentMethodRatioDataPoint } from '../../types/dashboard-pendaftaran.types'

interface PaymentMethodRatioChartProps {
  data: PaymentMethodRatioDataPoint[]
}

/**
 * Donut chart showing payment method composition (BPJS / Umum / Asuransi).
 * Used for monitoring patient financing mix (spec §2.5).
 */
export default function PaymentMethodRatioChart({ data }: PaymentMethodRatioChartProps) {
  const config = {
    data,
    angleField: 'count',
    colorField: 'method',
    innerRadius: 0.6,
    legend: { color: { position: 'bottom' as const } },
    label: {
      position: 'outside' as const,
      text: (record: PaymentMethodRatioDataPoint) =>
        `${record.method}: ${record.count}`
    },
    tooltip: {
      items: [{ channel: 'y', name: 'Pasien' }]
    }
  }

  return (
    <Card title="Rasio BPJS vs Umum" size="small" variant="outlined">
      <Pie {...config} height={220} />
    </Card>
  )
}
