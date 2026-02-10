import type { PatientAttributes } from '@shared/patient'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface QueueItem {
  id: string
  queueDate: string
  serviceUnitCodeId: string
  poliCodeId: string
  registrationChannelCodeId: string
  assuranceCodeId: string
  queueNumber: number
  status: string
  patientId: string
  formattedQueueNumber: string
  patient?: PatientAttributes
  serviceUnit?: { name: string }
  assurance?: { name: string }
  poli?: { name: string }
}

export interface GetActiveQueueResponse {
  success: boolean
  data: QueueItem[]
  message?: string
}

export const useActiveQueues = (params?: {
  poliCodeId?: string
  serviceUnitCodeId?: string
  assuranceCodeId?: string
  queueDate?: string
  status?: string
}) => {
  return useQuery<GetActiveQueueResponse>({
    queryKey: ['visit-management', 'active-queues', params],
    queryFn: async () => {
      // Removed @ts-ignore and added explicit type casting
      const fn = window.api.visitManagement?.getActiveQueues
      if (!fn) throw new Error('API visitManagement tidak tersedia')
      const res = await fn(params)
      return res as GetActiveQueueResponse
    }
  })
}

export const useRegisterPatient = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      // @ts-ignore: IPC API type definition is generated at build time
      const fn = window.api.visitManagement?.register
      if (!fn) throw new Error('API visitManagement tidak tersedia')
      return fn(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-management', 'active-queues'] })
    }
  })
}

export const useConfirmAttendance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { queueId: string; patientId?: string }) => {
      // @ts-ignore: IPC API type definition is generated at build time
      const fn = window.api.visitManagement?.confirmAttendance
      if (!fn) throw new Error('API visitManagement.confirmAttendance not found')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-management', 'active-queues'] })
    }
  })
}

export const useStartEncounter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      queueId: string
      patientId: string
      serviceUnitId: string
      serviceUnitCodeId: string
      recordTriage?: boolean
    }) => {
      // @ts-ignore: IPC API type definition is generated at build time
      const fn = window.api.visitManagement?.startEncounter
      if (!fn) throw new Error('API visitManagement.startEncounter not found')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-management', 'active-queues'] })
    }
  })
}
