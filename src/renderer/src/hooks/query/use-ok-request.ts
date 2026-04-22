import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type OkRequestVerifyPayload = Parameters<
    NonNullable<Window['api']['query']['okRequest']['verify']>
>[0]
type OkRequestCreatePayload = Parameters<
    NonNullable<Window['api']['query']['okRequest']['create']>
>[0]
type OkRequestUploadSupportingDocumentPayload = Parameters<
    NonNullable<Window['api']['query']['okRequest']['uploadSupportingDocument']>
>[0]
type OkRequestSaveChecklistsPayload = Parameters<
    NonNullable<Window['api']['query']['okRequest']['saveChecklists']>
>[0]
type EncounterReadResult = NonNullable<
    Awaited<ReturnType<NonNullable<Window['api']['query']['encounter']['read']>>>['result']
>
export type OkRequestListItem = NonNullable<
    Awaited<ReturnType<NonNullable<Window['api']['query']['okRequest']['list']>>>['result']
>[number]

export interface OkRequestEncounterLookupData {
    byEncounterId: Record<string, { pasien: string }>
    failedIds: string[]
}

export interface OkRequestScheduleWindowInput {
    operatingRoomId: number
    scheduledStartAt: Date
    scheduledEndAt: Date
    excludeId?: number | null
}

export interface OkRequestScheduleConflictResult {
    id?: number
    kode?: string
    status: string
    operatingRoomId: number
    scheduledStartAt: Date
    scheduledEndAt: Date
}

const BLOCKING_SCHEDULE_STATUSES = new Set(['draft', 'diajukan', 'verified', 'in_progress'])

export const findOkRequestScheduleConflicts = (
    items: OkRequestListItem[],
    schedule: OkRequestScheduleWindowInput
): OkRequestScheduleConflictResult[] => {
    const targetStartAtMs = schedule.scheduledStartAt.getTime()
    const targetEndAtMs = schedule.scheduledEndAt.getTime()
    if (!Number.isFinite(targetStartAtMs) || !Number.isFinite(targetEndAtMs)) return []

    return (Array.isArray(items) ? items : []).reduce<OkRequestScheduleConflictResult[]>((acc, item) => {
            if (Number(item?.operatingRoomId) !== Number(schedule.operatingRoomId)) {
                return acc
            }

            const normalizedStatus = String(item?.status || '')
                .trim()
                .toLowerCase()
            if (!BLOCKING_SCHEDULE_STATUSES.has(normalizedStatus)) {
                return acc
            }

            if (schedule.excludeId && Number(item?.id) === Number(schedule.excludeId)) {
                return acc
            }

            const existingStartAt = new Date(String(item?.scheduledAt || ''))
            const existingStartAtMs = existingStartAt.getTime()
            if (!Number.isFinite(existingStartAtMs)) return acc

            const rawDuration = Number(item?.estimatedDurationMinutes ?? 0)
            const durationMinutes =
                Number.isFinite(rawDuration) && rawDuration >= 0 ? Math.floor(rawDuration) : 0
            const existingEndAt = new Date(existingStartAtMs + durationMinutes * 60_000)

            if (!(targetStartAtMs < existingEndAt.getTime() && targetEndAtMs > existingStartAtMs)) {
                return acc
            }

            acc.push({
                id: item?.id,
                kode: item?.kode ? String(item.kode) : undefined,
                status: String(item?.status || ''),
                operatingRoomId: Number(item?.operatingRoomId),
                scheduledStartAt: existingStartAt,
                scheduledEndAt: existingEndAt
            })

            return acc
        }, [])
}

export const useOkRequestList = (encounterId?: string) => {
    return useQuery({
        queryKey: ['ok-request', 'list', encounterId],
        queryFn: async () => {
            const fn = window.api?.query?.okRequest?.list
            if (!fn) throw new Error('API okRequest tidak tersedia')
            const res = await fn({ encounterId })
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal memuat data pengajuan OK')
            }
            return res.result ?? []
        }
    })
}

export const useOkRequestEncounterLookup = (
    encounterIds: string[],
    refetchIntervalMs?: number
) => {
    return useQuery<OkRequestEncounterLookupData>({
        queryKey: ['ok-request', 'encounter-lookup', encounterIds],
        enabled: encounterIds.length > 0,
        refetchInterval: refetchIntervalMs,
        queryFn: async () => {
            const fn = window.api?.query?.encounter?.read
            if (!fn) {
                throw new Error('API encounter tidak tersedia')
            }

            const settled = await Promise.allSettled(
                encounterIds.map(async (encounterId) => {
                    const response = await fn({ id: encounterId })
                    if (!response?.success) {
                        const responseMessage = (response as { message?: unknown } | undefined)?.message
                        throw new Error(
                            String(response?.error || responseMessage || `Gagal memuat encounter ${encounterId}`)
                        )
                    }

                    return {
                        encounterId,
                        result: (response.result || null) as EncounterReadResult | null
                    }
                })
            )

            const byEncounterId: Record<string, { pasien: string }> = {}
            const failedIds: string[] = []

            settled.forEach((entry, index) => {
                const encounterId = encounterIds[index]
                if (!encounterId) return

                if (entry.status !== 'fulfilled') {
                    failedIds.push(encounterId)
                    return
                }

                byEncounterId[encounterId] = {
                    pasien: String(entry.value.result?.patient?.name || '-').trim() || '-'
                }
            })

            return {
                byEncounterId,
                failedIds
            }
        }
    })
}

export const useCreateOkRequest = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: OkRequestCreatePayload) => {
            const fn = window.api?.query?.okRequest?.create
            if (!fn) throw new Error('API okRequest tidak tersedia')
            const res = await fn(payload)
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal membuat pengajuan OK')
            }
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ok-request'] })
        }
    })
}

export const useUploadOkSupportingDocument = () => {
    return useMutation({
        mutationFn: async (payload: OkRequestUploadSupportingDocumentPayload) => {
            const fn = window.api?.query?.okRequest?.uploadSupportingDocument
            if (!fn) throw new Error('API okRequest.uploadSupportingDocument tidak tersedia')
            const res = await fn(payload)
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal upload dokumen pendukung')
            }
            return res
        }
    })
}

export const useVerifyOkRequest = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: OkRequestVerifyPayload) => {
            const fn = window.api?.query?.okRequest?.verify
            if (!fn) throw new Error('API okRequest.verify tidak tersedia')
            const res = await fn(payload)
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal memverifikasi pengajuan OK')
            }
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ok-request'] })
        }
    })
}

export const useSaveOkRequestChecklists = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: OkRequestSaveChecklistsPayload) => {
            const fn = window.api?.query?.okRequest?.saveChecklists
            if (!fn) throw new Error('API okRequest.saveChecklists tidak tersedia')
            const res = await fn(payload)
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal menyimpan checklist pengajuan OK')
            }
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ok-request'] })
        }
    })
}
