import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'

export interface BodyMarker {
    id: number
    encounterId: string
    x: number
    y: number
    note: string
    createdBy?: number
}

export const useBodyMarkerByEncounter = (encounterId: string) => {
    return useQuery({
        queryKey: ['body-marker', encounterId],
        queryFn: async () => {
            const response = await window.api.query.bodymarker.getByEncounter({ encounterId })
            return response
        },
        enabled: !!encounterId
    })
}

export const useBulkCreateBodyMarker = () => {
    const queryClient = useQueryClient()
    const { message } = App.useApp()

    return useMutation({
        mutationFn: async (payload: { encounterId: string; markers: any[]; createdBy?: number }) => {
            const response = await window.api.query.bodymarker.create(payload)
            return response
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['body-marker', variables.encounterId] })
        },
        onError: (error: any) => {
            message.error(`Gagal menyimpan marker: ${error.message}`)
        }
    })
}
