import { Card, Col, Form, Input, Row, Select } from 'antd'
import type { FormInstance } from 'antd/es/form'
import type { FormListProps } from 'antd/es/form/FormList'

interface PerformerOption {
  id: number | string
  name: string
}

interface AutoRolePetugasListCardProps {
  form: FormInstance
  listName: string | (string | number)[]
  valuePathPrefix?: string | (string | number)[]
  token: {
    colorTextTertiary?: string
  }
  performers: PerformerOption[]
  isLoadingPerformers: boolean
  roleLabelByCode: Map<string, string>
  emptyText?: string
  listRules?: FormListProps['rules']
  className?: string
}

const getRoleValuePath = (
  listName: string | (string | number)[],
  valuePathPrefix: string | (string | number)[] | undefined,
  fieldIndex: number
): (string | number)[] =>
  Array.isArray(valuePathPrefix)
    ? [...valuePathPrefix, fieldIndex, 'roleTenaga']
    : typeof valuePathPrefix === 'string'
      ? [valuePathPrefix, fieldIndex, 'roleTenaga']
      : Array.isArray(listName)
        ? [...listName, fieldIndex, 'roleTenaga']
        : [listName, fieldIndex, 'roleTenaga']

export default function AutoRolePetugasListCard({
  form,
  listName,
  valuePathPrefix,
  token,
  performers,
  isLoadingPerformers,
  roleLabelByCode,
  emptyText = 'Belum ada role tenaga medis dari komponen jasa tindakan pada kelas terpilih.',
  listRules,
  className
}: AutoRolePetugasListCardProps) {
  return (
    <Card
      size="small"
      className={className}
      title={<span className="font-semibold">Tenaga Medis Pelaksana</span>}
    >
      <Form.List name={listName} rules={listRules}>
        {(fields) => (
          <div className="flex flex-col gap-2">
            {fields.length === 0 && (
              <div className="text-xs" style={{ color: token.colorTextTertiary }}>
                {emptyText}
              </div>
            )}
            {fields.map(({ key, name, ...restField }) => {
              const rolePath = getRoleValuePath(listName, valuePathPrefix, name)
              const roleCode = form.getFieldValue(rolePath) || ''
              const roleLabel = roleLabelByCode.get(roleCode) || roleCode || '-'

              return (
                <Row key={key} gutter={8} align="middle">
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'pegawaiId']}
                      label={name === 0 ? <span className="font-bold">Nama Petugas</span> : undefined}
                      rules={[{ required: true, message: 'Pilih petugas' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        allowClear
                        placeholder="Pilih tenaga medis..."
                        loading={isLoadingPerformers}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          String(option?.children ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {(performers || []).map((performer) => (
                          <Select.Option key={performer.id} value={performer.id}>
                            {performer.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={9}>
                    <Form.Item
                      {...restField}
                      name={[name, 'roleTenaga']}
                      rules={[{ required: true, message: 'Role belum tersedia' }]}
                      style={{ display: 'none' }}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      label={name === 0 ? <span className="font-bold">Role / Peran</span> : undefined}
                      style={{ marginBottom: 0 }}
                    >
                      <Input disabled value={roleLabel} />
                    </Form.Item>
                  </Col>
                  <Col span={3} className="flex items-end pb-0.5">
                    {name === 0 && <div className="h-[22px]" />}
                  </Col>
                </Row>
              )
            })}
          </div>
        )}
      </Form.List>
    </Card>
  )
}
