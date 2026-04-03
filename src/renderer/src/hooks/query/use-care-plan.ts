import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface CarePlanActivityInput {
    kind?: string
    code?: string
    codeDisplay?: string
    codeSystem?: string
    status: string
    description?: string
    scheduledPeriodStart?: string
    scheduledPeriodEnd?: string
    performerId?: string
    performerName?: string
}

export interface CarePlanGoalInput {
    goalId: string
    display?: string
}

export interface CreateCarePlanInput {
    [key: string]: unknown
    encounterId: string
    patientId: string
    performerId?: string
    performerName?: string
    status: string
    intent: string
    title?: string
    description?: string
    periodStart?: string
    periodEnd?: string
    activities?: CarePlanActivityInput[]
    categories?: { code?: string; display?: string; system?: string; text?: string }[]
    goals?: CarePlanGoalInput[]
}

export const useCarePlansByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['care-plan', 'by-encounter', encounterId],
        queryFn: async () => {
            const fn = window.api?.query?.carePlan?.getByEncounter
            if (!fn || !encounterId) throw new Error('API tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId,
    })
}

export const useCreateCarePlan = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (input: CreateCarePlanInput) => {
            const fn = window.api?.query?.carePlan?.create
            if (!fn) throw new Error('API carePlan tidak tersedia')
            return fn(input)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['care-plan', 'by-encounter', variables.encounterId] })
        },
    })
}

export const useDeleteCarePlan = (encounterId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const fn = window.api?.query?.carePlan?.deleteById
            if (!fn) throw new Error('API carePlan tidak tersedia')
            return fn({ id })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['care-plan', 'by-encounter', encounterId] })
        },
    })
}
