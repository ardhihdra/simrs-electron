
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useMedicationRequestByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['medication-request', 'by-encounter', encounterId],
        queryFn: async () => {
            const api = (window.api?.query as any)?.medicationRequest
            if (!api?.list || !encounterId) throw new Error('API medicationRequest tidak tersedia')
            return api.list({ encounterId, limit: 100 })
        },
        enabled: !!encounterId
    })
}

export const useCreateMedicationRequest = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['medication-request', 'create'],
        mutationFn: async (payload: any) => {
            const api = (window.api?.query as any)?.medicationRequest
            if (!api?.create) throw new Error('API medicationRequest tidak tersedia')
            return api.create(payload)
        },
        onSuccess: (_data, variables) => {
            // Invalidate the history list
            queryClient.invalidateQueries({ queryKey: ['medication-request', 'by-encounter', variables.encounterId] })
        }
    })
}
