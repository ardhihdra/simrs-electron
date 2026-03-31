import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

export interface ObservationInput {
    category: string
    code: string
    display?: string
    system?: string
    codeCoding?: Array<{ code: string; display: string; system?: string }>
    effectiveDateTime?: string
    issued?: string
    valueQuantity?: { value: number; unit: string; system?: string; code?: string }
    valueString?: string
    valueBoolean?: boolean
    valueInteger?: number
    valueDateTime?: string
    valueCodeableConcept?: { coding?: Array<{ code: string; display: string; system: string }> }
    interpretations?: Array<{ code: string; display: string; system?: string }>
    components?: Array<{
        code: string
        display: string
        system?: string
        valueQuantity?: { value: number; unit: string; system?: string; code?: string }
        valueString?: string
    }>
    referenceRange?: Array<{ low?: unknown; high?: unknown; text?: string }>
    bodySites?: Array<{
        code: string
        display?: string
        system?: string
    }>
    hasMember?: Array<{ reference: string }>
}

interface BulkCreateObservationPayload {
    encounterId: string
    patientId: string
    observations: ObservationInput[]
    performerId?: string
    performerName?: string
}

interface ObservationListParams {
    encounterId?: string
    patientId?: string
    category?: string
    status?: string
}

export const useBulkCreateObservation = () => {
    return useMutation({
        mutationKey: ['observation', 'bulk-create'],
        mutationFn: async (payload: BulkCreateObservationPayload) => {
            const fn = window.api?.query?.observation?.create
            if (!fn) throw new Error('API observation tidak tersedia')
            const result = await fn(payload)

            // Check if the backend returned an error response
            if (result && typeof result === 'object' && 'success' in result && result.success === false) {
                throw new Error(result.message || 'Gagal menyimpan observasi')
            }

            return result
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['observation', 'list'] })
            queryClient.invalidateQueries({ queryKey: ['observation', 'by-encounter', variables.encounterId] })
            queryClient.invalidateQueries({ queryKey: ['encounter', 'detail', variables.encounterId] })
        }
    })
}

export const useQueryObservationByEncounter = (encounterId?: string, additionalQueryKey?: string[]) => {
    return useQuery({
        queryKey: ['observation', 'by-encounter', encounterId, ...(additionalQueryKey || [])],
        queryFn: async () => {
            const fn = window.api?.query?.observation?.getByEncounter
            if (!fn || !encounterId) throw new Error('API observation tidak tersedia')
            const res = await fn({ encounterId })
            if (res && typeof res === 'object' && 'success' in res && res.success === false) {
                throw new Error((res as any).error || (res as any).message || 'Gagal memuat data observasi')
            }
            return res
        },
        enabled: !!encounterId
    })
}

export const useObservationList = (params?: ObservationListParams) => {
    return useQuery({
        queryKey: ['observation', 'list', params],
        queryFn: async () => {
            const fn = window.api?.query?.observation?.list
            if (!fn) throw new Error('API observation tidak tersedia')
            const res = await fn(params)
            if (res && typeof res === 'object' && 'success' in res && res.success === false) {
                throw new Error((res as any).error || (res as any).message || 'Gagal memuat data observasi')
            }
            return res
        }
    })
}

export const useCreateObservation = () => {
    return useMutation({
        mutationKey: ['observation', 'create'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.observation?.create
            if (!fn) throw new Error('API observation tidak tersedia')
            return fn(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['observation', 'list'] })
        }
    })
}

export const useUpdateObservation = () => {
    return useMutation({
        mutationKey: ['observation', 'update'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.observation?.update
            if (!fn) throw new Error('API observation tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['observation', 'list'] })
            queryClient.invalidateQueries({ queryKey: ['observation', 'detail', variables.id] })
        }
    })
}

export const useDeleteObservation = () => {
    return useMutation({
        mutationKey: ['observation', 'delete'],
        mutationFn: (id: number | string) => {
            const fn = window.api?.query?.observation?.deleteById
            if (!fn) throw new Error('API observation tidak tersedia')
            return fn({ id: id as any })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['observation', 'list'] })
            queryClient.invalidateQueries({ queryKey: ['observation', 'by-encounter'] })
        }
    })
}
