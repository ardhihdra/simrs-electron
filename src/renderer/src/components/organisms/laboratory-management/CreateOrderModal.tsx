import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { notifyFormValidationError } from '@renderer/utils/form-feedback'
import { Button, Card, Col, Form, Modal, Row, Select, Table, App } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'

interface CreateOrderModalProps {
  open: boolean
  onClose: () => void
  patient: {
    id: string
    name: string
    mrn: string
  } | null
  encounterId: string | null
}

interface LabRequestItem {
  key: string
  testCodeId: string
  testName: string
  masterServiceRequestCodeId: number
  priority: 'ROUTINE' | 'URGENT' | 'STAT'
}

export default function CreateOrderModal({ open, onClose, patient, encounterId }: CreateOrderModalProps) {
  const [form] = Form.useForm()
  const [selectedItems, setSelectedItems] = useState<LabRequestItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { message } = App.useApp()
  const category = Form.useWatch('category', form)
  
  // All service request codes for category dropdown (no filters)
  const { data: allCodesData, isFetching: isFetchingCategories } = client.laboratoryManagement.getServiceRequestCodes.useQuery({})

  const categories: { laboratory: string[]; radiology: string[] } = {
    laboratory: [...new Set<string>((allCodesData?.result?.laboratory ?? []).map((i: any) => i.category as string))],
    radiology: [...new Set<string>((allCodesData?.result?.radiology ?? []).map((i: any) => i.category as string))],
  }

  // Determine Domain
  const domain: 'laboratory' | 'radiology' = categories.radiology.includes(category) ? 'radiology' : 'laboratory'

  // Terminology Search
  const { data: searchResults, isFetching: isSearching } = client.laboratoryManagement.getServiceRequestCodes.useQuery(
    {
      query: searchTerm || undefined,
      domain: domain,
      category: category || undefined,
    },
    {
      enabled: !!category || searchTerm.length >= 3,
      queryKey: ['search-service-request-codes', { query: searchTerm, domain, category }]
    }
  )

  const flatSearchResults: any[] = [
    ...(searchResults?.result?.laboratory ?? []),
    ...(searchResults?.result?.radiology ?? []),
  ]

  // Create Order Mutation
  const createOrderMutation = client.laboratoryManagement.createOrder.useMutation()

  const handleAddItem = (values: any) => {
    const test = flatSearchResults.find((t: any) => t.id === values.testCodeId)
    if (!test) return

    const newItem: LabRequestItem = {
      key: String(test.id),
      testCodeId: test.loinc,
      testName: test.display,
      masterServiceRequestCodeId: test.id,
      priority: values.priority
    }

    if (selectedItems.find((item) => item.key === newItem.key)) {
      message.warning('Pemeriksaan ini sudah ada dalam daftar')
      return
    }

    setSelectedItems([...selectedItems, newItem])
    form.resetFields(['testCodeId', 'priority'])
  }

  const handleRemoveItem = (key: string) => {
    setSelectedItems(selectedItems.filter((item) => item.key !== key))
  }

  const handleSubmit = async () => {
    console.log('Submitting Order:', { selectedItems, patient, encounterId })

    if (selectedItems.length === 0) {
      message.error('Mohon pilih minimal satu pemeriksaan')
      return
    }

    if (!patient || !encounterId) {
      console.error('Missing patient or encounterId', { patient, encounterId })
      message.error(`Data tidak valid: ${!patient ? 'Pasien kosong' : ''} ${!encounterId ? 'Encounter ID kosong' : ''}`)
      return
    }

    try {
        const payload = {
            encounterId: encounterId,
            patientId: patient.id,
            items: selectedItems.map((item) => ({
              testCodeId: item.testCodeId,
              masterServiceRequestCodeId: item.masterServiceRequestCodeId,
              priority: item.priority
            })),
          }
      console.log('Payload:', payload)
      const res = await createOrderMutation.mutateAsync(payload)
      console.log('Order Created:', res)

      message.success('Permintaan laboratorium berhasil dibuat')
      handleClose()
    } catch (error: any) {
      console.error('Submit Error:', error)
      message.error(error.message || 'Gagal membuat permintaan laboratorium')
    }
  }

  const handleClose = () => {
    form.resetFields()
    setSelectedItems([])
    setSearchTerm('')
    onClose()
  }

  const columns: ColumnsType<LabRequestItem> = [
    {
      title: 'Nama Pemeriksaan',
      dataIndex: 'testName',
      key: 'testName'
    },
    {
      title: 'Prioritas',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        let color = 'default'
        if (priority === 'URGENT') color = 'orange'
        if (priority === 'STAT') color = 'red'
        return <span style={{ color: color === 'default' ? 'inherit' : color, fontWeight: 'bold' }}>{priority}</span>
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        />
      )
    }
  ]


  return (
    <Modal
      title="Buat Permintaan Laboratorium"
      open={open}
      onCancel={handleClose}
      width={1000}
      footer={[
        <Button key="back" onClick={handleClose}>
          Batal
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={createOrderMutation.isPending}
          onClick={handleSubmit}
          disabled={selectedItems.length === 0}
        >
          Kirim Permintaan
        </Button>
      ]}
    >
      <div className="py-4">
        <Row gutter={24}>
          <Col span={8}>
            <Card title="Informasi Pasien" className="mb-4" size="small">
              <div className="flex flex-col gap-2">
                <div>
                  <label className="text-gray-500 text-xs">Nama Pasien</label>
                  <div className="font-semibold text-base">{patient?.name || '-'}</div>
                </div>
                <div>
                  <label className="text-gray-500 text-xs">No. RM</label>
                  <div className="font-medium">{patient?.mrn || '-'}</div>
                </div>
              </div>
            </Card>

            <Card title="Tambah Pemeriksaan" size="small" style={{ marginTop: '1rem' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleAddItem}
                onFinishFailed={(errorInfo) =>
                  notifyFormValidationError(form, message, errorInfo, 'Lengkapi data pemeriksaan terlebih dahulu.')
                }
              >
                <Form.Item
                  name="category"
                  label="Kategori"
                >
                  <Select
                    placeholder="Pilih Kategori"
                    onChange={() => {
                        form.setFieldValue('testCodeId', undefined)
                        setSearchTerm('')
                    }}
                    loading={isFetchingCategories}
                  >
                    {categories.laboratory.map((cat: string) => (
                      <Select.Option key={cat} value={cat}>
                        {cat.replace(/([A-Z])/g, ' $1').trim()}
                      </Select.Option>
                    ))}
                    {categories.radiology.map((cat: string) => (
                      <Select.Option key={cat} value={cat}>
                        {cat.replace(/([A-Z])/g, ' $1').trim()}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  shouldUpdate={(prev, curr) => prev.category !== curr.category}
                >
                  {({ getFieldValue }) => {
                    const category = getFieldValue('category')
                    return (
                        <Form.Item
                        name="testCodeId"
                        label="Cari Pemeriksaan"
                        rules={[{ required: true, message: 'Pilih pemeriksaan' }]}
                        >
                        <Select
                            showSearch
                            placeholder={category ? "Pilih Pemeriksaan" : "Ketik minimal 3 karakter..."}
                            filterOption={false}
                            onSearch={(val) => setSearchTerm(val)}
                            loading={isSearching}
                            notFoundContent={!category && searchTerm.length < 3 ? 'Ketik minimal 3 karakter' : 'Tidak ditemukan'}
                            style={{ width: '100%' }}
                            onFocus={() => {
                                if (category && !searchTerm) {
                                    setSearchTerm('')
                                }
                            }}
                        >
                            {flatSearchResults.map((item: any) => (
                            <Select.Option key={item.id} value={item.id}>
                                {item.display}
                            </Select.Option>
                            ))}
                        </Select>
                        </Form.Item>
                    )
                  }}
                </Form.Item>

                <Form.Item
                  name="priority"
                  label="Prioritas"
                  initialValue="ROUTINE"
                  rules={[{ required: true }]}
                >
                  <Select style={{ width: '100%' }}>
                    <Select.Option value="ROUTINE">Routine</Select.Option>
                    <Select.Option value="URGENT">Urgent</Select.Option>
                    <Select.Option value="STAT">Cito (STAT)</Select.Option>
                  </Select>
                </Form.Item>

                <Button type="dashed" htmlType="submit" block icon={<PlusOutlined />}>
                  Tambah
                </Button>
              </Form>
            </Card>
          </Col>

          <Col span={16}>
            <div>
                <Table
                  dataSource={selectedItems}
                  columns={columns}
                  pagination={false}
                  locale={{ emptyText: 'Belum ada pemeriksaan dipilih' }}
                  size="small"
                  scroll={{ y: 400 }}
                />
            </div>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
