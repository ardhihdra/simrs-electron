import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useCreateProcedureDetail = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (
            payload: Window['api']['query']['procedureDetail']['create']['argsType']
        ) => {
            const res = await window.api.query.procedureDetail.create(payload)
            if (!res.success) throw new Error(res.error || 'Gagal menyimpan detail tindakan')
            return res.result
        },
        onSuccess: (_, variables) => {
            if (variables?.encounterId) {
                queryClient.invalidateQueries({
                    queryKey: ['procedureDetail', 'list', variables.encounterId]
                })
            }
        }
    })
}

export const useProcedureDetailByEncounter = (encounterId: string | undefined) => {
    return useQuery({
        queryKey: ['procedureDetail', 'list', encounterId],
        queryFn: async () => {
            if (!encounterId) return []
            const res = await window.api.query.procedureDetail.list({ encounterId })
            if (!res.success) throw new Error(res.error || 'Gagal memuat detail tindakan')
            return res.result || []
        },
        enabled: !!encounterId
    })
}

export const useDeleteProcedureDetail = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const res = await window.api.query.procedureDetail.remove({ id })
            if (!res.success) throw new Error(res.error || 'Gagal menghapus detail tindakan')
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['procedureDetail', 'list'] })
        }
    })
}
