import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useClinicalNoteByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['clinical-note', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.clinicalNote?.getByEncounter
            if (!fn || !encounterId) throw new Error('API clinicalNote tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useUpsertClinicalNote = () => {
    return useMutation({
        mutationKey: ['clinical-note', 'upsert'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.clinicalNote?.create
            if (!fn) throw new Error('API clinicalNote tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clinical-note', 'by-encounter', variables.encounterId] })
        }
    })
}
