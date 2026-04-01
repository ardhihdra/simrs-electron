import z from 'zod'
import { MedicationDispenseWithIdSchema } from '@main/models/medicationDispense'
import { MedicationRequestWithIdSchema } from '@main/models/medicationRequest'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'
import { MedicationDispenseStatusSchema, MedicationDispenseStatus } from 'simrs-types'

interface QuantityInfo {
  value?: number
  unit?: string
}

interface DispenseRequestInfo {
  quantity?: QuantityInfo
}

export const requireSession = true

export const schemas = {
  list: {
    args: z
      .object({
        patientId: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      data: MedicationDispenseWithIdSchema.array().optional(),
      pagination: z
        .object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          pages: z.number()
        })
        .optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: MedicationDispenseWithIdSchema.partial().extend({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: z
        .union([
          MedicationDispenseWithIdSchema,
          z.object({
            id: z.number().optional(),
            status: MedicationDispenseStatusSchema.optional()
          })
        ])
        .optional(),
      error: z.string().optional(),
      message: z.string().optional()
    })
  },
  createFromRequest: {
    args: z.object({
      medicationRequestId: z.number(),
      quantity: z
        .object({
          value: z.number().optional(),
          unit: z.string().optional()
        })
        .optional(),
      selectedBatches: z.any().optional(),
      telaahResults: z.any().optional()
    }),
    result: z.object({
      success: z.boolean(),
      data: z
        .union([
          MedicationDispenseWithIdSchema,
          z.object({
            id: z.number(),
            status: MedicationDispenseStatusSchema.optional()
          })
        ])
        .optional(),
      error: z.string().optional(),
      message: z.string().optional()
    })
  },
  syncSatusehat: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      error: z.string().optional(),
      message: z.string().optional()
    })
  },
  createModule: {
    args: z.object({
      patientId: z.string(),
      itemId: z.number().nullable().optional(),
      status: MedicationDispenseStatusSchema,
      authorizingPrescriptionId: z.number().nullable().optional(),
      encounterId: z.string().nullable().optional(),
      quantity: z.object({ value: z.number().optional(), unit: z.string().optional() }).nullable().optional(),
      whenPrepared: z.string().or(z.date()).nullable().optional(),
      whenHandedOver: z.string().or(z.date()).nullable().optional(),
      dosageInstruction: z.array(z.object({ text: z.string().optional() }).passthrough()).nullable().optional(),
      category: z.array(z.object({ text: z.string().optional(), code: z.string().optional() }).passthrough()).nullable().optional(),
      note: z.string().nullable().optional(),
      performerId: z.number().nullable().optional()
    }),
    result: z.object({
      success: z.boolean(),
      result: z.object({ id: z.number(), status: MedicationDispenseStatusSchema }).optional(),
      error: z.string().optional(),
      message: z.string().optional()
    })
  }
} as const

export const moduleSchemas = {
  list: {
    args: z
      .object({
        patientId: z.string().optional(),
        page: z.number().optional(),
        items: z.number().optional(),
        authorizingPrescriptionId: z.string().optional(),
        sortBy: z.union([z.string(), z.array(z.string())]).optional(),
        sortOrder: z.string().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      data: MedicationDispenseWithIdSchema.array().optional(),
      pagination: z
        .object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          pages: z.number()
        })
        .optional(),
      error: z.string().optional()
    })
  },
  read: {
    args: z.object({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      result: MedicationDispenseWithIdSchema.optional(),
      error: z.string().optional(),
      message: z.string().optional()
    })
  },
  update: {
    args: MedicationDispenseWithIdSchema.partial().extend({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      result: z
        .object({
          id: z.number().optional(),
          status: MedicationDispenseStatusSchema.optional()
        })
        .optional(),
      error: z.string().optional(),
      message: z.string().optional()
    })
  },
  create: {
    args: z.object({
      patientId: z.string(),
      itemId: z.number().nullable().optional(),
      status: MedicationDispenseStatusSchema,
      authorizingPrescriptionId: z.number().nullable().optional(),
      encounterId: z.string().nullable().optional(),
      quantity: z
        .object({
          value: z.number().optional(),
          unit: z.string().optional()
        })
        .nullable()
        .optional(),
      whenPrepared: z.string().or(z.date()).nullable().optional(),
      whenHandedOver: z.string().or(z.date()).nullable().optional(),
      dosageInstruction: z
        .array(
          z.object({
            text: z.string().optional()
          }).passthrough()
        )
        .nullable()
        .optional(),
      category: z.array(
        z.object({
          text: z.string().optional(),
          code: z.string().optional()
        }).passthrough()
      ).nullable().optional(),
      note: z.string().nullable().optional(),
      performerId: z.number().nullable().optional()
    }),
    result: z.object({
      success: z.boolean(),
      result: z
        .object({
          id: z.number(),
          status: MedicationDispenseStatusSchema
        })
        .optional(),
      error: z.string().optional(),
      message: z.string().optional()
    })
  }
} as const

