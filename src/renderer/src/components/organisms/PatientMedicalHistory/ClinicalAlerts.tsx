import React from 'react'
import { Alert, Typography } from 'antd'
import { WarningOutlined, InfoCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export interface ClinicalAlert {
  type: 'ALLERGY' | 'PROBLEM' | 'LAB_ABNORMAL'
  message: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface ClinicalAlertsProps {
  alerts: ClinicalAlert[]
}

export const ClinicalAlerts: React.FC<ClinicalAlertsProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return null
  }

  // Sort by severity (HIGH > MEDIUM > LOW)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const sevValue = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    return sevValue[b.severity] - sevValue[a.severity]
  })

  return (
    <div className="flex flex-col gap-3 mb-4">
      <Title level={5} className="mb-0 flex items-center gap-2" style={{ margin: 0 }}>
        <WarningOutlined className="text-orange-500" />
        Clinical Alerts
      </Title>

      <div className="flex flex-col gap-2">
        {sortedAlerts.map((alert, index) => {
          let type: 'error' | 'warning' | 'info' = 'info'
          let icon = <InfoCircleOutlined />

          if (alert.severity === 'HIGH') {
            type = 'error'
            icon = <WarningOutlined />
          } else if (alert.severity === 'MEDIUM') {
            type = 'warning'
          }

          let titlePrefix = ''
          if (alert.type === 'ALLERGY') titlePrefix = 'Alergi: '
          if (alert.type === 'PROBLEM') titlePrefix = 'Diagnosis Aktif: '
          if (alert.type === 'LAB_ABNORMAL') titlePrefix = 'Lab Abnormal: '

          return (
            <Alert
              key={`${alert.type}-${index}`}
              type={type}
              showIcon
              icon={icon}
              message={<Text strong>{titlePrefix}</Text>}
              description={alert.message}
              className="border-l-4"
              style={{
                borderLeftColor:
                  alert.severity === 'HIGH'
                    ? '#ff4d4f'
                    : alert.severity === 'MEDIUM'
                      ? '#faad14'
                      : '#1677ff'
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
