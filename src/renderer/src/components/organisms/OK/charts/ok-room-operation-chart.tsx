import { Bar } from '@ant-design/charts'
import { Card } from 'antd'

interface OkRoomOperationDataPoint {
  room: string
  total: number
}

interface OkRoomOperationChartProps {
  data: OkRoomOperationDataPoint[]
}

export default function OkRoomOperationChart({ data }: OkRoomOperationChartProps) {
  const config = {
    data,
    xField: 'total',
    yField: 'room',
    axis: {
      x: { title: 'Jumlah Operasi' },
      y: { title: 'Ruang OK' }
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
    <Card title="Statistik Operasi - Jumlah per Ruang" size="small" variant="outlined">
      <Bar {...config} height={220} />
    </Card>
  )
}
