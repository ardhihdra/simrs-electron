import { Bar } from '@ant-design/charts'
import { Card } from 'antd'

interface OkStatusDistributionDataPoint {
  statusKey: string
  status: string
  total: number
}

interface OkStatusDistributionChartProps {
  data: OkStatusDistributionDataPoint[]
}

export default function OkStatusDistributionChart({ data }: OkStatusDistributionChartProps) {
  const config = {
    data,
    xField: 'total',
    yField: 'status',
    axis: {
      x: { title: 'Jumlah Operasi' },
      y: { title: 'Status Operasi' }
    },
    tooltip: {
      items: [{ channel: 'x', name: 'Operasi' }]
    },
    style: {
      fill: '#1677ff',
      radiusTopLeft: 4,
      radiusTopRight: 4
    }
  }

  return (
    <Card title="Statistik Operasi - Distribusi Status" size="small" variant="outlined">
      <Bar {...config} height={220} />
    </Card>
  )
}
