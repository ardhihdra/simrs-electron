import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Select, Switch } from 'antd'
import { DAY_OPTIONS, TIME_PATTERN, defaultRegularSession } from '../../doctor-schedule-form.constants'

export function DoctorScheduleRegularSessionsCard() {
  return (
    <Card bodyStyle={{ padding: '20px 24px' }} className="border-none mt-4" title="Sesi Praktik Reguler">
      <Form.List name="sessions">
        {(fields, { add, remove }, { errors }) => (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500 m-0">
                Hari mengikuti `Date.getDay()`: Minggu = 0, Senin = 1, sampai Sabtu = 6.
              </p>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(defaultRegularSession())}>
                Tambah Sesi
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.key} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="font-medium">Sesi Reguler #{index + 1}</div>
                    <div className="text-xs text-gray-500">
                      Gunakan sesi ini untuk pola jadwal mingguan normal.
                    </div>
                  </div>
                  <Button danger type="text" onClick={() => remove(field.name)} disabled={fields.length === 1}>
                    Hapus
                  </Button>
                </div>

                <Form.Item hidden name={[field.name, 'id']}>
                  <Input />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                  <Form.Item
                    label="Hari"
                    name={[field.name, 'dayOfWeek']}
                    rules={[{ required: true, message: 'Hari wajib diisi' }]}
                  >
                    <Select options={DAY_OPTIONS} placeholder="Pilih hari" />
                  </Form.Item>

                  <Form.Item
                    label="Sesi Ke"
                    name={[field.name, 'sessionNumber']}
                    rules={[{ required: true, message: 'Sesi ke wajib diisi' }]}
                  >
                    <InputNumber className="w-full" min={1} placeholder="1" />
                  </Form.Item>

                  <Form.Item
                    label="Jam Mulai"
                    name={[field.name, 'startTime']}
                    rules={[
                      { required: true, message: 'Jam mulai wajib diisi' },
                      { pattern: TIME_PATTERN, message: 'Format jam HH:mm' }
                    ]}
                  >
                    <Input placeholder="08:00" />
                  </Form.Item>

                  <Form.Item
                    label="Jam Selesai"
                    name={[field.name, 'endTime']}
                    dependencies={[['sessions', field.name, 'startTime']]}
                    rules={[
                      { required: true, message: 'Jam selesai wajib diisi' },
                      { pattern: TIME_PATTERN, message: 'Format jam HH:mm' },
                      ({ getFieldValue }) => ({
                        validator(_, value: string | undefined) {
                          const startTime = getFieldValue(['sessions', field.name, 'startTime'])
                          if (!startTime || !value || value > startTime) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('Jam selesai harus lebih besar dari jam mulai'))
                        }
                      })
                    ]}
                  >
                    <Input placeholder="12:00" />
                  </Form.Item>

                  <Form.Item label="Kuota" name={[field.name, 'quota']}>
                    <InputNumber className="w-full" min={0} placeholder="30" />
                  </Form.Item>

                  <Form.Item label="Aktif" name={[field.name, 'isActive']} valuePropName="checked">
                    <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
                  </Form.Item>
                </div>
              </div>
            ))}

            <Form.ErrorList errors={errors} />
          </div>
        )}
      </Form.List>
    </Card>
  )
}
