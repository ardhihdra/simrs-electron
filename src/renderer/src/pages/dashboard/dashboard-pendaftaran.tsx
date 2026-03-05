import { DashboardOutlined } from '@ant-design/icons'
import { Col, Divider, Row, Space, Typography } from 'antd'
import PatientTypeRatioChart from './components/charts/patient-type-ratio-chart'
import PatientsPerClinicChart from './components/charts/patients-per-clinic-chart'
import PatientsPerHourChart from './components/charts/patients-per-hour-chart'
import PaymentMethodRatioChart from './components/charts/payment-method-ratio-chart'
import WaitTimeTrendChart from './components/charts/wait-time-trend-chart'
import SummaryCardGrid from './components/summery-card'
import { DUMMY_ANALYTICS_DATA, DUMMY_SUMMARY_METRICS } from './data/dashboard-pendaftaran.data'

const { Title, Text } = Typography

/**
 * Dashboard Pendaftaran – main operational dashboard for registration.
 * Displays 7 real-time summary metrics and 5 analytics charts.
 * Currently uses dummy data; replace data sources with API calls when ready.
 *
 * Auto-refresh is intentionally not yet wired (non-functional requirement §3).
 */
export default function DashboardPendaftaran() {
  return (
    <div className="p-4 space-y-4">
      {/* Page Header */}
      <Space align="center">
        <DashboardOutlined className="text-2xl text-blue-500" />
        <div>
          <Title level={4} className="!mb-0">
            Dashboard Pendaftaran
          </Title>
          <Text type="secondary" className="text-xs">
            Data real-time · Auto refresh setiap 30–60 detik
          </Text>
        </div>
      </Space>

      <Divider className="!my-2" />

      {/* Section 1: Summary Cards */}
      <div>
        <Text strong className="text-sm text-gray-500 uppercase tracking-wide">
          Ringkasan Operasional
        </Text>
        <div className="mt-3">
          <SummaryCardGrid metrics={DUMMY_SUMMARY_METRICS} />
        </div>
      </div>

      <Divider className="!my-2" />

      {/* Section 2: Analytics Charts */}
      <div>
        <Text strong className="text-sm text-gray-500 uppercase tracking-wide">
          Analitik Operasional
        </Text>
        <div className="mt-3 space-y-4">
          {/* Row 1: Patients per Hour + Patients per Clinic */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <PatientsPerHourChart data={DUMMY_ANALYTICS_DATA.patientsPerHour} />
            </Col>
            <Col xs={24} lg={12}>
              <PatientsPerClinicChart data={DUMMY_ANALYTICS_DATA.patientsPerClinic} />
            </Col>
          </Row>

          {/* Row 2: Wait Time Trend (full width) */}
          <Row>
            <Col span={24}>
              <WaitTimeTrendChart data={DUMMY_ANALYTICS_DATA.waitTimeTrend} />
            </Col>
          </Row>

          {/* Row 3: Patient Type Ratio + Payment Method Ratio */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <PatientTypeRatioChart data={DUMMY_ANALYTICS_DATA.patientTypeRatio} />
            </Col>
            <Col xs={24} lg={12}>
              <PaymentMethodRatioChart data={DUMMY_ANALYTICS_DATA.paymentMethodRatio} />
            </Col>
          </Row>
        </div>
      </div>
    </div>
  )
}
