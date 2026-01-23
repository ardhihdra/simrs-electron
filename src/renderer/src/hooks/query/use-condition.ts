import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useConditionByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['condition', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.condition?.getByEncounter
            if (!fn || !encounterId) throw new Error('API condition tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useBulkCreateCondition = () => {
    return useMutation({
        mutationKey: ['condition', 'bulk-create'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.condition?.bulkCreate
            if (!fn) throw new Error('API condition tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['condition', 'by-encounter', variables.encounterId] })
        }
    })
}
