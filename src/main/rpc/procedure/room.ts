import {
  ApiResponseSchema,
  BedStatusDomainSchema,
  RoomSchema,
  RoomTransferInputSchema,
  RoomAvailableInputSchema
} from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

// --- Schemas are now in simrs-types ---
export type RoomTransferInput = z.infer<typeof RoomTransferInputSchema>
export type RoomAvailableInput = z.infer<typeof RoomAvailableInputSchema>

const RoomAssignInputSchema = z.object({
  encounterId: z.string().min(1),
  roomCodeId: z.string().min(1),
  bedCodeId: z.string().min(1),
  classOfCareCodeId: z.string().min(1),
  assignedBy: z.string().optional(),
  reason: z.string().optional()
})

const RoomReleaseInputSchema = z.object({
  accommodationAssignmentId: z.string().min(1),
  releasedBy: z.string().optional()
})

const CreateBedInputSchema = z.object({
  bedCodeId: z.string().min(1),
  roomId: z.string().min(1)
})

const InpatientBedMapVitalSignsSchema = z.object({
  systolicBp: z.string().nullable(),
  diastolicBp: z.string().nullable(),
  heartRate: z.string().nullable(),
  respiratoryRate: z.string().nullable(),
  temperature: z.string().nullable(),
  oxygenSaturation: z.string().nullable()
})

const InpatientBedMapPatientSchema = z.object({
  encounterId: z.string(),
  patientId: z.string(),
  medicalRecordNumber: z.string().nullable(),
  patientName: z.string(),
  gender: z.string().nullable(),
  ageLabel: z.string().nullable(),
  dpjpName: z.string().nullable(),
  diagnosisSummary: z.string().nullable(),
  admissionDateTime: z.string().nullable(),
  lengthOfStayLabel: z.string().nullable(),
  paymentLabel: z.string().nullable(),
  vitalSigns: InpatientBedMapVitalSignsSchema
})

const InpatientBedMapBedSchema = z.object({
  bedId: z.string(),
  bedName: z.string(),
  status: z.string(),
  roomId: z.string(),
  roomName: z.string(),
  patient: InpatientBedMapPatientSchema.nullable()
})

const InpatientBedMapWardSchema = z.object({
  roomId: z.string(),
  roomName: z.string(),
  floor: z.string().nullable(),
  classLabel: z.string().nullable(),
  capacity: z.number().nullable(),
  occupancy: z.object({
    occupied: z.number(),
    total: z.number(),
    percentage: z.number()
  }),
  beds: z.array(InpatientBedMapBedSchema)
})

const InpatientBedMapResultSchema = z.object({
  generatedAt: z.string(),
  summary: z.object({
    totalRooms: z.number(),
    totalBeds: z.number(),
    occupiedBeds: z.number(),
    availableBeds: z.number(),
    cleaningBeds: z.number()
  }),
  wards: z.array(InpatientBedMapWardSchema)
})

export function normalizeRoomBedMapResponse(payload: unknown) {
  if (payload && typeof payload === 'object' && 'result' in payload) {
    const responsePayload = payload as { result: unknown }
    return InpatientBedMapResultSchema.parse(responsePayload.result)
  }

  throw new Error('Invalid room bed map response')
}

export const roomRpc = {
  assign: t
    .input(RoomAssignInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/assign', input)
      return await data.json()
    }),

  release: t
    .input(RoomReleaseInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/release', input)
      return await data.json()
    }),

  // transfer: POST /module/room/transfer
  transfer: t
    .input(RoomTransferInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/transfer', input)
      return await data.json()
    }),

  // available: GET /module/room/available
  available: t
    .input(RoomAvailableInputSchema)
    .output(ApiResponseSchema(BedStatusDomainSchema.array().optional()))
    .query(async ({ client }) => {
      const data = await client.get('/api/module/room/available/listAll')
      const res = await data.json()
      return res
    }),

  rooms: t
    .input(z.object({}).default({}))
    .output(ApiResponseSchema(RoomSchema.array().optional()))
    .query(async ({ client }) => {
      const data = await client.get('/api/module/room/rooms/listAll')
      return await data.json()
    }),

  bedMap: t
    .input(z.object({}).default({}))
    .output(InpatientBedMapResultSchema)
    .query(async ({ client }) => {
      const data = await client.get('/api/module/room/inpatient-bed-map')
      const payload = await data.json()
      return normalizeRoomBedMapResponse(payload)
    }),

  createBed: t
    .input(CreateBedInputSchema)
    .output(ApiResponseSchema(z.any()))
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/room/beds', input)
      return await data.json()
    })
}
