import { Line } from '@ant-design/charts'
import { Card } from 'antd'
import type { WaitTimeTrendDataPoint } from '../../types/dashboard-pendaftaran.types'

interface WaitTimeTrendChartProps {
  data: WaitTimeTrendDataPoint[]
}

/**
 * Time-series line chart showing average wait time per hour.
 * Used for SLA evaluation and detecting service bottlenecks (spec §2.3).
 * Color zones: < 30 min OK, 30–60 min warn, > 60 min critical.
 */
export default function WaitTimeTrendChart({ data }: WaitTimeTrendChartProps) {
  const config = {
    data,
    xField: 'hour',
    yField: 'averageWaitMinutes',
    point: { shapeField: 'circle', sizeField: 4 },
    style: { lineWidth: 2, stroke: '#fa8c16' },
    axis: {
      x: { title: 'Jam' },
      y: { title: 'Menit' }
    },
    annotations: [
      {
        type: 'lineY',
        yField: 30,
        style: { stroke: '#faad14', lineDash: [4, 4] },
        label: { text: '30 menit', position: 'right', style: { fill: '#faad14' } }
      },
      {
        type: 'lineY',
        yField: 60,
        style: { stroke: '#ff4d4f', lineDash: [4, 4] },
        label: { text: '60 menit', position: 'right', style: { fill: '#ff4d4f' } }
      }
    ],
    tooltip: {
      items: [{ channel: 'y', name: 'Rata-rata Tunggu (menit)' }]
    }
  }

  return (
    <Card title="Tren Waktu Tunggu" size="small" variant="outlined">
      <Line {...config} height={220} />
    </Card>
  )
}
