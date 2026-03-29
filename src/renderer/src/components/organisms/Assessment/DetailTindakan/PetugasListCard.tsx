import { useRef } from 'react'
import { Form, Card, Select, Button, Row, Col } from 'antd'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'

interface PetugasListCardProps {
  listName: string | (string | number)[]
  token: any
  performers: any[]
  isLoadingPerformers: boolean
  roleLabelByCode: Map<string, string>
  emptyText?: string
}

export default function PetugasListCard({
  listName,
  token,
  performers,
  isLoadingPerformers,
  roleLabelByCode,
  emptyText = 'Belum ada tenaga medis. Klik "Tambah Petugas" untuk menambahkan.'
}: PetugasListCardProps) {
  const addRef = useRef<((defaultValue?: any) => void) | undefined>(undefined)

  return (
    <Card
      size="small"
      className="mt-4!"
      title={<span className="font-semibold">Tenaga Medis Pelaksana</span>}
      extra={
        <Button
          type="dashed"
          size="small"
          icon={<PlusCircleOutlined />}
          onClick={() => addRef.current?.({ pegawaiId: undefined, roleTenaga: undefined })}
        >
          Tambah Petugas
        </Button>
      }
    >
      <Form.List name={listName}>
        {(fields, { add, remove }) => {
          addRef.current = add
          return (
            <div className="flex flex-col gap-2">
              {fields.length === 0 && (
                <div className="text-xs" style={{ color: token.colorTextTertiary }}>
                  {emptyText}
                </div>
              )}
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={8} align="middle">
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'pegawaiId']}
                      label={
                        name === 0 ? <span className="font-bold">Nama Petugas</span> : undefined
                      }
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
                          (option?.children as unknown as string)
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {performers.map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            {p.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={9}>
                    <Form.Item
                      {...restField}
                      name={[name, 'roleTenaga']}
                      label={
                        name === 0 ? <span className="font-bold">Role / Peran</span> : undefined
                      }
                      rules={[{ required: true, message: 'Pilih role' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select placeholder="Pilih role...">
                        {Array.from(roleLabelByCode.entries()).map(([code, label]) => (
                          <Select.Option key={code} value={code}>
                            {label}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={3} className="flex items-end pb-0.5">
                    {name === 0 && <div className="h-5.5" />}
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}
            </div>
          )
        }}
      </Form.List>
    </Card>
  )
}
