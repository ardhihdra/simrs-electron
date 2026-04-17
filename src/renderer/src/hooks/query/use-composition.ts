import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

type CompositionGetByEncounterFn = NonNullable<Window['api']['query']['composition']['getByEncounter']>
type CompositionCreateFn = NonNullable<Window['api']['query']['composition']['create']>

export type CompositionGetByEncounterResult = Awaited<ReturnType<CompositionGetByEncounterFn>>
export type CompositionEncounterItem = NonNullable<
    NonNullable<CompositionGetByEncounterResult['result']>[number]
>
export type CompositionUpsertPayload = Parameters<CompositionCreateFn>[0]
export type CompositionUpsertResult = Awaited<ReturnType<CompositionCreateFn>>

export const useCompositionByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['composition', 'by-encounter', encounterId],
        queryFn: async (): Promise<CompositionGetByEncounterResult> => {
            const fn = window.api?.query?.composition?.getByEncounter
            if (!fn || !encounterId) throw new Error('API composition tidak tersedia')
            const res = await fn({ encounterId })
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal memuat data composition')
            }
            return {
                ...res,
                result: res.result ?? []
            }
        },
        enabled: !!encounterId
    })
}

export const useUpsertComposition = () => {
    return useMutation({
        mutationKey: ['composition', 'upsert'],
        mutationFn: async (payload: CompositionUpsertPayload): Promise<CompositionUpsertResult> => {
            const fn = window.api?.query?.composition?.create
            if (!fn) throw new Error('API composition tidak tersedia')
            const res = await fn(payload)
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal menyimpan composition')
            }
            return res
        },
        onSuccess: (_data, variables) => {
            if (!variables?.encounterId) return
            queryClient.invalidateQueries({
                queryKey: ['composition', 'by-encounter', variables.encounterId]
            })
        }
    })
}
