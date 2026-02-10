import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useServiceRequestByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['service-request', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.serviceRequest?.getByEncounter
            if (!fn || !encounterId) throw new Error('API serviceRequest tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useBulkCreateServiceRequest = () => {
    return useMutation({
        mutationKey: ['service-request', 'create'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.serviceRequest?.create
            if (!fn) throw new Error('API serviceRequest tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['service-request', 'by-encounter', variables.encounterId] })
        }
    })
}

export const useUpdateServiceRequestStatus = () => {
    return useMutation({
        mutationKey: ['service-request', 'update'],
        mutationFn: async (payload: { id: number; status: string }) => {
            const fn = window.api?.query?.serviceRequest?.update
            if (!fn) throw new Error('API serviceRequest tidak tersedia')
            return fn(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-request'] })
        }
    })
}
