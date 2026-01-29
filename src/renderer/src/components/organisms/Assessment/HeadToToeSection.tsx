import { Card, Form, Input, Switch } from 'antd'
import React from 'react'
import { HEAD_TO_TOE_MAP } from '../../../config/observation-maps'

const { TextArea } = Input

export const HeadToToeSection: React.FC = () => {
  return (
    <Card title="Pemeriksaan Fisik (Head to Toe)" className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(HEAD_TO_TOE_MAP).map(([key, label]) => (
          <Card
            key={key}
            size="small"
            title={label}
            className="bg-gray-50 border-gray-200"
            extra={
              <Form.Item
                name={['headToToe', `${key}_NORMAL`]}
                valuePropName="checked"
                noStyle
                initialValue={true}
              >
                <Switch checkedChildren="Normal" unCheckedChildren="Abnormal" defaultChecked />
              </Form.Item>
            }
          >
            <Form.Item name={['headToToe', key]} className="mb-0">
              <TextArea rows={2} placeholder={`Deskripsi hasil pemeriksaan ${label}...`} />
            </Form.Item>
          </Card>
        ))}
      </div>
    </Card>
  )
}
