import {
    ClockCircleOutlined,
    MedicineBoxOutlined,
    OrderedListOutlined,
    SyncOutlined,
    TeamOutlined,
    UserAddOutlined,
    UserOutlined
} from '@ant-design/icons'
import { Card, Col, Row, Statistic, Tag, Tooltip, Typography } from 'antd'
import type { RegistrationSummaryMetrics, WaitTimeStatus } from '../types/dashboard-pendaftaran.types'

const { Text } = Typography

interface SummaryCardGridProps {
  metrics: RegistrationSummaryMetrics
}

/**
 * Returns Ant Design Tag color based on wait time threshold.
 * Green  < 30 min, Yellow 30–60 min, Red > 60 min.
 */
function resolveWaitTimeTagColor(status: WaitTimeStatus): string {
  const colorMap: Record<WaitTimeStatus, string> = {
    green: 'success',
    yellow: 'warning',
    red: 'error'
  }
  return colorMap[status]
}

function resolveWaitTimeLabel(status: WaitTimeStatus): string {
  const labelMap: Record<WaitTimeStatus, string> = {
    green: '< 30 menit',
    yellow: '30–60 menit',
    red: '> 60 menit'
  }
  return labelMap[status]
}

/**
 * Renders 7 operational summary cards as defined in the spec:
 * Total Pasien, Pasien Baru, Pasien Lama, Antrean Aktif,
 * Rata-rata Tunggu, Poli Terbanyak, Encounter Aktif.
 */
export default function SummaryCardGrid({ metrics }: SummaryCardGridProps) {
  return (
    <Row gutter={[16, 16]}>
      {/* 1.1 Total Pasien Hari Ini */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined">
          <Statistic
            title="Total Pasien Hari Ini"
            value={metrics.totalPatientsToday}
            prefix={<TeamOutlined className="text-blue-500" />}
            suffix="pasien"
            valueStyle={{ color: '#1677ff' }}
          />
          <Text type="secondary" className="text-xs">
            Baru &amp; lama, tidak termasuk batal
          </Text>
        </Card>
      </Col>

      {/* 1.2 Pasien Baru */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined">
          <Statistic
            title="Pasien Baru"
            value={metrics.newPatients}
            prefix={<UserAddOutlined className="text-green-500" />}
            suffix="pasien"
            valueStyle={{ color: '#52c41a' }}
          />
          <Text type="secondary" className="text-xs">
            Belum memiliki nomor RM
          </Text>
        </Card>
      </Col>

      {/* 1.3 Pasien Lama */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined">
          <Statistic
            title="Pasien Lama"
            value={metrics.returningPatients}
            prefix={<UserOutlined className="text-purple-500" />}
            suffix="pasien"
            valueStyle={{ color: '#722ed1' }}
          />
          <Text type="secondary" className="text-xs">
            Kunjungan ulang hari ini
          </Text>
        </Card>
      </Col>

      {/* 1.4 Total Antrean Aktif */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined">
          <Statistic
            title="Total Antrean Aktif"
            value={metrics.activeQueueCount}
            prefix={<OrderedListOutlined className="text-orange-500" />}
            suffix="tiket"
            valueStyle={{ color: '#fa8c16' }}
          />
          <Text type="secondary" className="text-xs">
            WAITING · CALLED · ON_PROCESS
          </Text>
        </Card>
      </Col>

      {/* 1.5 Rata-rata Waktu Tunggu */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined">
          <Statistic
            title="Rata-rata Waktu Tunggu"
            value={metrics.averageWaitTimeMinutes}
            prefix={<ClockCircleOutlined />}
            suffix="menit"
          />
          <Tag color={resolveWaitTimeTagColor(metrics.waitTimeStatus)} className="mt-1">
            {resolveWaitTimeLabel(metrics.waitTimeStatus)}
          </Tag>
        </Card>
      </Col>

      {/* 1.6 Poli Terbanyak Hari Ini */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined">
          <Statistic
            title="Poli Terbanyak Hari Ini"
            value={metrics.topClinic.patientCount}
            prefix={<MedicineBoxOutlined className="text-cyan-500" />}
            suffix="pasien"
            valueStyle={{ color: '#13c2c2' }}
          />
          <Tooltip title="Poli dengan jumlah pasien terbanyak hari ini">
            <Tag color="cyan" className="mt-1 cursor-default">
              {metrics.topClinic.clinicName}
            </Tag>
          </Tooltip>
        </Card>
      </Col>

      {/* 1.7 Encounter Aktif */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined">
          <Statistic
            title="Encounter Aktif"
            value={metrics.activeEncounterCount}
            prefix={<SyncOutlined spin className="text-red-500" />}
            suffix="encounter"
            valueStyle={{ color: '#ff4d4f' }}
          />
          <Text type="secondary" className="text-xs">
            ARRIVED · TRIAGED · IN_PROGRESS
          </Text>
        </Card>
      </Col>
    </Row>
  )
}