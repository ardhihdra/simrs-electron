import z from "zod";
import { t } from "..";

export const visitManagementRpc = {
    list: t.input(z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
    })).output(z.any()).query(async ({ client }, input) => {
        const data = await client.get('/api/module/visit-management', input)
        return await data.json()
    }),
    register: t.input(z.any()).output(z.any()).mutation(async ({ client }, input) => {
        const data = await client.post('/api/module/visit-management/register', input)
        return await data.json()
    }),
    confirmAttendance: t.input(z.object({
        queueId: z.string(),
        patientId: z.string(),
    })).output(z.any()).mutation(async ({ client }, input) => {
        const { queueId, ...body } = input
        const data = await client.put(`/api/module/visit-management/queues/${queueId}/confirm`, body)
        return await data.json()
    }),
    callPatient: t.input(z.object({
        queueId: z.string(),
    })).output(z.any()).mutation(async ({ client }, input) => {
        const { queueId } = input
        const data = await client.put(`/api/module/visit-management/queues/${queueId}/call`, {})
        return await data.json()
    }),
    startEncounter: t.input(z.object({
        queueId: z.string(),
        patientId: z.string(),
        serviceUnitId: z.string(),
        serviceUnitCodeId: z.string(),
        encounterType: z.string().optional(),
        arrivalType: z.string().optional(),
    })).output(z.any()).mutation(async ({ client }, input) => {
        const { queueId, ...body } = input
        const data = await client.put(`/api/module/visit-management/queues/${queueId}/start-encounter`, body)
        return await data.json()
    }),
    getActiveQueues: t.input(z.object({
        poliCodeId: z.string().optional(),
        serviceUnitCodeId: z.string().optional(),
        assuranceCodeId: z.string().optional(),
        queueDate: z.string().optional(),
        queueNumber: z.coerce.number().optional(),
        status: z.union([z.string(), z.array(z.string())]).optional()
    })).output(z.any()).query(async ({ client }, input) => {
        const params = new URLSearchParams()
        if (input.poliCodeId) params.append('poliCodeId', input.poliCodeId)
        if (input.serviceUnitCodeId) params.append('serviceUnitCodeId', input.serviceUnitCodeId)
        if (input.assuranceCodeId) params.append('assuranceCodeId', input.assuranceCodeId)
        if (input.queueDate) params.append('queueDate', input.queueDate)
        if (input.queueNumber) params.append('queueNumber', String(input.queueNumber))
        
        if (input.status) {
            if (Array.isArray(input.status)) {
                input.status.forEach(s => params.append('status', s))
            } else {
                params.append('status', input.status)
            }
        }

        const data = await client.get(`/api/module/visit-management/queues/active?${params.toString()}`)
        return await data.json()
    }),
    
    getActiveEncounters: t.input(z.object({
        status: z.union([z.string(), z.array(z.string())]).optional(),
        serviceUnitId: z.string().optional(),
        patientName: z.string().optional()
    })).output(z.any()).query(async ({ client }, input) => {
        const params = new URLSearchParams()
        if (input.serviceUnitId) params.append('serviceUnitId', input.serviceUnitId)
        if (input.patientName) params.append('patientName', input.patientName)
        
        if (input.status) {
            if (Array.isArray(input.status)) {
                input.status.forEach(s => params.append('status', s))
            } else {
                params.append('status', input.status)
            }
        }

        const data = await client.get(`/api/module/visit-management/encounters/active?${params.toString()}`)
        return await data.json()
    }),

    dischargeEncounter: t.input(z.object({
        encounterId: z.string(),
        endTime: z.date().optional()
    })).output(z.any()).mutation(async ({ client }, input) => {
        const { encounterId, ...body } = input
        const data = await client.put(`/api/module/visit-management/encounters/${encounterId}/discharge`, body)
        return await data.json()
    }),

    dischargeMpdnEncounter: t.input(z.object({
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
    })).output(z.any()).mutation(async ({ client }, input) => {
        const { encounterId, ...body } = input
        const data = await client.put(`/api/module/visit-management/encounters/${encounterId}/discharge/mpdn`, body)
        return await data.json()
    }),

    transitionToInpatient: t.input(z.object({
        encounterId: z.string(),
        targetServiceUnitId: z.string(),
        targetServiceUnitCodeId: z.string()
    })).output(z.any()).mutation(async ({ client }, input) => {
        const { encounterId, ...body } = input
        const data = await client.post(`/api/module/visit-management/encounters/${encounterId}/transition-inpatient`, body)
        return await data.json()
    }),
}