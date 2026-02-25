
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useNutritionOrderByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['nutrition-order', 'by-encounter', encounterId],
        queryFn: async () => {
            const fn = window.api?.query?.nutritionOrder?.list
            if (!fn || !encounterId) throw new Error('API nutritionOrder tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useCreateNutritionOrder = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['nutrition-order', 'create'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.nutritionOrder?.create
            if (!fn) throw new Error('API nutritionOrder tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['nutrition-order', 'by-encounter', variables.encounterId] })
        }
    })
}
