import { queryClient } from '@renderer/query-client'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import { EncounterAttributes, EncounterListResult, EncounterRow } from 'simrs-types'

type EncounterListParams = {
  depth?: number
  status?: string
  id?: string
  include?: string
  q?: string
  startDate?: string
  endDate?: string
  serviceUnitId?: string
  mrn?: string
  queueNumber?: string
}

export const useCreateEncounter = () => {
  return useMutation({
    mutationKey: ['encounter', 'create'],
    mutationFn: async (payload: EncounterAttributes) => {
      const fn = window.api?.query?.encounter?.create
      if (!fn) throw new Error('API encounter tidak tersedia')
      return fn(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
    }
  })
}

export const useUpdateEncounter = () => {
  return useMutation({
    mutationKey: ['encounter', 'update'],
    mutationFn: async (payload: EncounterAttributes) => {
      const fn = window.api?.query?.encounter?.update
      if (!fn) throw new Error('API encounter tidak tersedia')
      return fn(payload as any)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['encounter', 'detail', variables.id] })
    }
  })
}

export const useEncounterDetail = (id?: number | string) => {
  return useQuery({
    queryKey: ['encounter', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.read
      if (!fn || !id) throw new Error('API encounter tidak tersedia')
      return fn({ id: String(id) })
    },
    enabled: !!id
  })
}

export const useEncounterList = (params?: EncounterListParams) => {
  return useQuery<EncounterListResult>({
    queryKey: ['encounter', 'list', params],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn(params ?? {}) as Promise<EncounterListResult>
    }
  })
}

export const useDeleteEncounter = () => {
  return useMutation({
    mutationKey: ['encounter', 'delete'],
    mutationFn: (id: any) => {
      const fn = window.api?.query?.encounter?.deleteById
      if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id })
    },
    onSuccess: () => {
      console.log('success')
      queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
    },
    onError: (error) => {
      console.log('error', error)
    }
  })
}

export const useEncounterMonitor = () => {
  return useQuery<EncounterListResult>({
    queryKey: ['encounter', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn() as Promise<EncounterListResult>
    },
    select: useCallback((data: EncounterListResult) => {
      if (!data.success || !data.data) return data

      const today = dayjs().startOf('day')

      // Should be filtered by today AND planned
      const filtered = (data.data as EncounterRow[]).filter((item) => {
        const isToday = dayjs(item.visitDate).isSame(today, 'day')
        const isPlanned = (item.status || '').toLowerCase() === 'planned'
        return isToday && isPlanned
      })

      return { ...data, data: filtered }
    }, [])
  })
}
