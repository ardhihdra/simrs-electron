import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { App, Button, Card, Col, Form, Modal, Row, Select, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

interface ServiceUnitItem {
  id: string
  name: string
  codeId: string
}

interface PractitionerItem {
  practitionerId: string | number
  doctorName: string
}

interface LabRequestItem {
  key: string
  testCodeId: string
  testName: string
  priority: 'ROUTINE' | 'URGENT' | 'STAT'
}

interface CreateAncillaryModalProps {
  open: boolean
  onClose: () => void
  patient: {
    id: string
    name: string
    mrn: string
  } | null
  encounter: {
    id: string
    practitionerId?: string | number
    serviceUnitName?: string
    queueTicket?: {
      practitionerId?: string | number
      poli?: {
        name: string
      }
    }
  } | null
}

export default function CreateAncillaryModal({ open, onClose, patient, encounter }: CreateAncillaryModalProps) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const category = Form.useWatch('category', form)
  const serviceUnitId = Form.useWatch('serviceUnitId', form)
  
  const [selectedItems, setSelectedItems] = useState<LabRequestItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch Service Units (Poli/Units)
  const { data: serviceUnitsData, isLoading: isLoadingUnits } = client.visitManagement.poli.useQuery({})
  
  // Fetch Categories
  const { data: categories, isLoading: isLoadingCategories } = client.laboratoryManagement.getTerminologyCategories.useQuery()

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
    } as any
  )

  const serviceUnitOptions = useMemo(() => {
    const rawData = serviceUnitsData as any
    const units = (rawData?.data as ServiceUnitItem[]) || []
    if (!category) return []
    
    return units.map((u) => ({
      value: u.id,
      label: u.name,
      code: u.codeId
    }))
  }, [serviceUnitsData, category])

  // Fetch Available Doctors for the selected unit
  const { data: doctorsData, isLoading: isLoadingDoctors } = client.registration.getAvailableDoctors.useQuery({
    date: dayjs().format('YYYY-MM-DD'),
    poliId: serviceUnitId ? Number(serviceUnitId) : undefined
  }, {
    enabled: !!serviceUnitId,
    queryKey: ['availableDoctors', { date: dayjs().format('YYYY-MM-DD'), poliId: serviceUnitId }]
  } as any)

  const doctorOptions = useMemo(() => {
    const rawData = doctorsData as any
    const result = rawData?.result || rawData?.data || rawData
    const doctors = (result?.doctors as PractitionerItem[]) || []
    return doctors.map((d) => ({
      value: Number(d.practitionerId),
      label: d.doctorName
    }))
  }, [doctorsData])

  const createAncillaryMutation = client.registration.createAncillaryEncounter.useMutation()

  const handleAddItem = (values: any) => {
    const test = searchResults?.result?.find((t: any) => t.name === values.testCodeId)
    if (!test) return

    const newItem: LabRequestItem = {
      key: test.loinc || test.name,
      testCodeId: test.loinc || test.name,
      testName: test.name,
      priority: values.priority
    }

    if (selectedItems.find((item) => item.key === newItem.key)) {
      message.warning('Pemeriksaan ini sudah ada dalam daftar')
      return
    }

    setSelectedItems([...selectedItems, newItem])
    form.resetFields(['testCodeId', 'priority'])
    setSearchTerm('')
  }

  const handleRemoveItem = (key: string) => {
    setSelectedItems(selectedItems.filter((item) => item.key !== key))
  }

  const handleSubmit = async (values: any) => {
    if (!patient || !encounter) {
      message.error('Data pasien atau encounter tidak valid')
      return
    }

    if (selectedItems.length === 0) {
      message.warning('Mohon pilih minimal satu pemeriksaan')
      return
    }

    try {
      const requestedByPractitionerId = Number(encounter.practitionerId || encounter.queueTicket?.practitionerId || 0)
      
      const payload = {
        patientId: patient.id,
        parentEncounterId: encounter.id,
        serviceUnitId: String(values.serviceUnitId),
        category: values.category as 'LABORATORY' | 'RADIOLOGY',
        practitionerId: Number(values.practitionerId),
        requestedByPractitionerId,
        items: selectedItems.map(item => ({
            testCodeId: item.testCodeId,
            priority: item.priority
        }))
      }

      await createAncillaryMutation.mutateAsync(payload)
      message.success(`Encounter ${values.category.toLowerCase()} berhasil dibuat`)
      handleClose()
    } catch (error: any) {
      console.error('Submit Error:', error)
      message.error(error.message || 'Gagal membuat encounter penunjang')
    }
  }

  const handleClose = () => {
    form.resetFields()
    setSelectedItems([])
    setSearchTerm('')
    onClose()
  }

  useEffect(() => {
    if (open && encounter) {
      form.setFieldsValue({
        category: 'LABORATORY'
      })
    }
  }, [open, encounter, form])

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
      width: 60,
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
      title="Buat Encounter Penunjang (Lab / Rad)"
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
          loading={createAncillaryMutation.isPending}
          onClick={() => form.submit()}
          disabled={selectedItems.length === 0}
        >
          Simpan encounter
        </Button>
      ]}
    >
      <div className="py-2">
        <Row gutter={24}>
          <Col span={9}>
            <Card title="Informasi & Tujuan" className="mb-4" size="small">
              <div className="flex flex-col gap-2 mb-4 p-2 bg-gray-50 rounded">
                <div>
                  <label className="text-gray-500 text-xs">Pasien</label>
                  <div className="font-semibold">{patient?.name} ({patient?.mrn})</div>
                </div>
                <div>
                  <label className="text-gray-500 text-xs">Unit/Poli Asal</label>
                  <div className="font-medium">
                    {encounter?.serviceUnitName || encounter?.queueTicket?.poli?.name || '-'}
                  </div>
                </div>
              </div>

              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  name="category"
                  label="Kategori Penunjang"
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { value: 'LABORATORY', label: 'Laboratorium' },
                      { value: 'RADIOLOGY', label: 'Radiologi' }
                    ]}
                    onChange={() => {
                      form.setFieldsValue({ serviceUnitId: undefined, practitionerId: undefined, testCodeId: undefined })
                      setSelectedItems([])
                      setSearchTerm('')
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="serviceUnitId"
                  label="Unit Penunjang Tujuan"
                  rules={[{ required: true, message: 'Harap pilih unit' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pilih Unit (Lab/Rad)"
                    loading={isLoadingUnits}
                    options={serviceUnitOptions}
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item
                  name="practitionerId"
                  label="Dokter Pemeriksa"
                  rules={[{ required: true, message: 'Harap pilih dokter' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pilih Dokter"
                    loading={isLoadingDoctors}
                    options={doctorOptions}
                    optionFilterProp="label"
                    disabled={!serviceUnitId}
                  />
                </Form.Item>

                <div className="mt-4 p-3 border-dashed border-2 border-gray-200 rounded">
                  <div className="font-medium mb-2 text-sm">Tambah Pemeriksaan ({domain})</div>
                  <Form.Item
                    name="testCodeId"
                    label="Nama Pemeriksaan"
                    className="mb-2"
                  >
                    <Select
                      showSearch
                      placeholder={category ? "Ketik minimal 3 karakter..." : "Pilih kategori dulu"}
                      filterOption={false}
                      onSearch={(val) => setSearchTerm(val)}
                      loading={isSearching}
                      disabled={!category}
                      notFoundContent={searchTerm.length < 3 ? 'Ketik minimal 3 karakter' : 'Tidak ditemukan'}
                      style={{ width: '100%' }}
                    >
                      {searchResults?.result?.map((item: any) => (
                        <Select.Option key={item.name} value={item.name}>
                          {item.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="priority"
                    label="Prioritas"
                    initialValue="ROUTINE"
                    className="mb-4"
                  >
                    <Select style={{ width: '100%' }}>
                      <Select.Option value="ROUTINE">Routine</Select.Option>
                      <Select.Option value="URGENT">Urgent</Select.Option>
                      <Select.Option value="STAT">Cito (STAT)</Select.Option>
                    </Select>
                  </Form.Item>

                  <Button 
                    type="dashed" 
                    block 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const val = form.getFieldValue('testCodeId')
                      const prio = form.getFieldValue('priority')
                      if (val) {
                        handleAddItem({ testCodeId: val, priority: prio })
                      } else {
                        message.warning('Pilih pemeriksaan terlebih dahulu')
                      }
                    }}
                  >
                    Tambah ke Daftar
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>

          <Col span={15}>
            <Card title="Daftar Pemeriksaan yang Akan Dipesan" size="small" className="h-full">
              <Table
                dataSource={selectedItems}
                columns={columns}
                pagination={false}
                locale={{ emptyText: 'Belum ada pemeriksaan dipilih' }}
                size="small"
                scroll={{ y: 560 }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
