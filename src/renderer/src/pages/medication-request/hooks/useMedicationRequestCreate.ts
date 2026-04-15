import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { App as AntdApp } from 'antd'
import dayjs from 'dayjs'
import { ItemAttributes, MedicationRequestIntent, SupportingInformationItemInfo } from 'simrs-types'
import {
  FormData,
  ItemOption
} from '../types'

export const useMedicationRequestCreate = (itemOptions: ItemOption[], itemSource: any) => {
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

  const createMutation = useMutation({
    mutationKey: ['medicationRequest', 'create'],
    mutationFn: (data: any) => {
      const fn = window.api?.query?.medicationRequest?.create
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn(data)
    },
    onSuccess: (res: any) => {
      if (!res?.success) {
        const msg = res?.error || res?.message || 'Gagal membuat Permintaan Obat'
        modal.error({ title: 'Gagal', content: msg })
        return
      }
      message.success('Permintaan Obat berhasil dibuat')
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
      navigate('/dashboard/medicine/medication-requests')
    },
    onError: (error) => {
      console.error('MedicationRequest create error', error)
      const msg = error instanceof Error ? error.message : String(error)
      modal.error({ title: 'Gagal', content: msg || 'Gagal membuat Permintaan Obat' })
    }
  })

  const onFinish = async (values: FormData) => {
    let finalPatientId = values.patientId

    if (values.patientId === 'MANUAL' && values.manualPatientName) {
      try {
        const createPatientFn = window.api?.query?.registration?.create
        if (!createPatientFn) throw new Error('API pendaftaran pasien tidak tersedia.')

        const ts = Date.now()
        const autoNik = `L${String(ts).padStart(15, '0')}`
        const autoMrn = values.manualMedicalRecordNumber || `L-${String(ts).slice(-8)}`

        const regRes = (await createPatientFn({
          name: values.manualPatientName,
          medicalRecordNumber: autoMrn,
          nik: autoNik,
          gender: 'male' as const,
          birthDate: '1900-01-01'
        }) as any)

        if (!regRes?.success) {
          throw new Error(regRes.error || 'Gagal mendaftarkan pasien luar otomatis (Response Success False).')
        }

        if (!regRes.data?.id) {
          console.error('[MR] Manual registration response data invalid:', regRes)
          throw new Error('Gagal mendaftarkan pasien luar otomatis (ID tidak ditemukan di response).')
        }

        finalPatientId = regRes.data.id
      } catch (err) {
        console.error('[MR] Manual patient registration failed:', err)
        modal.error({
          title: 'Gagal Registrasi Pasien Luar',
          content: err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftarkan pasien luar.'
        })
        return
      }
    }

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
      patientId: finalPatientId,
      encounterId: values.encounterId,
      roomId: values.roomId,
      requesterId: values.requesterId,
      recorderId: values.resepturId,
      authoredOn: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    const supportingInformationCommon: SupportingInformationItemInfo[] = []

    const items = values.items || []
    const compounds = values.compounds || []
    const otherItems = values.otherItems || []

    const invalidCompoundIndex = compounds.findIndex((compound) => {
      const compoundItems = compound.items ?? []
      return !Array.isArray(compoundItems) || compoundItems.length === 0
    })

    if (invalidCompoundIndex >= 0) {
      const nomor = invalidCompoundIndex + 1
      message.error(`Komposisi untuk Racikan ${nomor} wajib diisi minimal 1 item.`)
      return
    }

    const groupIdentifier = {
      system: 'http://sys-ids/prescription-group',
      value: `${Date.now()}`
    }

    const simplePayloads = items
      .filter((item) => typeof item.medicationId === 'number' && item.medicationId > 0)
      .map((item) => {
        const instructionText = Array.isArray(item.dosageInstruction) ? item.dosageInstruction.join(' ') : (item.dosageInstruction ?? '')
        return {
          ...baseCommonPayload,
          groupIdentifier,
          itemId: item.medicationId,
          dosageInstruction: instructionText
            ? [buildDosageInstruction(instructionText, item.quantity, item.quantityUnit)]
            : null,
          note: item.note,
          dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit),
          supportingInformation: (() => {
            const ing = mapFormItemToIngredient(item)
            return [ing, ...supportingInformationCommon]
          })()
        }
      })

    const compoundPayloads = compounds.map((comp, idx) => {
      const compoundId = `${Date.now()}-comp-${idx}`
      const compoundItems = comp.items || []

      const ingredients = compoundItems
        .filter(
          (item) => typeof item.medicationId === 'number' || typeof item.itemId === 'number'
        )
        .map(mapFormItemToIngredient)

      const instructionText = Array.isArray(comp.dosageInstruction) ? comp.dosageInstruction.join(' ') : (comp.dosageInstruction ?? '')
      return {
        ...baseCommonPayload,
        groupIdentifier,
        medicationId: null,
        itemId: null,
        dosageInstruction: instructionText
          ? [buildDosageInstruction(instructionText, comp.quantity, comp.quantityUnit)]
          : null,
        identifier: [{ system: 'racikan-group', value: compoundId }],
        note: `[Racikan: ${comp.name}]`,
        category: [{ text: 'racikan', code: 'compound' }],
        dispenseRequest: buildDispenseRequest(comp.quantity, comp.quantityUnit),
        supportingInformation: (() => {
          const merged = [...ingredients, ...supportingInformationCommon]
          return merged.length > 0 ? merged : null
        })()
      }
    })

    const itemUnitCodeMap = new Map<number, string>()
    for (const entry of itemOptions) {
      if (typeof entry.value === 'number' && entry.unitCode) {
        itemUnitCodeMap.set(entry.value, entry.unitCode)
      }
    }

    const itemPayloads = otherItems
      .filter((it) => typeof it.itemId === 'number' && it.itemId > 0)
      .map((it) => {
        const instructionText = Array.isArray(it.instruction) ? it.instruction.join(' ') : (typeof it.instruction === 'string' ? it.instruction.trim() : '')
        const noteText = typeof it.note === 'string' ? it.note.trim() : ''
        const combinedNote = [instructionText, noteText].filter((x) => x.length > 0).join(' | ')

        const unitCode = itemUnitCodeMap.get(it.itemId)

        return {
          ...baseCommonPayload,
          groupIdentifier,
          itemId: it.itemId,
          medicationId: null,
          note: combinedNote.length > 0 ? combinedNote : null,
          dosageInstruction: instructionText
            ? [buildDosageInstruction(instructionText, it.quantity, unitCode)]
            : null,
          dispenseRequest:
            typeof it.quantity === 'number'
              ? buildDispenseRequest(it.quantity, unitCode || undefined)
              : null,
          supportingInformation: (() => {
            const ing = mapFormItemToIngredient({
              itemId: it.itemId,
              quantity: it.quantity,
              unit: unitCode,
              note: combinedNote
            })
            return [ing, ...supportingInformationCommon]
          })()
        }
      })

    const payload = [...simplePayloads, ...compoundPayloads, ...itemPayloads]

    if (payload.length === 0) {
      message.error('Minimal isi minimal 1 Item.')
      return
    }

    createMutation.mutate(payload)
  }

  return {
    onFinish,
    createLoading: createMutation.isPending
  }
}
