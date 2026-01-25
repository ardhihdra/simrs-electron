import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useCompositionByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['composition', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.composition?.getByEncounter
            if (!fn || !encounterId) throw new Error('API composition tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useUpsertComposition = () => {
    return useMutation({
        mutationKey: ['composition', 'upsert'],
        mutationFn: async (payload: any) => {
            // Updated to call 'create'
            const fn = window.api?.query?.composition?.create
            if (!fn) throw new Error('API composition tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['composition', 'by-encounter', variables.encounterId] })
        }
    })
}
