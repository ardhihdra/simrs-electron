import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useCreateFollowUpSchedule = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: Parameters<Window['api']['query']['followUpSchedule']['create']>[0]) => {
            const res = await window.api.query.followUpSchedule.create(payload)
            if (!res.success) throw new Error(res.error || 'Failed to create follow up schedule')
            return res.result
        },
        onSuccess: (_, variables) => {
            if (variables?.encounterId) {
                queryClient.invalidateQueries({
                    queryKey: ['followUpSchedule', 'list', variables.encounterId]
                })
            }
        }
    })
}

export const useFollowUpScheduleByEncounter = (encounterId: string | undefined) => {
    return useQuery({
        queryKey: ['followUpSchedule', 'list', encounterId],
        queryFn: async () => {
            if (!encounterId) return []
            const res = await window.api.query.followUpSchedule.list({ encounterId })
            if (!res.success) throw new Error(res.error || 'Failed to fetch follow up schedules')
            return res.result || []
        },
        enabled: !!encounterId
    })
}

export const useDeleteFollowUpSchedule = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id }: { id: string | number }) => {
            const res = await window.api.query.followUpSchedule.remove({ id: String(id) })
            if (!res.success) throw new Error(res.error || 'Failed to delete follow up schedule')
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followUpSchedule', 'list'] })
        }
    })
}
