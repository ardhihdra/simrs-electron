import React from 'react'
import { Card, Col, Row, Statistic, Typography, theme } from 'antd'
import {
  MedicineBoxOutlined,
  WarningOutlined,
  FileTextOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

const { Text } = Typography

dayjs.locale('id')

interface ClinicalSnapshot {
  activeProblemsCount: number
  activeMedicationsCount: number
  allergiesCount: number
  lastVisitDate?: string | null
  lastLabResult?: string | null
  lastUpdated: string
}

interface ClinicalSnapshotCardProps {
  snapshot?: ClinicalSnapshot
}

export const ClinicalSnapshotCard: React.FC<ClinicalSnapshotCardProps> = ({ snapshot }) => {
  const { token } = theme.useToken()

  if (!snapshot) return null

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Belum ada data'
    return dayjs(date).format('DD MMM YYYY, HH:mm')
  }

  return (
    <Card
      size="small"
      title="Clinical Snapshot"
      extra={
        <Text type="secondary" className="text-xs">
          Update: {formatDate(snapshot.lastUpdated)}
        </Text>
      }
      className="shadow-sm mb-4"
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={4}>
          <Statistic
            title="Masalah Aktif"
            value={snapshot.activeProblemsCount}
            valueStyle={{
              color: snapshot.activeProblemsCount > 0 ? token.colorError : token.colorText
            }}
            prefix={<WarningOutlined />}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic
            title="Alergi"
            value={snapshot.allergiesCount}
            valueStyle={{
              color: snapshot.allergiesCount > 0 ? token.colorWarning : token.colorText
            }}
            prefix={<WarningOutlined />}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic
            title="Obat Aktif"
            value={snapshot.activeMedicationsCount}
            prefix={<MedicineBoxOutlined />}
            valueStyle={{ color: token.colorPrimary }}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div className="flex flex-col">
            <Text type="secondary" className="mb-1 text-xs">
              Kunjungan Terakhir
            </Text>
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-gray-400" />
              <Text strong>{formatDate(snapshot.lastVisitDate)}</Text>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div className="flex flex-col">
            <Text type="secondary" className="mb-1 text-xs">
              Hasil Lab Terakhir
            </Text>
            <div className="flex items-start gap-2">
              <FileTextOutlined className="text-gray-400 mt-1" />
              <Text strong className="line-clamp-2" title={snapshot.lastLabResult || ''}>
                {snapshot.lastLabResult || 'Belum ada data'}
              </Text>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  )
}
