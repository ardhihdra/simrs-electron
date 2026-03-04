import { Line } from '@ant-design/charts'
import { Card } from 'antd'
import type { PatientsPerHourDataPoint } from '../../types/dashboard-pendaftaran.types'

interface PatientsPerHourChartProps {
  data: PatientsPerHourDataPoint[]
}

/**
 * Line chart showing patient arrival count grouped by hour.
 * Helps identify peak hours for workforce planning (spec §2.1).
 */
export default function PatientsPerHourChart({ data }: PatientsPerHourChartProps) {
  const config = {
    data,
    xField: 'hour',
    yField: 'patientCount',
    point: { shapeField: 'circle', sizeField: 4 },
    interaction: { tooltip: { marker: false } },
    style: { lineWidth: 2 },
    axis: {
      x: { title: 'Jam' },
      y: { title: 'Jumlah Pasien' }
    },
    tooltip: {
      items: [{ channel: 'y', name: 'Pasien' }]
    }
  }

  return (
    <Card title="Pasien per Jam" size="small" variant="outlined">
      <Line {...config} height={220} />
    </Card>
  )
}
