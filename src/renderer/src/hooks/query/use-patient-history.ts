import { useQuery } from '@tanstack/react-query'

export const usePatientHistorySummary = (patientId: string) => {
    return useQuery({
        queryKey: ['patient-history-summary', patientId],
        queryFn: async () => {
            if (!patientId) {
                throw new Error('Patient ID is required')
            }
            const fn = window.api?.query?.encounter?.getHistorySummary
            if (!fn) throw new Error('API encounter tidak tersedia')

            return fn({ patientId })
        },
        enabled: !!patientId,
        staleTime: 5 * 60 * 1000,
    })
}

interface EncountersQueryParams {
    patientId: string
    page?: number
    pageSize?: number
    type?: string
    doctorId?: string
    practitionerId?: string
    dateFrom?: string
    dateTo?: string
}

export const usePatientEncountersPg = (params: EncountersQueryParams) => {
    return useQuery({
        queryKey: ['patient-encounters-pg', params],
        queryFn: async () => {
            if (!params.patientId) {
                throw new Error('Patient ID is required')
            }

            const fn = window.api?.query?.encounter?.getPatientEncountersPg
            if (!fn) throw new Error('API encounter tidak tersedia')

            const payload = {
                patientId: params.patientId,
                page: params.page?.toString(),
                pageSize: params.pageSize?.toString(),
                type: params.type,
                doctorId: params.doctorId,
                practitionerId: params.practitionerId,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
            }

            return fn(payload)
        },
        enabled: !!params.patientId,
        staleTime: 1 * 60 * 1000,
    })
}
