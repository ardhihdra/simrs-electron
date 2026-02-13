import { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  Table,
  Space,
  App,
  Tabs,
  Select,
  InputNumber,
  Row,
  Col,
  Tag
} from 'antd'
import {
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import type { ColumnsType } from 'antd/es/table'
import {
  Medicine,
  MedicineCategory,
  Supply,
  SupplyCategory,
  CompoundFormulation,
  CompoundIngredient,
  PrescriptionItem,
  PrescriptionItemType,
  PatientWithMedicalRecord
} from '../../types/doctor.types'
import {
  getMedicines,
  searchMedicines,
  getSupplies,
  searchSupplies,
  createPrescription
} from '../../services/doctor.service'

const { Option } = Select
const { TabPane } = Tabs

interface CartItem extends PrescriptionItem {
  key: string
  itemName: string
}

interface PrescriptionFormProps {
  encounterId: string
  patientData: PatientWithMedicalRecord
}

interface RawMaterialAttributes {
  id?: number
  name: string
}

interface RawMaterialApi {
  list: () => Promise<{ success: boolean; result?: RawMaterialAttributes[]; message?: string }>
}

export const PrescriptionForm = ({ encounterId, patientData }: PrescriptionFormProps) => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()

  const [racikanForm] = Form.useForm()
  const compoundsValue = Form.useWatch('compounds', racikanForm)

  const [submitting, setSubmitting] = useState(false)

  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [medicineCategory, setMedicineCategory] = useState<MedicineCategory | undefined>(undefined)

  const [supplies, setSupplies] = useState<Supply[]>([])
  const [supplyCategory, setSupplyCategory] = useState<SupplyCategory | undefined>(undefined)

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterialAttributes[]>([])

  useEffect(() => {
    loadMedicines()
    loadSupplies()
    loadRawMaterials()
  }, [encounterId])

  const loadRawMaterials = async () => {
    try {
      const api = (window.api?.query as { rawMaterial?: RawMaterialApi }).rawMaterial
      if (api?.list) {
        const response = await api.list()
        if (response.success && response.result) {
          setRawMaterials(response.result)
        }
      }
    } catch (error) {
      console.error('Error loading raw materials:', error)
    }
  }

  const loadMedicines = async (category?: MedicineCategory, search?: string) => {
    try {
      let data: Medicine[]
      if (search) {
        data = await searchMedicines(search)
      } else {
        data = await getMedicines(category)
      }
      setMedicines(data)
    } catch (error) {
      console.error('Error loading medicines:', error)
    }
  }

  const loadSupplies = async (category?: SupplyCategory, search?: string) => {
    try {
      let data: Supply[]
      if (search) {
        data = await searchSupplies(search)
      } else {
        data = await getSupplies(category)
      }
      setSupplies(data)
    } catch (error) {
      console.error('Error loading supplies:', error)
    }
  }

  const handleMedicineCategoryChange = (value: MedicineCategory) => {
    setMedicineCategory(value)
    loadMedicines(value)
  }

  const handleMedicineSearch = (value: string) => {
    if (value.length >= 2) {
      loadMedicines(undefined, value)
    } else if (value.length === 0) {
      loadMedicines(medicineCategory)
    }
  }

  const handleSupplyCategoryChange = (value: SupplyCategory) => {
    setSupplyCategory(value)
    loadSupplies(value)
  }

  const handleSupplySearch = (value: string) => {
    if (value.length >= 2) {
      loadSupplies(undefined, value)
    } else if (value.length === 0) {
      loadSupplies(supplyCategory)
    }
  }

  const handleAddToCart = (
    type: PrescriptionItemType,
    item: Medicine | Supply | CompoundFormulation
  ) => {
    const itemNameKey = 'name' in item ? item.name : ''
    if (cartItems.find((c) => c.itemName === itemNameKey && c.type === type)) {
      message.warning('Item ini sudah ada di keranjang')
      return
    }

    const cartItem: CartItem = {
      key: `cart-${Date.now()}`,
      type,
      item,
      itemName: itemNameKey,
      quantity: 1,
      dosageInstructions: ''
    }

    setCartItems([...cartItems, cartItem])
    message.success('Ditambahkan ke keranjang resep')
  }

  const handleRemoveFromCart = (key: string) => {
    setCartItems(cartItems.filter((item) => item.key !== key))
  }

  const handleCartItemChange = (key: string, field: string, value: any) => {
    const updated = cartItems.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    setCartItems(updated)
  }

  const handleSubmitPrescription = async () => {
    const racikanValues = racikanForm.getFieldsValue()
    const compoundList = racikanValues.compounds || []

    // Validate empty
    if (cartItems.length === 0 && compoundList.length === 0) {
      message.error('Keranjang resep kosong. Tambahkan minimal 1 item.')
      return
    }

    // Validate cart items
    for (const item of cartItems) {
      if (!item.dosageInstructions || item.dosageInstructions.trim() === '') {
        message.error(`Instruksi dosis untuk "${item.itemName}" belum diisi`)
        return
      }
      if (item.quantity <= 0) {
        message.error(`Jumlah untuk "${item.itemName}" tidak valid`)
        return
      }
    }

    const processedCompounds: PrescriptionItem[] = []

    for (const comp of compoundList) {
      if (!comp.name || !comp.dosageInstruction || !comp.quantity) {
        message.error('Data racikan tidak lengakap')
        return
      }

      if (!comp.items || comp.items.length === 0) {
        message.error(`Komposisi untuk racikan ${comp.name} kosong`)
        return
      }

      const ingredients: CompoundIngredient[] = []

      for (const ingredient of comp.items) {
        let itemObj: Medicine | Supply | null = null

        if (ingredient.sourceType === 'substance') {
          const found = rawMaterials.find((r) => r.id === ingredient.rawMaterialId)
          if (found) {
            itemObj = {
              id: String(found.id),
              name: found.name,
              code: '',
              category: SupplyCategory.OTHER,
              unit: '-',
              stock: 0,
              price: 0
            } as Supply
          }
        } else {
          const found = medicines.find((m) => m.id === ingredient.medicationId)
          if (found) itemObj = found
        }

        if (!itemObj) {
          message.error(`Item tidak ditemukan untuk racikan ${comp.name}`)
          return
        }

        ingredients.push({
          item: itemObj,
          quantity: 1,
          dosage: ingredient.note || ''
        })
      }

      const compoundFormulation: CompoundFormulation = {
        name: comp.name,
        ingredients,
        instructions: comp.dosageInstruction
      }

      processedCompounds.push({
        type: PrescriptionItemType.COMPOUND,
        item: compoundFormulation,
        quantity: comp.quantity,
        dosageInstructions: comp.dosageInstruction,
        notes: comp.quantityUnit
      })
    }

    if (!encounterId || !patientData) return

    setSubmitting(true)
    try {
      const finalItems = [...cartItems, ...processedCompounds]

      const response = await createPrescription({
        prescription: {
          encounterId,
          patientId: patientData.patient.id,
          doctorId: 'doctor-001', // TODO: from logged in user
          doctorName: patientData.doctor.name,
          items: finalItems,
          prescriptionDate: new Date().toISOString()
        }
      })

      if (response.success) {
        modal.success({
          title: 'Resep Berhasil Dibuat!',
          content: 'Resep telah berhasil disimpan. Pasien dapat mengambil obat di apotek.',
          onOk: () => {
            navigate('/dashboard/doctor')
          }
        })
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error('Gagal membuat resep')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const medicineOptions = medicines.map((m) => ({
    label: `${m.name} (Stok: ${m.stock})`,
    value: m.id
  }))

  const rawMaterialOptions = rawMaterials.map((rm) => ({
    label: rm.name,
    value: rm.id
  }))

  const medicineColumns: ColumnsType<Medicine> = [
    { title: 'Kode', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Nama Obat', dataIndex: 'name', key: 'name' },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: string) => cat.replace(/_/g, ' ')
    },
    {
      title: 'Bentuk',
      dataIndex: 'dosageForm',
      key: 'dosageForm',
      width: 100,
      render: (form: string) => form.replace(/_/g, ' ')
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock: number) => (
        <Tag color={stock < 10 ? 'red' : stock < 50 ? 'orange' : 'green'}>{stock}</Tag>
      )
    },
    { title: 'Satuan', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `Rp ${price.toLocaleString()}`
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleAddToCart(PrescriptionItemType.MEDICINE, record)}
          disabled={record.stock === 0}
        >
          Tambah
        </Button>
      )
    }
  ]

  const supplyColumns: ColumnsType<Supply> = [
    { title: 'Kode', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Nama Barang', dataIndex: 'name', key: 'name' },
    {
      title: 'Kategori',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: string) => cat.replace(/_/g, ' ')
    },
    {
      title: 'Stok',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (stock: number) => (
        <Tag color={stock < 10 ? 'red' : stock < 50 ? 'orange' : 'green'}>{stock}</Tag>
      )
    },
    { title: 'Satuan', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Harga',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `Rp ${price.toLocaleString()}`
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => handleAddToCart(PrescriptionItemType.SUPPLY, record)}
          disabled={record.stock === 0}
        >
          Tambah
        </Button>
      )
    }
  ]

  const cartColumns: ColumnsType<CartItem> = [
    {
      title: 'Tipe',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: PrescriptionItemType) => {
        const colors = {
          [PrescriptionItemType.MEDICINE]: 'blue',
          [PrescriptionItemType.SUPPLY]: 'orange',
          [PrescriptionItemType.COMPOUND]: 'purple'
        }
        return <Tag color={colors[type]}>{type}</Tag>
      }
    },
    { title: 'Nama', dataIndex: 'itemName', key: 'itemName' },
    {
      title: 'Jumlah',
      key: 'quantity',
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => handleCartItemChange(record.key, 'quantity', val || 1)}
          className="w-full"
        />
      )
    },
    {
      title: 'Instruksi Dosis',
      key: 'dosageInstructions',
      width: 250,
      render: (_, record) => (
        <Input
          placeholder="e.g., 3x1 sehari sesudah makan"
          value={record.dosageInstructions}
          onChange={(e) => handleCartItemChange(record.key, 'dosageInstructions', e.target.value)}
        />
      )
    },
    {
      title: 'Catatan',
      key: 'notes',
      width: 200,
      render: (_, record) => (
        <Input
          placeholder="Catatan tambahan"
          value={record.notes}
          onChange={(e) => handleCartItemChange(record.key, 'notes', e.target.value)}
        />
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveFromCart(record.key)}
        />
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Obat" key="1">
            <Space direction="vertical" className="w-full" size="middle">
              <Row gutter={16}>
                <Col span={8}>
                  <Select
                    placeholder="Filter Kategori Obat"
                    allowClear
                    onChange={handleMedicineCategoryChange}
                    className="w-full"
                  >
                    {Object.values(MedicineCategory).map((cat) => (
                      <Option key={cat} value={cat}>
                        {cat.replace(/_/g, ' ')}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={16}>
                  <Input.Search
                    placeholder="Cari obat..."
                    allowClear
                    onSearch={handleMedicineSearch}
                    onChange={(e) => handleMedicineSearch(e.target.value)}
                  />
                </Col>
              </Row>

              <Table
                columns={medicineColumns}
                dataSource={medicines}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              />
            </Space>
          </TabPane>

          <TabPane tab="Barang" key="2">
            <Space direction="vertical" className="w-full" size="middle">
              <Row gutter={16}>
                <Col span={8}>
                  <Select
                    placeholder="Filter Kategori Barang"
                    allowClear
                    onChange={handleSupplyCategoryChange}
                    className="w-full"
                  >
                    {Object.values(SupplyCategory).map((cat) => (
                      <Option key={cat} value={cat}>
                        {cat.replace(/_/g, ' ')}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={16}>
                  <Input.Search
                    placeholder="Cari barang..."
                    allowClear
                    onSearch={handleSupplySearch}
                    onChange={(e) => handleSupplySearch(e.target.value)}
                  />
                </Col>
              </Row>

              <Table
                columns={supplyColumns}
                dataSource={supplies}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              />
            </Space>
          </TabPane>

          <TabPane tab="Racikan" key="3">
            <Form form={racikanForm} layout="vertical">
              <div className="space-y-6">
                <Form.List name="compounds">
                  {(fields, { add, remove }) => (
                    <div className="space-y-6">
                      {fields.map(({ key, name, ...restField }) => (
                        <Card
                          key={`compound-${key}`}
                          size="small"
                          title={`Racikan ${name + 1}`}
                          extra={
                            <Button type="text" danger onClick={() => remove(name)}>
                              Hapus
                            </Button>
                          }
                          className="bg-orange-50 border-orange-100"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <Form.Item
                              {...restField}
                              name={[name, 'name']}
                              label="Nama Racikan"
                              rules={[{ required: true, message: 'Nama racikan wajib diisi' }]}
                              className="mb-0"
                            >
                              <Input placeholder="Contoh: Puyer Batuk Pilek" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'dosageInstruction']}
                              label="Signa / Dosis Racikan"
                              rules={[{ required: true, message: 'Dosis racikan wajib diisi' }]}
                              className="mb-0"
                            >
                              <Input placeholder="Contoh: 3x1 Bungkus" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'quantity']}
                              label="Jumlah Racikan"
                              className="mb-0"
                            >
                              <InputNumber<number> min={1} className="w-full" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'quantityUnit']}
                              label="Satuan Racikan"
                              className="mb-0"
                            >
                              <Input placeholder="Contoh: bungkus, botol" />
                            </Form.Item>
                          </div>

                          <div className="pl-4 border-l-2 border-orange-200">
                            <p className="text-xs text-gray-500 mb-2 font-semibold">KOMPOSISI:</p>
                            <Form.List name={[name, 'items']}>
                              {(subFields, subOpt) => (
                                <div className="space-y-2">
                                  {subFields.map((subField) => {
                                    const { key: subKey, ...subRestField } = subField

                                    return (
                                      <div
                                        key={`compoundItem-${subKey}`}
                                        className="flex gap-2 items-start"
                                      >
                                        <Form.Item
                                          {...subRestField}
                                          name={[subRestField.name, 'sourceType']}
                                          className="mb-0 w-32"
                                          initialValue="medicine"
                                        >
                                          <Select
                                            options={[
                                              { label: 'Obat', value: 'medicine' },
                                              { label: 'Bahan Baku', value: 'substance' }
                                            ]}
                                          />
                                        </Form.Item>
                                        <Form.Item shouldUpdate noStyle>
                                          {() => {
                                            const compounds = racikanForm.getFieldValue('compounds')
                                            const compound = Array.isArray(compounds)
                                              ? compounds[name]
                                              : undefined
                                            const items = compound?.items || []
                                            const currentItem = items[subField.name] || {}
                                            const sourceType = currentItem.sourceType || 'medicine'

                                            if (sourceType === 'substance') {
                                              return (
                                                <Form.Item
                                                  {...subRestField}
                                                  name={[subRestField.name, 'rawMaterialId']}
                                                  className="mb-0 flex-1"
                                                  rules={[
                                                    { required: true, message: 'Pilih bahan baku' }
                                                  ]}
                                                >
                                                  <Select
                                                    options={rawMaterialOptions}
                                                    placeholder="Pilih Bahan Baku"
                                                    showSearch
                                                    optionFilterProp="label"
                                                  />
                                                </Form.Item>
                                              )
                                            }

                                            return (
                                              <Form.Item
                                                {...subRestField}
                                                name={[subRestField.name, 'medicationId']}
                                                className="mb-0 flex-1"
                                                rules={[{ required: true, message: 'Pilih obat' }]}
                                              >
                                                <Select
                                                  options={medicineOptions}
                                                  placeholder="Pilih Obat"
                                                  showSearch
                                                  optionFilterProp="label"
                                                />
                                              </Form.Item>
                                            )
                                          }}
                                        </Form.Item>
                                        <Form.Item
                                          {...subRestField}
                                          name={[subRestField.name, 'note']}
                                          className="mb-0 w-32"
                                        >
                                          <Input placeholder="Kekuatan (mg)" />
                                        </Form.Item>
                                        <Button
                                          type="text"
                                          danger
                                          icon={<MinusCircleOutlined />}
                                          onClick={() => subOpt.remove(subField.name)}
                                        />
                                      </div>
                                    )
                                  })}
                                  <Button
                                    type="dashed"
                                    size="small"
                                    onClick={() => subOpt.add()}
                                    icon={<PlusOutlined />}
                                  >
                                    Tambah Komposisi
                                  </Button>
                                </div>
                              )}
                            </Form.List>
                          </div>
                        </Card>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Tambah Racikan Baru
                      </Button>
                    </div>
                  )}
                </Form.List>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      <Card
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>Keranjang Resep ({cartItems.length} item)</span>
          </Space>
        }
      >
        <Table
          columns={cartColumns}
          dataSource={cartItems}
          pagination={false}
          locale={{
            emptyText: 'Keranjang kosong. Tambahkan obat, barang, atau racikan dari tab di atas.'
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Space>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={handleSubmitPrescription}
          loading={submitting}
          disabled={cartItems.length === 0 && (!compoundsValue || compoundsValue.length === 0)}
        >
          Buat Resep
        </Button>
        <Button size="large" onClick={() => navigate('/dashboard/doctor')}>
          Batal
        </Button>
      </Space>
    </div>
  )
}

export default PrescriptionForm
