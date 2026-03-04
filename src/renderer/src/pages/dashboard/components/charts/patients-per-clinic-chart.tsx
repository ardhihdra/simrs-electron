import { Bar } from '@ant-design/charts'
import { Card } from 'antd'
import type { PatientsPerClinicDataPoint } from '../../types/dashboard-pendaftaran.types'

interface PatientsPerClinicChartProps {
  data: PatientsPerClinicDataPoint[]
}

/**
 * Horizontal bar chart showing patient distribution across clinics.
 * Helps monitor service load per poli (spec §2.2).
 */
export default function PatientsPerClinicChart({ data }: PatientsPerClinicChartProps) {
  const config = {
    data,
    xField: 'patientCount',
    yField: 'clinicName',
    axis: {
      x: { title: 'Jumlah Pasien' },
      y: { title: 'Poli' }
    },
    tooltip: {
      items: [{ channel: 'x', name: 'Pasien' }]
    },
    style: { radiusTopLeft: 4, radiusTopRight: 4 }
  }

  return (
    <Card title="Pasien per Poli" size="small" variant="outlined">
      <Bar {...config} height={220} />
    </Card>
  )
}
