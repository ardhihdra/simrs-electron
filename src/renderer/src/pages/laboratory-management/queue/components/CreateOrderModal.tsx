import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Button, Card, Col, Form, Modal, Row, Select, Table, message } from 'antd'
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
  priority: 'ROUTINE' | 'URGENT' | 'STAT'
}

export default function CreateOrderModal({ open, onClose, patient, encounterId }: CreateOrderModalProps) {
  const [form] = Form.useForm()
  const [selectedItems, setSelectedItems] = useState<LabRequestItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const category = Form.useWatch('category', form)
  
  // Fetch Categories
  const { data: categories, isFetching: isFetchingCategories } = client.laboratoryManagement.getTerminologyCategories.useQuery()

  // Determine Domain
  let domain: 'laboratory' | 'radiology' = 'laboratory'
  if (category && categories?.result?.radiology?.includes(category)) {
      domain = 'radiology'
  }

  // Terminology Search
  const { data: searchResults, isFetching: isSearching } = client.laboratoryManagement.searchTerminology.useQuery(
    {
      query: searchTerm,
      domain: domain,
      category: category,
      limit: 20
    },
    {
      enabled: !!category || searchTerm.length >= 3,
      queryKey: ['search-terminology', { query: searchTerm, domain, category, limit: 20 }]
    }
  )

  // Create Order Mutation
  const createOrderMutation = client.laboratoryManagement.createOrder.useMutation()

  const handleAddItem = (values: any) => {
    // User selected 'name' in the dropdown, so values.testCodeId is the name
    const test = searchResults?.result?.find((t: any) => t.name === values.testCodeId)
    if (!test) return

    const newItem: LabRequestItem = {
      key: test.loinc || test.name, // Use LOINC as unique key if available
      testCodeId: test.loinc || test.name, // Assuming backend expects LOINC or Name
      testName: test.name,
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

            <Card title="Tambah Pemeriksaan" size="small">
              <Form form={form} layout="vertical" onFinish={handleAddItem}>
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
                    {categories?.result?.laboratory?.map((cat: string) => (
                      <Select.Option key={cat} value={cat}>
                        {cat.replace(/([A-Z])/g, ' $1').trim()} {/* Format camelCase to Title Case */}
                      </Select.Option>
                    ))}
                     {categories?.result?.radiology?.map((cat: string) => (
                      <Select.Option key={cat} value={cat}>
                        {cat.replace(/([A-Z])/g, ' $1').trim()} {/* Format camelCase to Title Case */}
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
                            {searchResults?.result?.map((item: any) => (
                            <Select.Option key={item.name} value={item.name}>
                                {item.name}
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
