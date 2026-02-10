import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useProcedureByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['procedure', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.procedure?.getByEncounter
            if (!fn || !encounterId) throw new Error('API procedure tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useBulkCreateProcedure = () => {
    return useMutation({
        mutationKey: ['procedure', 'bulk-create'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.procedure?.bulkCreate
            if (!fn) throw new Error('API procedure tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['procedure', 'by-encounter', variables.encounterId] })
        }
    })
}
