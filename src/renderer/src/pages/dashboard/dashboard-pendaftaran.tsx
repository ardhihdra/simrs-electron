import { DashboardOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Col, Divider, Row, Skeleton, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import PatientTypeRatioChart from './components/charts/patient-type-ratio-chart'
import PatientsPerClinicChart from './components/charts/patients-per-clinic-chart'
import PatientsPerHourChart from './components/charts/patients-per-hour-chart'
import PaymentMethodRatioChart from './components/charts/payment-method-ratio-chart'
import WaitTimeTrendChart from './components/charts/wait-time-trend-chart'
import SummaryCardGrid from './components/summery-card'
import type { RegistrationAnalyticsData, RegistrationSummaryMetrics } from './types/dashboard-pendaftaran.types'

const { Title, Text } = Typography

const EMPTY_METRICS: RegistrationSummaryMetrics = {
    totalPatientsToday: 0,
    newPatients: 0,
    returningPatients: 0,
    activeQueueCount: 0,
    averageWaitTimeMinutes: 0,
    waitTimeStatus: 'green',
    topClinic: { clinicName: '-', patientCount: 0 },
    activeEncounterCount: 0,
}

const EMPTY_ANALYTICS: RegistrationAnalyticsData = {
    patientsPerHour: [],
    patientsPerClinic: [],
    waitTimeTrend: [],
    patientTypeRatio: [],
    paymentMethodRatio: [],
}

export default function DashboardPendaftaran() {
    const today = dayjs().format('YYYY-MM-DD')

    const { data, isLoading } = client.outpatientReporting.getDashboardMetrics.useQuery({ date: today })
    const metrics: RegistrationSummaryMetrics = data?.result ?? EMPTY_METRICS
    const analytics: RegistrationAnalyticsData = data?.result ?? EMPTY_ANALYTICS

    return (
        <div className="p-4 space-y-4">
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

            <div>
                <Text strong className="text-sm text-gray-500 uppercase tracking-wide">
                    Ringkasan Operasional
                </Text>
                <div className="mt-3">
                    {isLoading ? <Skeleton active paragraph={{ rows: 2 }} /> : <SummaryCardGrid metrics={metrics} />}
                </div>
            </div>

            <Divider className="!my-2" />

            <div>
                <Text strong className="text-sm text-gray-500 uppercase tracking-wide">
                    Analitik Operasional
                </Text>
                <div className="mt-3 space-y-4">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <PatientsPerHourChart data={analytics.patientsPerHour} />
                        </Col>
                        <Col xs={24} lg={12}>
                            <PatientsPerClinicChart data={analytics.patientsPerClinic} />
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <WaitTimeTrendChart data={analytics.waitTimeTrend} />
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={12}>
                            <PatientTypeRatioChart data={analytics.patientTypeRatio} />
                        </Col>
                        <Col xs={24} lg={12}>
                            <PaymentMethodRatioChart data={analytics.paymentMethodRatio} />
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    )
}
