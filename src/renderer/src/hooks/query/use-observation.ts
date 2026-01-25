import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

interface ObservationInput {
    category: string
    code: string
    display?: string
    system?: string
    valueQuantity?: any
    valueString?: string
    valueBoolean?: boolean
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
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['observation', 'list'] })
            queryClient.invalidateQueries({ queryKey: ['observation', 'by-encounter', variables.encounterId] })
            queryClient.invalidateQueries({ queryKey: ['encounter', 'detail', variables.encounterId] })
        }
    })
}

export const useObservationByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['observation', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.observation?.getByEncounter
            if (!fn || !encounterId) throw new Error('API observation tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useObservationList = (params?: ObservationListParams) => {
    return useQuery({
        queryKey: ['observation', 'list', params],
        queryFn: () => {
            const fn = window.api?.query?.observation?.list
            if (!fn) throw new Error('API observation tidak tersedia')
            return fn(params)
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
        mutationFn: (id: number) => {
            const fn = window.api?.query?.observation?.deleteById
            if (!fn) throw new Error('API observation tidak tersedia')
            return fn({ id })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['observation', 'list'] })
        }
    })
}
