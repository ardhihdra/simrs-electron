import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface GoalTargetInput {
    measureCode?: string
    measureDisplay?: string
    measureSystem?: string
    detailQuantityValue?: number
    detailQuantityUnit?: string
    detailQuantityCode?: string
    detailQuantitySystem?: string
    detailString?: string
    dueDate?: string
}

export interface GoalCategoryInput {
    code: string
    display: string
    system: string
}

export interface CreateGoalInput {
    encounterId: string
    patientId: string
    performerId?: string
    performerName?: string
    lifecycleStatus: string
    description: string
    priority?: string
    startDate?: string
    targets?: GoalTargetInput[]
    categories?: GoalCategoryInput[]
    addresses?: { referenceType: string; referenceId: string; display?: string }[]
}

export const useGoalsByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['goal', 'by-encounter', encounterId],
        queryFn: async () => {
            const fn = window.api?.query?.goal?.getByEncounter
            if (!fn || !encounterId) throw new Error('API tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useCreateGoal = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (input: CreateGoalInput) => {
            const fn = window.api?.query?.goal?.create
            if (!fn) throw new Error('API goal tidak tersedia')
            return fn(input)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['goal', 'by-encounter', variables.encounterId] })
        }
    })
}

export const useDeleteGoal = (encounterId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const fn = window.api?.query?.goal?.deleteById
            if (!fn) throw new Error('API goal tidak tersedia')
            return fn({ id })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal', 'by-encounter', encounterId] })
        }
    })
}
