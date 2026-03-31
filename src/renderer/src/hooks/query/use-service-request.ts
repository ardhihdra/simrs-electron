import { App } from 'antd'
import { queryClient } from '@renderer/query-client'
import { rpc } from '@renderer/utils/client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

interface ServiceRequestFormValues {
  category: string
  code?: string
  display?: string
  priority?: string
  patientInstruction?: string
  system?: string
  masterServiceRequestCodeId?: number
  selectedServiceRequestCodes?: Array<{
    masterServiceRequestCodeId: number
    code: string
    display: string
    system?: string
  }>
}

export const useCreateServiceRequest = ({
  encounterId,
  patientId,
  practitionerId
}: {
  encounterId: string
  patientId: string
  practitionerId?: number
}) => {
  const { message } = App.useApp()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createServiceRequest = async (values: ServiceRequestFormValues) => {
    setIsSubmitting(true)
    try {
      const serviceRequests =
        values.selectedServiceRequestCodes && values.selectedServiceRequestCodes.length > 0
          ? values.selectedServiceRequestCodes
          : values.masterServiceRequestCodeId && values.code && values.display
            ? [
                {
                  masterServiceRequestCodeId: values.masterServiceRequestCodeId,
                  code: values.code,
                  display: values.display,
                  system: values.system
                }
              ]
            : []

      if (serviceRequests.length === 0) {
        throw new Error('Pilih minimal satu kode pemeriksaan')
      }

      let createdServiceRequestId: string | number | undefined

      for (const serviceRequest of serviceRequests) {
        const createResult = await rpc.query.entity({
          model: 'serviceRequest',
          method: 'post',
          body: {
            encounterId,
            patientId,
            doctorId: practitionerId,
            serviceRequests: [
              {
                category: String(values.category),
                code: String(serviceRequest.code),
                display: String(serviceRequest.display),
                priority: String(values.priority || 'routine'),
                patientInstruction: values.patientInstruction
                  ? String(values.patientInstruction)
                  : undefined,
                system: serviceRequest.system
                  ? String(serviceRequest.system)
                  : values.system
                    ? String(values.system)
                    : 'http://loinc.org',
                masterServiceRequestCodeId: serviceRequest.masterServiceRequestCodeId
              }
            ]
          }
        })

        if (!createResult?.success) {
          throw new Error(createResult?.message || 'Gagal membuat service request')
        }

        createdServiceRequestId = createResult?.result?.[0]?.id ?? createdServiceRequestId
      }

      if (createdServiceRequestId) {
        await rpc.query.entity({
          model: 'encounter',
          path: String(encounterId),
          method: 'put',
          body: { serviceRequestId: String(createdServiceRequestId) }
        })
      }

      queryClient.invalidateQueries({ queryKey: ['service-request', 'by-encounter', encounterId] })

      message.success(
        serviceRequests.length > 1
          ? `${serviceRequests.length} service request berhasil dibuat`
          : 'Service request berhasil dibuat'
      )

      return {
        count: serviceRequests.length,
        serviceRequestId: createdServiceRequestId
      }
    } catch (error: any) {
      message.error(error?.message || 'Gagal membuat service request')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return { createServiceRequest, isSubmitting }
}

export const useServiceRequestByEncounter = (encounterId?: string) => {
  return useQuery({
    queryKey: ['service-request', 'by-encounter', encounterId],
    queryFn: () => {
      const fn = window.api?.query?.serviceRequest?.getByEncounter
      if (!fn || !encounterId) throw new Error('API serviceRequest tidak tersedia')
      return fn({ encounterId })
    },
    enabled: !!encounterId
  })
}

export const useBulkCreateServiceRequest = () => {
  return useMutation({
    mutationKey: ['service-request', 'create'],
    mutationFn: async (payload: any) => {
      const fn = window.api?.query?.serviceRequest?.create
      if (!fn) throw new Error('API serviceRequest tidak tersedia')
      return fn(payload)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['service-request', 'by-encounter', variables.encounterId]
      })
    }
  })
}

export const useUpdateServiceRequestStatus = () => {
  return useMutation({
    mutationKey: ['service-request', 'update'],
    mutationFn: async (payload: { id: number; status: string }) => {
      const fn = window.api?.query?.serviceRequest?.update
      if (!fn) throw new Error('API serviceRequest tidak tersedia')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-request'] })
    }
  })
}
