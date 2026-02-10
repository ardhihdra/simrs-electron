import type { PatientAttributes } from '@shared/patient'
import { useQuery } from '@tanstack/react-query'

export const usePatientOptions = () => {
  return useQuery({
    queryKey: ['patient', 'options'],
    queryFn: async () => {
      const fn = window.api?.query?.patient?.list
      if (!fn) throw new Error('API patient tidak tersedia')
      const res = await fn()
      if (res.success && res.data) {
        return (res.data as unknown as PatientAttributes[]).map((p) => ({
          label: p.name,
          value: p.id!
        }))
      }
      return []
    }
  })
}

export const usePatientList = (filters?: { name?: string; nik?: string }) => {
  return useQuery({
    queryKey: ['patient', 'list', filters],
    queryFn: async () => {
      // @ts-ignore: IPC API type definition is generated at build time
      const fn = window.api?.query?.patient?.list
      if (!fn) throw new Error('API patient tidak tersedia')
      const res = await fn(filters)
      return res
    }
  })
}
