import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { App as AntdApp } from 'antd'
import dayjs from 'dayjs'
import { MedicationRequestIntent, SupportingInformationItemInfo, ItemAttributes } from 'simrs-types'
import {
  FormData,
  ItemOption
} from '../types'

export const useMedicationRequestUpdate = (id: string, itemOptions: ItemOption[], itemSource: any) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { message, modal } = AntdApp.useApp()

  const buildDispenseRequest = (quantity?: number, unit?: string) => {
    if (!quantity) return null
    return {
      quantity: {
        value: quantity,
        unit: unit || undefined
      }
    }
  }

  const buildDosageInstruction = (text?: string, quantity?: number, unit?: string) => {
    const doseValue = typeof quantity === 'number' && quantity > 0 ? quantity : 1
    const doseUnit = typeof unit === 'string' && unit.trim().length > 0 ? unit.trim() : undefined
    return {
      sequence: 1,
      text: typeof text === 'string' ? text : undefined,
      timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } },
      doseAndRate: [
        {
          type: {
            coding: [
              { system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type', code: 'ordered' }
            ]
          },
          doseQuantity: { value: doseValue, unit: doseUnit }
        }
      ]
    }
  }

  const updateMutation = useMutation({
    mutationKey: ['medicationRequest', 'update', id],
    mutationFn: (data: any) => {
      const fn = (window.api?.query as any)?.medicationRequest?.update
      if (!fn) throw new Error('API MedicationRequest.update tidak tersedia.')
      
      return fn({
        id: Number(id),
        ...data
      })
    },
    onSuccess: (res: any) => {
      if (!res?.success) {
        const msg = res?.error || res?.message || 'Gagal memperbarui Permintaan Obat'
        modal.error({ title: 'Gagal', content: msg })
        return
      }
      message.success('Permintaan Obat berhasil diperbarui')
      queryClient.invalidateQueries({ queryKey: ['medicationRequest'] })
      navigate('/dashboard/medicine/medication-requests')
    },
    onError: (error) => {
      console.error('MedicationRequest update error', error)
      const msg = error instanceof Error ? error.message : String(error)
      modal.error({ title: 'Gagal', content: msg || 'Gagal memperbarui Permintaan Obat' })
    }
  })

  const onFinish = async (values: FormData) => {
    const itemList = (itemSource?.result || []) as ItemAttributes[]
    const medicineList = itemList as Array<{ id?: number; name?: string }>

    const mapFormItemToIngredient = (it: any) => {
      let name = ''
      if (typeof it.medicationId === 'number') {
        const found = medicineList.find((m) => m.id === it.medicationId)
        if (found) name = found.name || ''
      } else if (typeof it.itemId === 'number') {
        const found = itemList.find((i) => i.id === it.itemId)
        if (found) name = found.nama || ''
      }

      const matchedOption = typeof it.itemId === 'number' ? itemOptions.find((o) => o.value === it.itemId) : undefined
      const strengthValue =
        it._manualKekuatan ??
        it._templateKekuatanNumerator ??
        (matchedOption && (matchedOption as any).kekuatan ? Number((matchedOption as any).kekuatan) : undefined)
      const requestedDose =
        typeof it.dosisDiminta === 'number' ? it.dosisDiminta : undefined
      const unitCodeFromOption =
        it.unit ??
        (matchedOption && typeof (matchedOption as any).unitCode === 'string' ? (matchedOption as any).unitCode : undefined)

      return {
        resourceType: 'Ingredient',
        medicationId: (it.medicationId as number) || undefined,
        itemId: (it.itemId as number) || undefined,
        note: it.note || '',
        instruction: it.note || '',
        name,
        quantity: typeof it.quantity === 'number' ? it.quantity : 0,
        unitCode: unitCodeFromOption || null,
        strength: typeof strengthValue === 'number' ? strengthValue : undefined,
        requestedDosage: requestedDose
      }
    }

    const baseCommonPayload = {
      status: values.status,
      intent: MedicationRequestIntent.ORDER,
      priority: values.priority,
      patientId: values.patientId,
      encounterId: values.encounterId,
      roomId: values.roomId,
      requesterId: values.requesterId,
      recorderId: values.resepturId,
      authoredOn: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    // Note: Edit mode in this form is typically for a single MedicationRequest.
    // If it was created as a batch, we are usually editing one instance from that batch.
    
    let payload: any = null

    if (values.items && values.items.length > 0) {
      // Single Item Mode
      const item = values.items[0]
      const instructionText = Array.isArray(item.dosageInstruction) ? item.dosageInstruction.join(' ') : (item.dosageInstruction ?? '')
      payload = {
        ...baseCommonPayload,
        itemId: item.medicationId,
        dosageInstruction: instructionText
          ? [buildDosageInstruction(instructionText, item.quantity, item.quantityUnit)]
          : null,
        note: item.note,
        dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit),
        supportingInformation: (() => {
          const ing = mapFormItemToIngredient(item)
          return [ing]
        })()
      }
    } else if (values.compounds && values.compounds.length > 0) {
      // Compound Mode
      const comp = values.compounds[0]
      const ingredients = (comp.items || [])
        .filter((i) => typeof i.medicationId === 'number' || typeof i.itemId === 'number')
        .map(mapFormItemToIngredient)

      const instructionText = Array.isArray(comp.dosageInstruction) ? comp.dosageInstruction.join(' ') : (comp.dosageInstruction ?? '')
      payload = {
        ...baseCommonPayload,
        medicationId: null,
        itemId: null,
        dosageInstruction: instructionText
          ? [buildDosageInstruction(instructionText, comp.quantity, comp.quantityUnit)]
          : null,
        note: `[Racikan: ${comp.name}]`,
        category: [{ text: 'racikan', code: 'compound' }],
        dispenseRequest: buildDispenseRequest(comp.quantity, comp.quantityUnit),
        supportingInformation: ingredients.length > 0 ? ingredients : null
      }
    } else if (values.otherItems && values.otherItems.length > 0) {
      // Other Item Mode
      const it = values.otherItems[0]
      const instructionText = Array.isArray(it.instruction) ? it.instruction.join(' ') : (typeof it.instruction === 'string' ? it.instruction.trim() : '')
      const noteText = typeof it.note === 'string' ? it.note.trim() : ''
      const combinedNote = [instructionText, noteText].filter((x) => x.length > 0).join(' | ')

      const matchedOption = itemOptions.find((o) => o.value === it.itemId)
      const unitCode = matchedOption?.unitCode

      payload = {
        ...baseCommonPayload,
        itemId: it.itemId,
        medicationId: null,
        note: combinedNote.length > 0 ? combinedNote : null,
        dosageInstruction: instructionText
          ? [buildDosageInstruction(instructionText, it.quantity, unitCode)]
          : null,
        dispenseRequest: typeof it.quantity === 'number' ? buildDispenseRequest(it.quantity, unitCode || undefined) : null,
        supportingInformation: (() => {
          const ing = mapFormItemToIngredient({
            itemId: it.itemId,
            quantity: it.quantity,
            unit: unitCode,
            note: combinedNote
          })
          return [ing]
        })()
      }
    }

    if (!payload) {
      message.error('Data tidak valid untuk diperbarui.')
      return
    }

    updateMutation.mutate(payload)
  }

  return {
    onFinish,
    updateLoading: updateMutation.isPending
  }
}
