import dayjs from 'dayjs'
import { useMemo } from 'react'
import { client } from '@renderer/utils/client'
import type { ApiSuccessResponse, DoctorContractOptionDto, SelectOption } from '../doctor-schedule-form.types'

export function useDoctorContracts(doctorId?: number) {
  const query = client.registration.getDoctorContracts.useQuery(
    { doctorId: doctorId ?? 0 },
    {
      enabled: typeof doctorId === 'number' && doctorId > 0,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: ['doctorScheduleEditor', 'contracts', doctorId]
    } as any
  )

  const response = query.data as ApiSuccessResponse<DoctorContractOptionDto[]> | undefined

  const contractOptions = useMemo<SelectOption[]>(
    () =>
      (response?.result ?? []).map((contract) => {
        const dateRange = [
          contract.tanggalMulaiKontrak
            ? dayjs(contract.tanggalMulaiKontrak).format('DD MMM YYYY')
            : null,
          contract.tanggalBerakhirKontrak
            ? dayjs(contract.tanggalBerakhirKontrak).format('DD MMM YYYY')
            : 'sekarang'
        ]
          .filter(Boolean)
          .join(' - ')

        return {
          value: Number(contract.id),
          label: [contract.nomorKontrak, contract.kodeJabatan, dateRange].filter(Boolean).join(' | ')
        }
      }),
    [response?.result]
  )

  return {
    contractOptions,
    isLoading: query.isPending && typeof doctorId === 'number' && doctorId > 0,
    isError: query.isError
  }
}
