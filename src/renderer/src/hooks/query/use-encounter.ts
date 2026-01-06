import { queryClient } from "@renderer/query-client"
import { EncounterListResult } from "@shared/encounter"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useEncounterList = () => {
    return useQuery<EncounterListResult>({
        queryKey: ['encounter', 'list'],
        queryFn: () => {
            const fn = window.api?.query?.encounter?.list
            if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
            return fn() as Promise<EncounterListResult>
        }
    })
}

export const useDeleteEncounter = () => {
    return useMutation({
        mutationKey: ['encounter', 'delete'],
        mutationFn: (id: number) => {
            const fn = window.api?.query?.encounter?.deleteById
            if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
            return fn({ id })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
        }
    })
}