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
  Tag,
  Modal,
  Divider
} from 'antd'
import { SaveOutlined, DeleteOutlined, PlusOutlined, ShoppingCartOutlined } from '@ant-design/icons'
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
  saveCompoundFormulation,
  getCompoundFormulations,
  createPrescription
} from '../../services/doctor.service'

const { TextArea } = Input
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

export const PrescriptionForm = ({ encounterId, patientData }: PrescriptionFormProps) => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [compoundForm] = Form.useForm()

  const [submitting, setSubmitting] = useState(false)

  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [medicineCategory, setMedicineCategory] = useState<MedicineCategory | undefined>(undefined)

  const [supplies, setSupplies] = useState<Supply[]>([])
  const [supplyCategory, setSupplyCategory] = useState<SupplyCategory | undefined>(undefined)

  const [compounds, setCompounds] = useState<CompoundFormulation[]>([])
  const [compoundIngredients, setCompoundIngredients] = useState<CompoundIngredient[]>([])
  const [allItems, setAllItems] = useState<(Medicine | Supply)[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [compoundModalVisible, setCompoundModalVisible] = useState(false)

  useEffect(() => {
    loadMedicines()
    loadSupplies()
    loadCompounds()
  }, [encounterId])

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

  const loadCompounds = async () => {
    try {
      const data = await getCompoundFormulations()
      setCompounds(data)
    } catch (error) {
      console.error('Error loading compounds:', error)
    }
  }

  useEffect(() => {
    const combined = [
      ...medicines.map((m) => ({ ...m, type: 'medicine' as const })),
      ...supplies.map((s) => ({ ...s, type: 'supply' as const }))
    ]
    setAllItems(combined as any)
  }, [medicines, supplies])

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

  const handleAddCompoundIngredient = () => {
    setCompoundIngredients([
      ...compoundIngredients,
      {
        item: null as any,
        itemType: 'medicine',
        quantity: 1,
        dosage: ''
      }
    ])
  }

  const handleRemoveCompoundIngredient = (index: number) => {
    setCompoundIngredients(compoundIngredients.filter((_, i) => i !== index))
  }

  const handleCompoundIngredientChange = (
    index: number,
    field: 'item' | 'quantity' | 'dosage',
    value: any
  ) => {
    const updated = [...compoundIngredients]
    if (field === 'item') {
      const foundItem = allItems.find((item) => item.id === value)
      if (foundItem) {
        updated[index].item = foundItem
        updated[index].itemType =
          'type' in foundItem && foundItem.type === 'supply' ? 'supply' : 'medicine'
      }
    } else {
      updated[index][field] = value
    }
    setCompoundIngredients(updated)
  }

  const handleSaveCompound = async () => {
    try {
      const values = await compoundForm.validateFields()

      if (compoundIngredients.length === 0) {
        message.error('Minimal harus ada 1 bahan untuk racikan')
        return
      }

      if (compoundIngredients.some((ing) => !ing.item)) {
        message.error('Semua bahan harus dipilih')
        return
      }

      const compound: CompoundFormulation = {
        name: values.compoundName,
        ingredients: compoundIngredients,
        instructions: values.compoundInstructions
      }

      const response = await saveCompoundFormulation({ compound })

      if (response.success) {
        message.success(response.message)
        setCompoundModalVisible(false)
        compoundForm.resetFields()
        setCompoundIngredients([])
        await loadCompounds()
      } else {
        message.error(response.message)
      }
    } catch (error) {
      console.error('Error saving compound:', error)
    }
  }

  const handleSubmitPrescription = async () => {
    if (cartItems.length === 0) {
      message.error('Keranjang resep kosong. Tambahkan minimal 1 item.')
      return
    }

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

    if (!encounterId || !patientData) return

    setSubmitting(true)
    try {
      const response = await createPrescription({
        prescription: {
          encounterId,
          patientId: patientData.patient.id,
          doctorId: 'doctor-001', // TODO: from logged in user
          doctorName: patientData.doctor.name,
          items: cartItems,
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
            <Space direction="vertical" className="w-full" size="large">
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => setCompoundModalVisible(true)}
                size="large"
                block
              >
                Buat Racikan Baru
              </Button>

              <Divider>Racikan yang Tersimpan</Divider>

              {compounds.length === 0 ? (
                <div className="text-center text-gray-400 py-8">Belum ada racikan tersimpan</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {compounds.map((compound) => (
                    <Card
                      key={compound.id}
                      size="small"
                      title={compound.name}
                      extra={
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleAddToCart(PrescriptionItemType.COMPOUND, compound)}
                        >
                          Tambah ke Resep
                        </Button>
                      }
                    >
                      <div className="text-sm">
                        <div className="font-semibold mb-2">Bahan:</div>
                        <ul className="list-disc list-inside mb-2">
                          {compound.ingredients.map((ing, idx) => (
                            <li key={idx}>
                              {ing.item.name} - {ing.quantity} {ing.dosage}
                            </li>
                          ))}
                        </ul>
                        <div className="font-semibold mb-1">Instruksi:</div>
                        <div>{compound.instructions}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Space>
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
          disabled={cartItems.length === 0}
        >
          Buat Resep
        </Button>
        <Button size="large" onClick={() => navigate('/dashboard/doctor')}>
          Batal
        </Button>
      </Space>

      <Modal
        title="Buat Racikan Baru"
        open={compoundModalVisible}
        onOk={handleSaveCompound}
        onCancel={() => {
          setCompoundModalVisible(false)
          compoundForm.resetFields()
          setCompoundIngredients([])
        }}
        width={800}
        okText="Simpan Racikan"
        cancelText="Batal"
      >
        <Form form={compoundForm} layout="vertical">
          <Form.Item
            label="Nama Racikan"
            name="compoundName"
            rules={[{ required: true, message: 'Nama racikan wajib diisi' }]}
          >
            <Input placeholder="e.g., Racikan Batuk Anak" />
          </Form.Item>

          <Form.Item label="Bahan-bahan">
            <Space direction="vertical" className="w-full">
              {compoundIngredients.map((ing, index) => (
                <Card key={index} size="small">
                  <Row gutter={8}>
                    <Col span={10}>
                      <Select
                        placeholder="Pilih obat/barang"
                        showSearch
                        optionFilterProp="children"
                        value={ing.item?.id}
                        onChange={(val) => handleCompoundIngredientChange(index, 'item', val)}
                        className="w-full"
                      >
                        {allItems.map((item) => (
                          <Option key={item.id} value={item.id}>
                            {item.name}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col span={4}>
                      <InputNumber
                        placeholder="Jumlah"
                        min={1}
                        value={ing.quantity}
                        onChange={(val) =>
                          handleCompoundIngredientChange(index, 'quantity', val || 1)
                        }
                        className="w-full"
                      />
                    </Col>
                    <Col span={8}>
                      <Input
                        placeholder="Takaran (e.g., sendok teh)"
                        value={ing.dosage}
                        onChange={(e) =>
                          handleCompoundIngredientChange(index, 'dosage', e.target.value)
                        }
                      />
                    </Col>
                    <Col span={2}>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveCompoundIngredient(index)}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddCompoundIngredient}
                block
              >
                Tambah Bahan
              </Button>
            </Space>
          </Form.Item>

          <Form.Item
            label="Keterangan / Instruksi"
            name="compoundInstructions"
            rules={[{ required: true, message: 'Instruksi wajib diisi' }]}
          >
            <TextArea rows={3} placeholder="Cara penggunaan racikan..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PrescriptionForm
