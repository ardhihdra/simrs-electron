import { Button, Form, Input, InputNumber, Select, Card } from 'antd'
import { MinusCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { ItemSelectorModal } from '@renderer/components/organisms/ItemSelectorModal'
import { RacikanSelectorModal } from './RacikanSelectorModal'

interface MedicationCompoundsSectionProps {
  form: any
  itemOptions: any[]
  itemLoading: boolean
  itemKodeMap: Map<number, string>
  signaOptions: any[]
  signaLoading: boolean
  onAddSigna: () => void
}

export const MedicationCompoundsSection = ({
  form,
  itemOptions,
  itemLoading,
  signaOptions,
  signaLoading,
  onAddSigna = () => { console.warn('onAddSigna prop is missing in MedicationCompoundsSection') }
}: MedicationCompoundsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<{ compoundIndex: number; itemIndex: number | null } | null>(null)

  // Track items discovered from templates or existing records to show their names if missing from itemOptions
  const [templateItemData, setTemplateItemData] = useState<Record<number, { label: string; kekuatan: number | null }>>({})

  // Track compounds reactively
  const watchedCompounds = Form.useWatch('compounds', form)

  // Initialize labels/strengths from existing form values or catalog (for Edit mode)
  useEffect(() => {
    const compounds = watchedCompounds || []
    const newItemsData = { ...templateItemData }
    let changed = false

    compounds.forEach((c: any) => {
      if (c && Array.isArray(c.items)) {
        c.items.forEach((item: any) => {
          if (item?.itemId) {
            const current = newItemsData[item.itemId]
            
            // Resolve label from form state name or itemOptions catalog
            const catalogOpt = itemOptions.find(o => Number(o.value) === Number(item.itemId))
            const label = item.name || catalogOpt?.label
            const kekuatan = item._manualKekuatan ?? item._templateKekuatanNumerator ?? catalogOpt?.kekuatan ?? null
            
            if (label && (!current || current.label !== label || current.kekuatan !== kekuatan)) {
              newItemsData[item.itemId] = { label, kekuatan }
              changed = true
            }
          }
        })
      }
    })

    if (changed) {
      setTemplateItemData(newItemsData)
    }
  }, [watchedCompounds, itemOptions])

  const openModal = (compoundIndex: number, itemIndex: number | null = null) => {
    setCurrentRow({ compoundIndex, itemIndex })
    setIsModalOpen(true)
  }

  const handleSelectTemplate = (racikanData: any, addCompoundFn: (config: any) => void) => {
    const newItemsData = { ...templateItemData }

    // Mapping items from template to our form structure
    const mappedItems = (racikanData.items || []).map((item: any) => {
      const itemId = item.itemId ?? item.item_id

      // USER REQUEST: 
      // 1. Dosis field value comes from Master Racikan template
      // 2. K.O Label (divisor) comes from Master Item catalog
      const doseFromTemplate = item.kekuatanNumerator ?? item.kekuatan_numerator
      const strengthFromMaster = item.item?.kekuatan

      const doseToSet = doseFromTemplate ? Number(doseFromTemplate) : 0
      const strengthToSet = (strengthFromMaster && Number(strengthFromMaster) > 0) ? Number(strengthFromMaster) : 1
      const batchQty = racikanData.quantity || 1

      // Store info locally for display
      if (itemId) {
        newItemsData[itemId] = {
          label: item.item?.nama || `Item ${itemId}`,
          kekuatan: strengthToSet
        }
      }

      return {
        itemId: itemId,
        // Cumulative Dose: Dose per unit * Batch Quantity
        dosisDiminta: doseToSet * batchQty, 
        // Total Pcs: Cumulative Dose / Item Strength
        quantity: Math.ceil((doseToSet * batchQty) / strengthToSet), 
        _templateKekuatanNumerator: strengthToSet, // Used as K.O (divisor)
        _manualKekuatan: strengthToSet,
        _templateDoseOrig: doseToSet // Preserve original for multiplier automation
      }
    })

    setTemplateItemData(newItemsData)

    addCompoundFn({
      name: racikanData.nama,
      dosageInstruction: racikanData.defaultDosage ? [racikanData.defaultDosage] : [],
      quantity: 1,
      items: mappedItems,
      _isFromTemplate: true
    })
    setIsTemplateModalOpen(false)
  }

  const handleSelect = (item: any, addFn?: (config: any) => void) => {
    if (currentRow) {
      const { compoundIndex, itemIndex } = currentRow
      const compounds = form.getFieldValue('compounds') || []

      // Try to find strength from catalog options
      const opt = itemOptions.find(o => o.value === item.value)
      const kekuatan = opt?.kekuatan ? Number(opt.kekuatan) : null

      if (itemIndex !== null) {
        const updated = [...compounds]
        if (updated[compoundIndex]?.items) {
          updated[compoundIndex].items[itemIndex] = {
            ...updated[compoundIndex].items[itemIndex],
            itemId: item.value,
            _manualKekuatan: kekuatan
          }
          form.setFieldsValue({ compounds: updated })
        }
      } else if (addFn) {
        addFn({ itemId: item.value, quantity: 0, _manualKekuatan: kekuatan })
      }
    }
    setIsModalOpen(false)
    setCurrentRow(null)
  }

  return (
    <div className="mt-8">
      <h3 className="font-semibold text-lg mb-4 text-gray-700">Daftar Obat Racikan</h3>
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
                className="bg-orange-50 border-orange-100 rounded-xl overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-2">
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
                    <Select
                      placeholder="Pilih Signa / Dosis Racikan"
                      options={signaOptions}
                      loading={signaLoading}
                      showSearch
                      mode="tags"
                      dropdownRender={(menu) => (
                        <div>
                          {menu}
                          <div className="p-2 border-t text-center">
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlusOutlined />}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onAddSigna()
                              }}
                              block
                            >
                              Tambah Signa Baru
                            </Button>
                          </div>
                        </div>
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    label="Jumlah Racikan"
                    className="mb-0"
                  >
                    <InputNumber<number> 
                      min={1} 
                      className="w-full" 
                      onChange={(val) => {
                        if (val && typeof val === 'number') {
                          // Automation: Update cumulative dose for all ingredients that have a template source
                          const currentItems = form.getFieldValue(['compounds', name, 'items']) || []
                          const updatedItems = currentItems.map((ing: any) => {
                            if (ing && ing._templateDoseOrig !== undefined) {
                              const newCumulativeDose = ing._templateDoseOrig * val
                              const kO = ing._templateKekuatanNumerator ?? ing._manualKekuatan ?? 1
                              return {
                                ...ing,
                                dosisDiminta: newCumulativeDose,
                                quantity: Math.ceil(newCumulativeDose / kO)
                              }
                            }
                            return ing
                          })
                          form.setFieldValue(['compounds', name, 'items'], updatedItems)
                        }
                      }}
                    />
                  </Form.Item>
                </div>

                <div className="pl-4 border-l-2 border-orange-200 ml-2">
                  <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Komposisi:</p>
                  <Form.List name={[name, 'items']}>
                    {(subFields, subOpt) => (
                      <div className="space-y-2">
                        {subFields.map((subField) => {
                          const { key: subKey, ...subRestField } = subField

                          return (
                            <div key={`compoundItem-${subKey}`} className="flex gap-3 items-end bg-white p-3 rounded-xl border border-orange-100 shadow-sm mb-2 relative pr-10">
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'itemId']}
                                className="mb-0 flex-1"
                                label={<span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Nama Obat</span>}
                                rules={[{ required: true, message: 'Pilih obat' }]}
                              >
                                <Select
                                  options={[
                                    ...itemOptions,
                                    ...Object.entries(templateItemData).map(([id, data]) => ({
                                      value: Number(id),
                                      label: data.label
                                    }))
                                  ]}
                                  placeholder="Pilih Obat atau klik Cari"
                                  showSearch
                                  optionFilterProp="label"
                                  loading={itemLoading}
                                  dropdownRender={(menu) => (
                                    <div>
                                      {menu}
                                      <div className="p-2 border-t text-center">
                                        <Button
                                          type="primary"
                                          size="small"
                                          icon={<SearchOutlined />}
                                          onClick={() => openModal(name, subRestField.name)}
                                          block
                                        >
                                          Pencarian Lanjut
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  onChange={(val) => {
                                    // When manually selecting an item, find its strength in the catalog
                                    const selected = itemOptions.find(opt => opt.value === val)
                                    if (selected) {
                                      const rowName = subRestField.name
                                      // Get current values
                                      const currentItems = form.getFieldValue(['compounds', name, 'items']) || []
                                      const updatedItems = [...currentItems]
                                      
                                      if (updatedItems[rowName]) {
                                        updatedItems[rowName] = {
                                          ...updatedItems[rowName],
                                          itemId: val,
                                          dosisDiminta: selected.kekuatan ? Number(selected.kekuatan) : 1,
                                          _manualKekuatan: selected.kekuatan ? Number(selected.kekuatan) : 1
                                        }
                                        form.setFieldValue(['compounds', name, 'items'], updatedItems)
                                      }
                                    }
                                  }}
                                  allowClear
                                />
                              </Form.Item>

                              {/* Hidden Quantity Field - still needed for form submission */}
                              <Form.Item
                                {...subRestField}
                                name={[subRestField.name, 'quantity']}
                                hidden
                              >
                                <InputNumber />
                              </Form.Item>

                              <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) => {
                                  const prevItems = prevValues.compounds?.[name]?.items || [];
                                  const currentItems = currentValues.compounds?.[name]?.items || [];

                                  const prevQty = prevValues.compounds?.[name]?.quantity;
                                  const currentQty = currentValues.compounds?.[name]?.quantity;

                                  return prevItems[subField.name] !== currentItems[subField.name] || prevQty !== currentQty;
                                }}
                              >
                                {({ getFieldValue, setFieldValue }) => {
                                  // Cumulative Dose Logic (Cara B):
                                  // Total Pcs = Dosis Kumulatif / Kekuatan Obat
                                  // (Compound Quantity automation is handled by Jml Racikan onChange)
                                  const item = getFieldValue(['compounds', name, 'items', subField.name])

                                  // Priority Fallback Logic:
                                  // 1. Metadata from template (_templateKekuatanNumerator)
                                  // 2. Metadata from manual selection (_manualKekuatan)
                                  // 3. Fallback from itemOptions (global catalog)
                                  const kFromOptions = itemOptions.find(o => o.value === item?.itemId)?.kekuatan
                                  // Fallback: Check templateItemData specifically for Edit mode label resolution
                                  const kFromTemplate = item?.itemId ? templateItemData[item.itemId]?.kekuatan : null
                                  
                                  const kO = item?._templateKekuatanNumerator ?? item?._manualKekuatan ?? (kFromOptions ? Number(kFromOptions) : (kFromTemplate ? Number(kFromTemplate) : 1))
                                  const kekuatanDisplay = (item?._templateKekuatanNumerator ?? item?._manualKekuatan ?? kFromOptions ?? kFromTemplate) || '?'

                                  return (
                                    <div className="flex gap-3 items-end">
                                      <Form.Item
                                        {...subRestField}
                                        name={[subField.name, 'dosisDiminta']}
                                        className="mb-0 w-40"
                                        label={<span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Kekuatan obat ({kekuatanDisplay})</span>}
                                      >
                                        <InputNumber
                                          placeholder="Dosis Total"
                                          min={0}
                                          className="w-full"
                                          onChange={(val) => {
                                            const dosisKumulatif = val || 0
                                            const qtyObat = Math.ceil(dosisKumulatif / kO)
                                            setFieldValue(['compounds', name, 'items', subField.name, 'quantity'], qtyObat)
                                          }}
                                        />
                                      </Form.Item>

                                      <Form.Item
                                        label={<span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Total</span>}
                                        className="mb-0"
                                      >
                                        <div className="h-[32px] min-w-[80px] flex items-center justify-center bg-orange-50 border border-orange-200 rounded-lg px-2 text-sm font-bold text-orange-600 shadow-sm">
                                          {item?.quantity || 0}<span className="text-[10px] font-normal text-orange-400 ml-1">pcs</span>
                                        </div>
                                      </Form.Item>
                                    </div>
                                  )
                                }}
                              </Form.Item>

                              <div className="absolute right-2 bottom-4">
                                <Button
                                  type="text"
                                  danger
                                  icon={<MinusCircleOutlined />}
                                  onClick={() => subOpt.remove(subField.name)}
                                  className="hover:bg-red-50"
                                />
                              </div>
                            </div>
                          )
                        })}
                        <Button
                          type="dashed"
                          size="small"
                          onClick={() => openModal(name, null)}
                          icon={<PlusOutlined />}
                          className="mt-2"
                        >
                          Tambah Komposisi (Pencarian Lanjut)
                        </Button>

                        <ItemSelectorModal
                          open={isModalOpen && currentRow?.compoundIndex === name}
                          onCancel={() => {
                            setIsModalOpen(false)
                            setCurrentRow(null)
                          }}
                          onSelect={(item) => handleSelect(item, subOpt.add)}
                          itemOptions={itemOptions}
                          loading={itemLoading}
                        />
                      </div>
                    )}
                  </Form.List>
                </div>
              </Card>
            ))}
            <div className="flex gap-2">
              <Button type="primary" ghost onClick={() => setIsTemplateModalOpen(true)} className="flex-1" icon={<SearchOutlined />} size="large">
                Pilih Template Racikan
              </Button>
              <Button type="dashed" onClick={() => add()} className="flex-1" icon={<PlusOutlined />} size="large">
                Tambah Racikan Kosong Baru
              </Button>
            </div>

            <RacikanSelectorModal
              open={isTemplateModalOpen}
              onCancel={() => setIsTemplateModalOpen(false)}
              onSelect={(record) => handleSelectTemplate(record, add)}
            />
          </div>
        )}
      </Form.List>
    </div>
  )
}
