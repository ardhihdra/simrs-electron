import { DashboardOutlined } from '@ant-design/icons'
import { Card, Col, Divider, Row, Space, Typography } from 'antd'
import { PremiumBarChart } from '../../components/atoms/charts/PremiumBarChart'
import { PremiumDonut } from '../../components/atoms/charts/PremiumDonut'
import SummaryCardGrid from './components/summery-card'
import { DUMMY_ANALYTICS_DATA, DUMMY_SUMMARY_METRICS } from './data/dashboard-pendaftaran.data'

const { Title, Text } = Typography

export default function DashboardPendaftaran() {
  const metrics = DUMMY_SUMMARY_METRICS
  const analytics = DUMMY_ANALYTICS_DATA

  // Adapt data for PremiumBarChart (Patients Per Hour)
  const patientsPerHourData = analytics.patientsPerHour.map((p) => ({
    label: p.hour,
    value: p.patientCount,
    // Simulate BPJS vs Umum for the premium bar design
    subValue: Math.floor(p.patientCount * 0.6) 
  }))

  // Adapt data for PremiumDonut (Patient Type Ratio)
  const patientTypeSegments = analytics.patientTypeRatio.map((p, i) => ({
    value: p.count,
    label: p.type,
    color: i === 0 ? 'var(--ok)' : 'var(--accent)'
  }))

  // Adapt data for PremiumDonut (Payment Method Ratio)
  const paymentMethodSegments = analytics.paymentMethodRatio.map((p, i) => ({
    value: p.count,
    label: p.method,
    color: i === 0 ? 'var(--info)' : i === 1 ? 'var(--accent)' : 'var(--violet)'
  }))

  return (
    <div className="p-4 space-y-4">
      <Space align="center">
        <DashboardOutlined className="text-2xl text-blue-500" />
        <div>
          <Title level={4} className="!mb-0">
            Dashboard Pendaftaran
          </Title>
          <Text type="secondary" className="text-xs">
            Data operasional · Preview Mode (Main Branch)
          </Text>
        </div>
      </Space>

      <Divider className="!my-2" />

      <div>
        <Text strong className="text-sm text-gray-500 uppercase tracking-wide">
          Ringkasan Operasional
        </Text>
        <div className="mt-3">
          <SummaryCardGrid metrics={metrics} />
        </div>
      </div>

      <Divider className="!my-2" />

      <div>
        <Text strong className="text-sm text-gray-500 uppercase tracking-wide">
          Analitik Operasional
        </Text>
        <div className="mt-3 space-y-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card 
                title={<div className="text-sm font-bold">Kedatangan Pasien per Jam</div>} 
                size="small" 
                variant="outlined"
              >
                <PremiumBarChart data={patientsPerHourData} />
                <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                  <div><span className="opacity-60">Peak </span><b>09:00–10:00</b></div>
                  <div><span className="opacity-60">Rata-rata </span><b>14 mnt</b></div>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)]"/> Umum
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]"/> BPJS
                    </span>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card 
                title={<div className="text-sm font-bold">Komposisi Pasien</div>} 
                size="small" 
                variant="outlined"
              >
                <div className="flex items-center justify-center py-4">
                  <PremiumDonut segments={patientTypeSegments} size={150} />
                </div>
                <div className="space-y-2 mt-2">
                  {patientTypeSegments.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        <span>{s.label}</span>
                      </div>
                      <b className="font-mono">{s.value}</b>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
               <Card 
                title={<div className="text-sm font-bold">Metode Pembayaran</div>} 
                size="small" 
                variant="outlined"
              >
                <div className="flex items-center gap-6 py-2">
                  <PremiumDonut segments={paymentMethodSegments} size={130} />
                  <div className="flex-1 space-y-3">
                    {paymentMethodSegments.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span>{s.label}</span>
                        </div>
                        <b className="font-mono">{s.value}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title={<div className="text-sm font-bold">Status Antrian & Tunggu</div>} 
                size="small" 
                variant="outlined"
                className="h-full"
              >
                <div className="flex flex-col justify-center h-full space-y-4 py-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs opacity-70">Efisiensi Pendaftaran</span>
                    <b className="text-sm text-[var(--ok)]">84%</b>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--ok)] w-[84%] rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800">
                      <div className="text-[10px] uppercase opacity-50 font-bold">Avg Response</div>
                      <div className="text-lg font-bold font-mono">2.4m</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800">
                      <div className="text-[10px] uppercase opacity-50 font-bold">Satisfaction</div>
                      <div className="text-lg font-bold font-mono">4.8/5</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  )
}
