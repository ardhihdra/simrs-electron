import { AppstoreOutlined, ClearOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Form, theme } from 'antd'
import { ComponentType, ReactNode } from 'react'

export interface TableHeaderProps {
  title: string
  subtitle?: string
  onSearch: (values: any) => void
  onReset?: () => void
  onCreate?: () => void
  onRefresh?: () => void
  createLabel?: string
  loading?: boolean
  children: ReactNode
  action?: ReactNode
  icon?: ComponentType
  stats?: ReactNode
}

export const TableHeader = ({
  title,
  onSearch,
  onReset,
  onCreate,
  onRefresh,
  createLabel = 'Buat Baru',
  loading,
  children,
  subtitle,
  action,
  icon,
  stats
}: TableHeaderProps) => {
  const [form] = Form.useForm()
  const { token } = theme.useToken()
  const IconComponent = icon ?? AppstoreOutlined

  return (
    <div className="flex flex-col gap-4 w-full mb-6">
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        className="min-h-32"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <IconComponent className="text-base" style={{ color: token.colorSuccessBg, fontSize: 16 }} />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">{title}</h1>
              </div>
              {subtitle && (
                <p className="text-sm text-blue-200 m-0 ml-12">{subtitle}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onRefresh && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#fff'
                  }}
                  ghost
                >
                  Refresh
                </Button>
              )}
              {action}
              {onCreate && (
                <Button
                  icon={<PlusOutlined />}
                  onClick={onCreate}
                  style={{
                    background: '#fff',
                    borderColor: '#fff',
                    color: token.colorPrimaryActive
                  }}
                >
                  {createLabel}
                </Button>
              )}
            </div>
          </div>

          {stats && <div className="mt-2 w-full">{stats}</div>}
        </div>
      </Card>

      <Card styles={{ body: { padding: '16px 20px' } }} variant="borderless">
        <Form form={form} onFinish={onSearch}>
          <div className="flex items-end gap-x-4 gap-y-2 w-full">{children}</div>
          <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-gray-100">
            {onReset && (
              <Button
                onClick={() => {
                  form.resetFields()
                  onReset()
                }}
                icon={<ClearOutlined />}
              >
                Reset
              </Button>
            )}
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              Cari
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}
