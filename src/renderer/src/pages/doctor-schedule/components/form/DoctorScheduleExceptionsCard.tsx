import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Switch, Tag } from 'antd'
import type { FormInstance } from 'antd'
import {
  EXCEPTION_MODE_OPTIONS,
  EXCEPTION_TYPE_OPTIONS,
  TIME_PATTERN,
  defaultException,
  defaultExceptionSession
} from '../../doctor-schedule-form.constants'
import type {
  DoctorScheduleExceptionsFormValues,
  DoctorScheduleFormValues
} from '../../doctor-schedule-form.types'

interface DoctorScheduleExceptionsCardProps {
  form: FormInstance<DoctorScheduleFormValues | DoctorScheduleExceptionsFormValues>
  isEdit: boolean
}

export function DoctorScheduleExceptionsCard({
  form,
  isEdit
}: DoctorScheduleExceptionsCardProps) {
  return (
    <Card bodyStyle={{ padding: '20px 24px' }} className="border-none mt-4" title="Exception Jadwal">
      <Form.List name="exceptions">
        {(fields, { add, remove }, { errors }) => (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500 m-0">
                Gunakan exception untuk libur, izin, cuti, sakit, atau override jam pada tanggal
                tertentu.
              </p>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(defaultException())}>
                Tambah Exception
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-5 py-8 text-center text-sm text-gray-500">
                Belum ada exception jadwal. Anda bisa tetap menyimpan jadwal tanpa exception.
              </div>
            ) : null}

            {fields.map((field, index) => {
              const exceptionId = form.getFieldValue(['exceptions', field.name, 'id'])
              const isPersistedException = isEdit && typeof exceptionId === 'number' && exceptionId > 0

              return (
                <div key={field.key} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="font-medium">Exception #{index + 1}</div>
                      <div className="text-xs text-gray-500">
                        {isPersistedException
                          ? 'Exception ini sudah tersimpan. Untuk menonaktifkan, ubah status aktifnya.'
                          : 'Exception baru akan disimpan setelah jadwal utama berhasil tersimpan.'}
                      </div>
                    </div>
                    {!isPersistedException ? (
                      <Button danger type="text" onClick={() => remove(field.name)}>
                        Hapus
                      </Button>
                    ) : (
                      <Tag color="blue" className="m-0">
                        Tersimpan
                      </Tag>
                    )}
                  </div>

                  <Form.Item hidden name={[field.name, 'id']}>
                    <Input />
                  </Form.Item>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <Form.Item
                      label="Tanggal"
                      name={[field.name, 'date']}
                      rules={[{ required: true, message: 'Tanggal exception wajib diisi' }]}
                    >
                      <DatePicker className="w-full" format="DD MMM YYYY" />
                    </Form.Item>

                    <Form.Item
                      label="Jenis"
                      name={[field.name, 'type']}
                      rules={[{ required: true, message: 'Jenis exception wajib diisi' }]}
                    >
                      <Select options={EXCEPTION_TYPE_OPTIONS} placeholder="Pilih jenis" />
                    </Form.Item>

                    <Form.Item
                      label="Mode"
                      name={[field.name, 'mode']}
                      rules={[{ required: true, message: 'Mode exception wajib diisi' }]}
                    >
                      <Select options={EXCEPTION_MODE_OPTIONS} placeholder="Pilih mode" />
                    </Form.Item>

                    <Form.Item label="Aktif" name={[field.name, 'isActive']} valuePropName="checked">
                      <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
                    </Form.Item>

                    <Form.Item label="Keterangan" name={[field.name, 'description']}>
                      <Input placeholder="Contoh: Libur nasional atau ubah jam praktik" />
                    </Form.Item>
                  </div>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues?.exceptions?.[field.name]?.mode !== currentValues?.exceptions?.[field.name]?.mode
                    }
                  >
                    {() => {
                      const currentMode = form.getFieldValue(['exceptions', field.name, 'mode'])

                      if (currentMode !== 'partial_session') {
                        return (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Mode `full_day` tidak memerlukan `JadwalDokterExceptionSesi`.
                          </div>
                        )
                      }

                      return (
                        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                          <Form.List name={[field.name, 'sessions']}>
                            {(sessionFields, sessionOps, sessionMeta) => (
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="font-medium text-sky-900">Sesi Override</div>
                                    <div className="text-xs text-sky-700">
                                      Digunakan saat exception hanya mengubah sebagian sesi.
                                    </div>
                                  </div>
                                  <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() => sessionOps.add(defaultExceptionSession())}
                                  >
                                    Tambah Sesi Override
                                  </Button>
                                </div>

                                {sessionFields.map((sessionField, sessionIndex) => (
                                  <div
                                    key={sessionField.key}
                                    className="rounded-lg border border-sky-200 bg-white p-4"
                                  >
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                      <div className="font-medium">Override #{sessionIndex + 1}</div>
                                      <Button
                                        danger
                                        type="text"
                                        onClick={() => sessionOps.remove(sessionField.name)}
                                      >
                                        Hapus
                                      </Button>
                                    </div>

                                    <Form.Item hidden name={[sessionField.name, 'id']}>
                                      <Input />
                                    </Form.Item>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                                      <Form.Item
                                        label="Sesi Ke"
                                        name={[sessionField.name, 'sessionNumber']}
                                        rules={[{ required: true, message: 'Sesi ke wajib diisi' }]}
                                      >
                                        <InputNumber className="w-full" min={1} placeholder="1" />
                                      </Form.Item>

                                      <Form.Item
                                        label="Jam Mulai"
                                        name={[sessionField.name, 'startTime']}
                                        rules={[
                                          { required: true, message: 'Jam mulai wajib diisi' },
                                          { pattern: TIME_PATTERN, message: 'Format jam HH:mm' }
                                        ]}
                                      >
                                        <Input placeholder="08:00" />
                                      </Form.Item>

                                      <Form.Item
                                        label="Jam Selesai"
                                        name={[sessionField.name, 'endTime']}
                                        dependencies={[
                                          ['exceptions', field.name, 'sessions', sessionField.name, 'startTime']
                                        ]}
                                        rules={[
                                          { required: true, message: 'Jam selesai wajib diisi' },
                                          { pattern: TIME_PATTERN, message: 'Format jam HH:mm' },
                                          ({ getFieldValue }) => ({
                                            validator(_, value: string | undefined) {
                                              const startTime = getFieldValue([
                                                'exceptions',
                                                field.name,
                                                'sessions',
                                                sessionField.name,
                                                'startTime'
                                              ])
                                              if (!startTime || !value || value > startTime) {
                                                return Promise.resolve()
                                              }
                                              return Promise.reject(
                                                new Error(
                                                  'Jam selesai override harus lebih besar dari jam mulai'
                                                )
                                              )
                                            }
                                          })
                                        ]}
                                      >
                                        <Input placeholder="12:00" />
                                      </Form.Item>

                                      <Form.Item label="Kuota" name={[sessionField.name, 'quota']}>
                                        <InputNumber className="w-full" min={0} placeholder="30" />
                                      </Form.Item>

                                      <Form.Item
                                        label="Aktif"
                                        name={[sessionField.name, 'isActive']}
                                        valuePropName="checked"
                                      >
                                        <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
                                      </Form.Item>
                                    </div>
                                  </div>
                                ))}

                                <Form.ErrorList errors={sessionMeta.errors} />
                              </div>
                            )}
                          </Form.List>
                        </div>
                      )
                    }}
                  </Form.Item>
                </div>
              )
            })}

            <Form.ErrorList errors={errors} />
          </div>
        )}
      </Form.List>
    </Card>
  )
}
