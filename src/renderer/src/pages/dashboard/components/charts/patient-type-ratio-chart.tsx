import { Pie } from '@ant-design/charts'
import { Card } from 'antd'
import type { PatientTypeRatioDataPoint } from '../../types/dashboard-pendaftaran.types'

interface PatientTypeRatioChartProps {
  data: PatientTypeRatioDataPoint[]
}

/**
 * Donut chart showing proportion of new vs returning patients.
 * Used for patient growth analysis (spec §2.4).
 */
export default function PatientTypeRatioChart({ data }: PatientTypeRatioChartProps) {
  const config = {
    data,
    angleField: 'count',
    colorField: 'type',
    innerRadius: 0.6,
    legend: { color: { position: 'bottom' as const } },
    label: {
      position: 'outside' as const,
      text: (record: PatientTypeRatioDataPoint) =>
        `${record.type}: ${record.count}`
    },
    tooltip: {
      items: [{ channel: 'y', name: 'Pasien' }]
    }
  }

  return (
    <Card title="Rasio Pasien Baru vs Lama" size="small" variant="outlined">
      <Pie {...config} height={220} />
    </Card>
  )
}
