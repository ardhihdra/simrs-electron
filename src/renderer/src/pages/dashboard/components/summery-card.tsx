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
import { PremiumSparkline } from '../../../components/atoms/charts/PremiumSparkline'

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
 * Renders 7 operational summary cards with Sparklines for premium feel.
 */
export default function SummaryCardGrid({ metrics }: SummaryCardGridProps) {
  // Mock sparkline data for premium visualization
  const mockSpark = [30, 40, 35, 50, 45, 60, 55, 70, 65, 80]
  const mockSparkDown = [80, 70, 75, 60, 65, 50, 55, 40, 45, 30]

  return (
    <Row gutter={[16, 16]}>
      {/* 1.1 Total Pasien Hari Ini */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined" className="overflow-hidden relative">
          <Statistic
            title="Total Pasien Hari Ini"
            value={metrics.totalPatientsToday}
            prefix={<TeamOutlined className="text-blue-500" />}
            suffix="pasien"
            valueStyle={{ color: 'var(--accent)', fontWeight: 700 }}
          />
          <div className="flex justify-between items-end mt-2">
            <Text type="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
              Baru &amp; lama
            </Text>
            <div className="opacity-60">
              <PremiumSparkline values={mockSpark} color="var(--accent)" width={60} height={24} />
            </div>
          </div>
        </Card>
      </Col>

      {/* 1.2 Pasien Baru */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined" className="overflow-hidden relative">
          <Statistic
            title="Pasien Baru"
            value={metrics.newPatients}
            prefix={<UserAddOutlined className="text-green-500" />}
            suffix="pasien"
            valueStyle={{ color: 'var(--ok)', fontWeight: 700 }}
          />
          <div className="flex justify-between items-end mt-2">
            <Text type="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
              No RM Baru
            </Text>
            <div className="opacity-60">
              <PremiumSparkline values={mockSpark} color="var(--ok)" width={60} height={24} />
            </div>
          </div>
        </Card>
      </Col>

      {/* 1.3 Pasien Lama */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined" className="overflow-hidden relative">
          <Statistic
            title="Pasien Lama"
            value={metrics.returningPatients}
            prefix={<UserOutlined className="text-purple-500" />}
            suffix="pasien"
            valueStyle={{ color: 'var(--violet)', fontWeight: 700 }}
          />
          <div className="flex justify-between items-end mt-2">
            <Text type="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
              Kunjungan Ulang
            </Text>
            <div className="opacity-60">
              <PremiumSparkline values={mockSpark} color="var(--violet)" width={60} height={24} />
            </div>
          </div>
        </Card>
      </Col>

      {/* 1.4 Total Antrean Aktif */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined" className="overflow-hidden relative">
          <Statistic
            title="Total Antrean Aktif"
            value={metrics.activeQueueCount}
            prefix={<OrderedListOutlined className="text-orange-500" />}
            suffix="tiket"
            valueStyle={{ color: 'var(--warn)', fontWeight: 700 }}
          />
          <div className="flex justify-between items-end mt-2">
            <Text type="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
              Active Queue
            </Text>
            <div className="opacity-60">
              <PremiumSparkline values={mockSparkDown} color="var(--warn)" width={60} height={24} />
            </div>
          </div>
        </Card>
      </Col>

      {/* 1.5 Rata-rata Waktu Tunggu */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined" className="overflow-hidden relative">
          <Statistic
            title="Rata-rata Waktu Tunggu"
            value={metrics.averageWaitTimeMinutes}
            prefix={<ClockCircleOutlined />}
            suffix="menit"
            valueStyle={{ fontWeight: 700 }}
          />
          <div className="flex justify-between items-center mt-2">
            <Tag color={resolveWaitTimeTagColor(metrics.waitTimeStatus)} className="m-0 text-[10px]">
              {resolveWaitTimeLabel(metrics.waitTimeStatus)}
            </Tag>
            <div className="opacity-60">
              <PremiumSparkline values={[20, 25, 22, 28, 30, 25, 20]} color="var(--info)" width={60} height={24} />
            </div>
          </div>
        </Card>
      </Col>

      {/* 1.6 Poli Terbanyak Hari Ini */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined" className="overflow-hidden relative">
          <Statistic
            title="Poli Terbanyak Hari Ini"
            value={metrics.topClinic.patientCount}
            prefix={<MedicineBoxOutlined className="text-cyan-500" />}
            suffix="pasien"
            valueStyle={{ color: 'var(--info)', fontWeight: 700 }}
          />
          <div className="flex justify-between items-center mt-2">
            <Tooltip title="Poli dengan jumlah pasien terbanyak hari ini">
              <Tag color="cyan" className="m-0 text-[10px] cursor-default max-w-[120px] truncate">
                {metrics.topClinic.clinicName}
              </Tag>
            </Tooltip>
            <div className="opacity-60">
              <PremiumSparkline values={mockSpark} color="var(--info)" width={60} height={24} />
            </div>
          </div>
        </Card>
      </Col>

      {/* 1.7 Encounter Aktif */}
      <Col xs={24} sm={12} lg={8} xl={6}>
        <Card size="small" variant="outlined" className="overflow-hidden relative">
          <Statistic
            title="Encounter Aktif"
            value={metrics.activeEncounterCount}
            prefix={<SyncOutlined spin className="text-red-500" />}
            suffix="encounter"
            valueStyle={{ color: 'var(--danger)', fontWeight: 700 }}
          />
          <div className="flex justify-between items-end mt-2">
            <Text type="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
              In Progress
            </Text>
            <div className="opacity-60">
              <PremiumSparkline values={mockSpark} color="var(--danger)" width={60} height={24} />
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  )
}