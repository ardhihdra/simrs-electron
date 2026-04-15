import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type OkRequestVerifyPayload = Parameters<
    NonNullable<Window['api']['query']['okRequest']['verify']>
>[0]

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

export const useCreateOkRequest = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
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
        mutationFn: async (payload: {
            file: ArrayBuffer | Uint8Array
            filename: string
            mimetype?: string | null
        }) => {
            const fn = (window.api?.query?.okRequest as any)?.uploadSupportingDocument
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
        mutationFn: async (payload: {
            id: number
            preOpChecklist?: Record<string, unknown> | null
            whoChecklist?: {
                signIn?: Record<string, unknown> | null
                timeOut?: Record<string, unknown> | null
            } | null
            postOpChecklist?: {
                signOut?: Record<string, unknown> | null
                checklist?: Record<string, unknown> | null
            } | null
            updatedBy?: number | null
        }) => {
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