const FhirReferenceSchema = z.object({
  reference: z.string().optional()
})

const FhirMedicationDispenseSchema = z.object({
  id: z.number().optional(),
  fhirId: z.string().nullable().optional(),
  resourceType: z.string().optional(),
  status: z.string(),
  subject: FhirReferenceSchema.optional(),
  context: FhirReferenceSchema.optional(),
  authorizingPrescription: z.union([
    z.array(FhirReferenceSchema),
    z.any() // Mentoleransi object dari Sequelize include
  ]).optional(),
  quantity: z
    .object({
      value: z.number().optional(),
      unit: z.string().optional()
    })
    .optional(),
  whenPrepared: z.string().nullable().optional(),
  whenHandedOver: z.string().nullable().optional(),
  performer: z.union([
    z.array(
      z.object({
        actor: FhirReferenceSchema.optional()
      })
    ),
    z.any() // Mentoleransi object dari Sequelize include
  ]).optional(),
  medicationReference: FhirReferenceSchema.optional(),
  medicationCodeableConcept: z
    .object({
      text: z.string().optional()
    })
    .optional(),
  encounter: z.any().optional()
})

const toUiDispense = (fhir: z.infer<typeof FhirMedicationDispenseSchema>) => {
  const getIdFromRef = (ref?: string, prefix?: string): string | undefined => {
    if (!ref || !prefix) return undefined
    const idx = ref.indexOf(`${prefix}/`)
    if (idx === -1) return undefined
    return ref.slice(idx + prefix.length + 1)
  }
  const patientId = getIdFromRef(fhir.subject?.reference, 'Patient')
  const encounterId = getIdFromRef(fhir.context?.reference, 'Encounter')
  const authRef = Array.isArray(fhir.authorizingPrescription) && fhir.authorizingPrescription[0]?.reference
    ? fhir.authorizingPrescription[0]?.reference
    : undefined
  const authorizingPrescriptionIdStr = getIdFromRef(authRef, 'MedicationRequest')

  let authorizingPrescriptionId: number | undefined = undefined
  let authorizingPrescriptionObj: z.infer<typeof MedicationRequestWithIdSchema> | undefined = undefined

  if (authorizingPrescriptionIdStr && /^\d+$/.test(authorizingPrescriptionIdStr)) {
    authorizingPrescriptionId = Number(authorizingPrescriptionIdStr)
  } else if (fhir.authorizingPrescription && typeof fhir.authorizingPrescription === 'object' && 'id' in fhir.authorizingPrescription) {
    authorizingPrescriptionId = fhir.authorizingPrescription.id as number
    authorizingPrescriptionObj = fhir.authorizingPrescription
  }

  const itemRefIdStr = getIdFromRef(fhir.medicationReference?.reference, 'Medication')
  const itemId =
    itemRefIdStr && /^\d+$/.test(itemRefIdStr) ? Number(itemRefIdStr) : undefined

  // Tangkap fields tambahan yang dikirim backend (fhirId, dosageInstruction, dsb)
  const rawFhir = fhir as Record<string, any>

  const ui: z.infer<typeof MedicationDispenseWithIdSchema> = {
    id: typeof fhir.id === 'number' ? fhir.id : 0,
    fhirId: typeof rawFhir.fhirId === 'string' ? rawFhir.fhirId : null,
    status: fhir.status as unknown as z.infer<typeof MedicationDispenseWithIdSchema>['status'],
    itemId: typeof rawFhir.itemId === 'number' ? rawFhir.itemId : (typeof itemId === 'number' ? itemId : null),
    patientId: (patientId ?? rawFhir.patientId ?? '') as string,
    encounterId: (encounterId ?? rawFhir.encounterId ?? null) as string | null,
    authorizingPrescriptionId:
      typeof authorizingPrescriptionId === 'number' ? authorizingPrescriptionId : null,
    quantity: fhir.quantity ?? null,
    whenPrepared: fhir.whenPrepared ?? null,
    whenHandedOver: fhir.whenHandedOver ?? null,
    performerId: typeof rawFhir.performerId === 'number' ? rawFhir.performerId : null,
    dosageInstruction: rawFhir.dosageInstruction ?? null,
    createdAt: undefined,
    updatedAt: undefined,
    patient: undefined,
    performer: rawFhir.performer ?? undefined,
    medication: rawFhir.medication ?? undefined,
    authorizingPrescription: authorizingPrescriptionObj ?? null,
    encounter: rawFhir.encounter ?? undefined
  }
  return ui
}

