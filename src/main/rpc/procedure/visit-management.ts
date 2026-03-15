import z from 'zod'
import { t } from '..'

export const visitManagementRpc = {
  getPatientList: t
    .input(
      z.object({
        nik: z.string().optional(),
        name: z.string().optional(),
        address: z.string().optional(),
        medicalRecordNumber: z.string().optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.nik) params.append('nik', input.nik)
      if (input.name) params.append('name', input.name)
      if (input.address) params.append('address', input.address)
      if (input.medicalRecordNumber) params.append('medicalRecordNumber', input.medicalRecordNumber)

      try {
        const data = await client.get(`/api/module/visit-management/patients?${params.toString()}`)
        return await data.json()
      } catch (error) {
        console.error(error)
        throw error
      }
    }),
  list: t
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        status: z.string().optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, input) => {
      const data = await client.get('/api/module/visit-management', input)
      return await data.json()
    }),
  getAvailableDoctors: t
    .input(
      z.object({
        date: z.string().optional(),
        poliId: z.coerce.number().optional(),
        doctorName: z.string().optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.date) params.append('date', input.date)
      if (typeof input.poliId === 'number' && !Number.isNaN(input.poliId)) {
        params.append('poliId', String(input.poliId))
      }
      if (input.doctorName) params.append('doctorName', input.doctorName)

      const query = params.toString()
      const data = await client.get(
        `/api/module/registration-v2/available-doctors${query ? `?${query}` : ''}`
      )

      return await data.json()
    }),
  getMitra: t
    .input(
      z.object({
        type: z.enum(['company', 'insurance']).optional(),
        status: z.string().optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      params.append('items', '100')
      if (input.type) params.append('type', input.type)
      if (input.status) params.append('status', input.status)

      const data = await client.get(`/api/mitra?${params.toString()}`)
      return await data.json()
    }),
  register: t
    .input(
      z.object({
        practitionerId: z.coerce.number().int().positive(),
        queueDate: z.string().min(1),
        visitDate: z.string().optional(),
        doctorScheduleId: z.coerce.number().int().positive(),
        registrationType: z.enum(['ONLINE', 'OFFLINE']),
        patientId: z.string().optional(),
        paymentMethod: z.string().optional(),
        mitraId: z.coerce.number().optional(),
        mitraCodeNumber: z.string().optional(),
        mitraCodeExpiredDate: z.string().optional(),
        mitraCode: z.string().optional(),
        mitraExpiredAt: z.string().optional(),
        reason: z.string().optional(),
        notes: z.string().optional()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const data = await client.post('/api/module/registration-v2/register', input)
      return await data.json()
    }),
  confirmAttendance: t
    .input(
      z.object({
        queueId: z.string(),
        patientId: z.string()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const { queueId, ...body } = input
      const data = await client.put(`/api/module/visit-management/queues/${queueId}/confirm`, body)
      return await data.json()
    }),
  callPatient: t
    .input(
      z.object({
        queueId: z.string()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const { queueId } = input
      const data = await client.put(`/api/module/visit-management/queues/${queueId}/call`, {})
      return await data.json()
    }),
  startEncounter: t
    .input(
      z.object({
        queueId: z.string(),
        patientId: z.string(),
        serviceUnitId: z.string(),
        serviceUnitCodeId: z.string(),
        encounterType: z.string().optional(),
        arrivalType: z.string().optional()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const { queueId, ...body } = input
      const data = await client.put(
        `/api/module/visit-management/queues/${queueId}/start-encounter`,
        body
      )
      return await data.json()
    }),
  getActiveQueues: t
    .input(
      z.object({
        poliCodeId: z.string().optional(),
        serviceUnitCodeId: z.string().optional(),
        assuranceCodeId: z.string().optional(),
        queueDate: z.string().optional(),
        queueNumber: z.coerce.number().optional(),
        status: z.union([z.string(), z.array(z.string())]).optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.poliCodeId) params.append('poliCodeId', input.poliCodeId)
      if (input.queueDate) params.append('queueDate', input.queueDate)
      if (input.queueNumber) params.append('queueNumber', String(input.queueNumber))

      // if (input.status) {
      //   if (Array.isArray(input.status)) {
      //     input.status.forEach((s) => params.append('status', s))
      //   } else {
      //     params.append('status', input.status)
      //   }
      // }

      const data = await client.get(`/api/module/registration-v2/queues?${params.toString()}`)
      return await data.json()
    }),

  getActiveEncounters: t
    .input(
      z.object({
        status: z.union([z.string(), z.array(z.string())]).optional(),
        serviceUnitId: z.string().optional(),
        patientName: z.string().optional()
      })
    )
    .output(z.any())
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.serviceUnitId) params.append('serviceUnitId', input.serviceUnitId)
      if (input.patientName) params.append('patientName', input.patientName)

      if (input.status) {
        if (Array.isArray(input.status)) {
          input.status.forEach((s) => params.append('status', s))
        } else {
          params.append('status', input.status)
        }
      }

      const data = await client.get(
        `/api/module/visit-management/encounters/active?${params.toString()}`
      )
      return await data.json()
    }),

  dischargeEncounter: t
    .input(
      z.object({
        encounterId: z.string(),
        endTime: z.date().optional()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const { encounterId, ...body } = input
      const data = await client.put(
        `/api/module/visit-management/encounters/${encounterId}/discharge`,
        body
      )
      return await data.json()
    }),

  dischargeMpdnEncounter: t
    .input(
      z.object({
        encounterId: z.string(),
        endTime: z.date().optional(),
        timeOfDeath: z.date().optional(),
        maternalPeriod: z.string().optional(),
        maternalCauseId: z.string().optional(),
        perinatalCauseId: z.string().optional(),
        fetalDeathType: z.string().optional(),
        pregnancyType: z.string().optional(),
        fetalOrder: z.string().optional(),
        locationType: z.string().optional(),
        organizationType: z.string().optional(),
        description: z.string().optional()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const { encounterId, ...body } = input
      const data = await client.put(
        `/api/module/visit-management/encounters/${encounterId}/discharge/mpdn`,
        body
      )
      return await data.json()
    }),

  transitionToInpatient: t
    .input(
      z.object({
        encounterId: z.string(),
        targetServiceUnitId: z.string(),
        targetServiceUnitCodeId: z.string()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      const { encounterId, ...body } = input
      const data = await client.post(
        `/api/module/visit-management/encounters/${encounterId}/transition-inpatient`,
        body
      )
      return await data.json()
    }),

  patientSync: t
    .input(
      z.object({
        patientId: z.string()
      })
    )
    .output(z.any())
    .mutation(async ({ client }, input) => {
      try {
        const { patientId } = input
        const response = await client.post(
          `/api/module/visit-management/patient/${patientId}/sync`,
          {}
        )
        return await response.json()
      } catch (error: any) {
        throw new Error(error.message || 'Failed to synchronize patient data')
      }
    })
}