const ModuleListCompatSchema: z.ZodSchema<{
  success: boolean
  result?: z.infer<typeof MedicationDispenseWithIdSchema>[]
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}> = z
  .object({
    success: z.boolean(),
    result: FhirMedicationDispenseSchema.array().optional(),
    data: FhirMedicationDispenseSchema.array().optional(),
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        pages: z.number(),
        count: z.number().optional(),
        total: z.number().optional()
      })
      .optional(),
    message: z.string().optional(),
    error: z.string().optional()
  })
  .transform((val) => ({
    success: val.success,
    result: (val.result ?? val.data)?.map(toUiDispense),
    pagination: val.pagination
      ? {
        page: val.pagination.page,
        limit: val.pagination.limit,
        pages: val.pagination.pages,
        total:
          typeof val.pagination.total === 'number'
            ? val.pagination.total
            : typeof val.pagination.count === 'number'
              ? val.pagination.count
              : 0
      }
      : undefined,
    message: val.message,
    error: val.error
  }))


type ListArgs = z.infer<typeof schemas.list.args>

export const list = async (ctx: IpcContext, args?: ListArgs) => {
  try {
    const client = getClient(ctx)
    const params = new URLSearchParams()

    if (args?.patientId) params.append('patientId', args.patientId)
    if (args?.page) params.append('page', String(args.page))
    if (args?.limit) params.append('items', String(args.limit))

    const queryString = params.toString()
    const url =
      queryString.length > 0
        ? `/api/module/medication-dispense/medication-dispenses?${queryString}`
        : '/api/module/medication-dispense/medication-dispenses'

    const res = await client.get(url)
    const ListSchema = ModuleListCompatSchema
    const base = (await parseBackendResponse(res, ListSchema)) ?? []

    // Enrichment: fetch patient and prescription details to support UI needs (racikan & patient label)
    const uniquePatientIds = Array.from(
      new Set(
        base
          .map((i) => i.patientId)
          .filter((pid): pid is string => typeof pid === 'string' && pid.trim().length > 0)
      )
    )
    const uniquePrescriptionIds = Array.from(
      new Set(
        base
          .map((i) => i.authorizingPrescriptionId)
          .filter((rid): rid is number => typeof rid === 'number' && Number.isFinite(rid))
      )
    )
    const uniqueItemIds = Array.from(
      new Set(
        base
          .map((i) => i.itemId)
          .filter((iid): iid is number => typeof iid === 'number' && Number.isFinite(iid))
      )
    )

    const PatientReadSchema = z.object({
      success: z.boolean(),
      result: z
        .object({
          id: z.union([z.string(), z.number()]).optional(),
          kode: z.string().optional(),
          name: z.union([
            z.string(),
            z.array(
              z.object({
                text: z.string().optional(),
                given: z.array(z.string()).optional(),
                family: z.string().optional()
              })
            )
          ]).optional(),
          identifier: z
            .union([
              z.string(),
              z.array(
                z.object({
                  system: z.string().optional(),
                  value: z.string().optional()
                })
              )
            ])
            .optional()
        })
        .optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })

    const PrescriptionReadSchema = z.object({
      success: z.boolean(),
      result: MedicationRequestWithIdSchema.optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })

    const [patientMap, prescriptionMap] = await Promise.all([
      (async () => {
        const map = new Map<string, z.infer<typeof MedicationDispenseWithIdSchema>['patient']>()
        await Promise.all(
          uniquePatientIds.map(async (pid) => {
            try {
              const r = await client.get(`/api/patient/read/${pid}`)
              const p = await parseBackendResponse(r, PatientReadSchema)
              if (p) {
                const name =
                  typeof p.name === 'string' || Array.isArray(p.name) ? p.name : undefined
                const identifiers =
                  typeof p.identifier === 'string'
                    ? [{ system: 'local-mrn', value: p.identifier }]
                    : Array.isArray(p.identifier)
                      ? p.identifier
                      : undefined
                map.set(pid, {
                  name,
                  identifier: identifiers,
                  mrNo: p.kode
                })
              }
            } catch {
              // ignore enrichment errors per patient
            }
          })
        )
        return map
      })(),
      (async () => {
        const map = new Map<number, z.infer<typeof MedicationRequestWithIdSchema>>()
        await Promise.all(
          uniquePrescriptionIds.map(async (rid) => {
            try {
              const r = await client.get(
                `/api/module/medication-request/medication-requests/${rid}`
              )
              const pr = await parseBackendResponse(r, PrescriptionReadSchema)
              if (pr) {
                map.set(rid, pr)
              }
            } catch {
              // ignore enrichment errors per prescription
            }
          })
        )
        return map
      })()
    ])

    const ItemDomainSchema = z.object({
      id: z.number(),
      nama: z.string().optional(),
      itemCategoryId: z.number().nullable().optional(),
      category: z
        .object({
          id: z.number().optional(),
          name: z.string().nullable().optional()
        })
        .nullable()
        .optional()
    })
    const ItemReadSchema = z.object({
      success: z.boolean(),
      result: z
        .object({
          item: ItemDomainSchema.optional()
        })
        .optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })

    const itemMap = new Map<number, z.infer<typeof ItemDomainSchema>>()
    await Promise.all(
      uniqueItemIds.map(async (iid) => {
        try {
          const r = await client.get(`/api/module/item/items/${iid}`)
          const data = await parseBackendResponse(r, ItemReadSchema)
          const itemDetail = data?.item
          if (itemDetail) {
            itemMap.set(iid, itemDetail)
          }
        } catch {
          // ignore item enrichment errors
        }
      })
    )

    const result = base.map((item) => {
      const enrichedPatient =
        typeof item.patientId === 'string' ? patientMap.get(item.patientId) : undefined
      const enrichedRx =
        typeof item.authorizingPrescriptionId === 'number'
          ? prescriptionMap.get(item.authorizingPrescriptionId)
          : undefined
      const itemDetail =
        typeof item.itemId === 'number' ? itemMap.get(item.itemId) : undefined
      const mergedRx =
        enrichedRx && !enrichedRx.item && itemDetail
          ? { ...enrichedRx, item: itemDetail }
          : enrichedRx
      const medicationEntry = item.medication ?? (itemDetail ? { id: itemDetail.id, name: itemDetail.nama, uom: undefined, stock: undefined } : undefined)

      return Object.assign({}, item, {
        patient: enrichedPatient ?? item.patient,
        authorizingPrescription: mergedRx ?? item.authorizingPrescription,
        medication: medicationEntry
      })
    })

    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('MedicationDispense IPC list error:', msg)
    return { success: false, error: msg }
  }
}

export const update = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.update.args>
) => {
  try {
    const client = getClient(ctx)
    const { id, ...data } = args
    const res = await client.put(
      `/api/module/medication-dispense/medication-dispenses/${id}`,
      data
    )
    const UpdateSchema = moduleSchemas.update.result
    const result = await parseBackendResponse(res, UpdateSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const createFromRequest = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.createFromRequest.args>
) => {
  try {
    const client = getClient(ctx)

    const requestRes = await client.get(`/api/module/medication-request/medication-requests/${args.medicationRequestId}`)
    const ReadSchema = z.object({
      success: z.boolean(),
      result: MedicationRequestWithIdSchema.optional(),
      error: z.string().optional(),
      message: z.string().optional()
    })
    const request = await parseBackendResponse(requestRes, ReadSchema)

    if (!request) {
      throw new Error('MedicationRequest tidak ditemukan.')
    }

    const hasItemId = typeof request.itemId === 'number'
    const hasPatientId = typeof request.patientId === 'string'

    if (!hasPatientId) {
      throw new Error('MedicationRequest tidak memiliki patientId yang valid.')
    }

    // Check for compound (racikan)
    const supportingInfo = request.supportingInformation
    const isCompound =
      !hasItemId &&
      Array.isArray(supportingInfo) &&
      supportingInfo.length > 0

    const rawDispense = request.dispenseRequest

    let quantity: QuantityInfo | undefined

    if (args.quantity && typeof args.quantity.value === 'number') {
      quantity = {
        value: args.quantity.value,
        unit: args.quantity.unit
      }
    } else if (rawDispense && typeof rawDispense === 'object') {
      const maybe = rawDispense as DispenseRequestInfo
      const rawQuantity = maybe.quantity
      if (rawQuantity && typeof rawQuantity.value === 'number') {
        quantity = {
          value: rawQuantity.value,
          unit: typeof rawQuantity.unit === 'string' ? rawQuantity.unit : undefined
        }
      }
    }

    if (isCompound) {
      const value = quantity?.value
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Qty Diambil harus lebih dari 0')
      }

      const encounterId =
        typeof request.encounterId === 'string' ? request.encounterId : null

      const payload = {
        patientId: request.patientId,
        authorizingPrescriptionId: request.id as number,
        status: MedicationDispenseStatus.IN_PROGRESS,
        quantity: {
          value,
          unit: quantity?.unit
        },
        encounterId,
        dosageInstruction: Array.isArray(request.dosageInstruction) ? request.dosageInstruction : null,
        category: Array.isArray(request.category) ? request.category : null,
        selectedBatches: args.selectedBatches,
        // note di MR adalah string, convert ke FHIR Annotation[] agar tersimpan di MD
        note: (() => {
          const notes: any[] = []
          if (typeof request.note === 'string' && request.note.trim().length > 0) {
            notes.push({ text: request.note.trim() })
          }
          if (args.telaahResults) {
            notes.push({ text: `Telaah Administrasi: ${JSON.stringify(args.telaahResults)}` })
          }
          return notes.length > 0 ? notes : null
        })()
      }

      const createRes = await client.post(
        '/api/module/medication-dispense/medication-dispenses',
        payload
      )
      const CreateSchema = moduleSchemas.create.result
      const created = await parseBackendResponse(createRes, CreateSchema)
      try {
        const createdId = typeof created?.id === 'number' ? created.id : 0
        if (createdId > 0) {
          const syncRes = await client.post(
            `/api/module/medication-dispense/medication-dispenses/${createdId}/sync-satusehat`,
            {}
          )
          if (!syncRes.ok) {
            let detail = ''
            try {
              const ct = syncRes.headers.get('content-type') ?? ''
              if (ct.includes('application/json')) {
                const json = (await syncRes.json()) as { message?: string }
                detail = typeof json.message === 'string' ? json.message : ''
              } else {
                detail = await syncRes.text()
              }
              // FIX ME: what for?
            } catch { }
            console.warn('[medication-dispense.sync] failed', createdId, syncRes.status, detail)
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[medication-dispense.sync] exception', msg)
      }
      return { success: true, data: created }
    }



    if (hasItemId) {
      const value = quantity?.value
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Qty Diambil harus lebih dari 0')
      }

      const unit = quantity?.unit

      const encounterId =
        typeof request.encounterId === 'string' ? request.encounterId : null

      const payload = {
        itemId: request.itemId as number,
        patientId: request.patientId,
        authorizingPrescriptionId: request.id,
        status: MedicationDispenseStatus.IN_PROGRESS,
        quantity: {
          value,
          unit
        },
        encounterId,
        dosageInstruction: Array.isArray(request.dosageInstruction) ? request.dosageInstruction : null,
        category: Array.isArray(request.category) ? request.category : null,
        selectedBatches: args.selectedBatches,
        // note di MR adalah string, convert ke FHIR Annotation[] agar tersimpan di MD
        note: (() => {
          const notes: any[] = []
          if (typeof request.note === 'string' && request.note.trim().length > 0) {
            notes.push({ text: request.note.trim() })
          }
          if (args.telaahResults) {
            notes.push({ text: `Telaah Administrasi: ${JSON.stringify(args.telaahResults)}` })
          }
          return notes.length > 0 ? notes : null
        })()
      }

      const createRes = await client.post(
        '/api/module/medication-dispense/medication-dispenses',
        payload
      )
      const CreateSchema = moduleSchemas.create.result
      const created = await parseBackendResponse(createRes, CreateSchema)
      try {
        const createdId = typeof created?.id === 'number' ? created.id : 0
        if (createdId > 0) {
          const syncRes = await client.post(
            `/api/module/medication-dispense/medication-dispenses/${createdId}/sync-satusehat`,
            {}
          )
          if (!syncRes.ok) {
            let detail = ''
            try {
              const ct = syncRes.headers.get('content-type') ?? ''
              if (ct.includes('application/json')) {
                const json = (await syncRes.json()) as { message?: string }
                detail = typeof json.message === 'string' ? json.message : ''
              } else {
                detail = await syncRes.text()
              }
            } catch { }
            console.warn('[medication-dispense.sync] failed', createdId, syncRes.status, detail)
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[medication-dispense.sync] exception', msg)
      }
      return { success: true, data: created }
    }
    throw new Error(
      'MedicationRequest ini tidak berisi obat atau item yang dapat diproses untuk dispense.'
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const listModule = async (
  ctx: IpcContext,
  args?: z.infer<typeof moduleSchemas.list.args>
) => {
  try {
    const client = getClient(ctx)
    const params = new URLSearchParams()
    if (args?.patientId) params.append('patientId', args.patientId)
    if (args?.authorizingPrescriptionId)
      params.append('authorizingPrescriptionId', args.authorizingPrescriptionId)
    if (args?.page) params.append('page', String(args.page))
    if (args?.items) params.append('items', String(args.items))
    if (typeof args?.sortBy === 'string') params.append('sortBy', args.sortBy)
    if (Array.isArray(args?.sortBy)) params.append('sortBy', args!.sortBy.join(','))
    if (args?.sortOrder) params.append('sortOrder', args.sortOrder)
    const queryString = params.toString()
    const url =
      queryString.length > 0
        ? `/api/module/medication-dispense/medication-dispenses?${queryString}`
        : `/api/module/medication-dispense/medication-dispenses`
    const res = await client.get(url)
    const ListSchema = BackendListSchema(MedicationDispenseWithIdSchema)
    const result = await parseBackendResponse(res, ListSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const readModule = async (
  ctx: IpcContext,
  args: z.infer<typeof moduleSchemas.read.args>
) => {
  try {
    const client = getClient(ctx)
    const res = await client.get(
      `/api/module/medication-dispense/medication-dispenses/${args.id}`
    )
    const ReadSchema = moduleSchemas.read.result
    const result = await parseBackendResponse(res, ReadSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const updateModule = async (
  ctx: IpcContext,
  args: z.infer<typeof moduleSchemas.update.args>
) => {
  try {
    const client = getClient(ctx)
    const { id, ...data } = args
    const res = await client.put(
      `/api/module/medication-dispense/medication-dispenses/${id}`,
      data
    )
    const UpdateSchema = moduleSchemas.update.result
    const result = await parseBackendResponse(res, UpdateSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const createModule = async (
  ctx: IpcContext,
  args: z.infer<typeof moduleSchemas.create.args>
) => {
  try {
    const client = getClient(ctx)
    const res = await client.post(
      `/api/module/medication-dispense/medication-dispenses`,
      args
    )
    const CreateSchema = moduleSchemas.create.result
    const result = await parseBackendResponse(res, CreateSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export const syncSatusehat = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.syncSatusehat.args>
) => {
  try {
    const client = getClient(ctx)
    const syncRes = await client.post(
      `/api/module/medication-dispense/medication-dispenses/${args.id}/sync-satusehat`,
      {}
    )
    if (!syncRes.ok) {
      let detail = ''
      try {
        const ct = syncRes.headers.get('content-type') ?? ''
        if (ct.includes('application/json')) {
          const json = (await syncRes.json()) as { message?: string }
          detail = typeof json.message === 'string' ? json.message : ''
        } else {
          detail = await syncRes.text()
        }
      } catch { }
      return { success: false, error: detail || `Gagal sinkron SatuSehat (${syncRes.status})` }
    }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
