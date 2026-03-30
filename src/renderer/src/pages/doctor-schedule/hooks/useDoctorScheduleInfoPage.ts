import { Form, type FormInstance } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import type { NavigateFunction } from 'react-router'
import { queryClient } from '@renderer/query-client'
import { client } from '@renderer/utils/client'
import { buildDoctorScheduleEditorPath, ensureSuccess, extractErrorMessage } from '../doctor-schedule-form.utils'
import type {
  ApiSuccessResponse,
  DoctorScheduleEditorReferenceDataDto,
  DoctorScheduleInfoDto,
  DoctorScheduleInfoFormValues,
  SelectOption
} from '../doctor-schedule-form.types'
import { useDoctorContracts } from './useDoctorContracts'

interface SessionScope {
  lokasiKerjaId?: number | null
}

interface UseDoctorScheduleInfoPageProps {
  form: FormInstance<DoctorScheduleInfoFormValues>
  id?: number
  session?: SessionScope | null
  message: MessageInstance
  navigate: NavigateFunction
}

export function useDoctorScheduleInfoPage({
  form,
  id,
  session,
  message,
  navigate
}: UseDoctorScheduleInfoPageProps) {
  const isEdit = typeof id === 'number' && id > 0

  const referenceQuery = client.registration.getScheduleEditorReferenceData.useQuery(
    {},
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: ['doctorScheduleEditor', 'reference-data']
    } as any
  )

  const infoQuery = client.registration.getScheduleInfo.useQuery(
    { scheduleId: id ?? 0 },
    {
      enabled: isEdit,
      queryKey: ['doctorScheduleEditor', 'info', id]
    } as any
  )

  const createInfoMutation = client.registration.createScheduleInfo.useMutation()
  const updateInfoMutation = client.registration.updateScheduleInfo.useMutation()

  const selectedDoctorId = Form.useWatch('idPegawai', form)
  const normalizedSelectedDoctorId =
    typeof selectedDoctorId === 'number' && Number.isFinite(selectedDoctorId) && selectedDoctorId > 0
      ? Number(selectedDoctorId)
      : undefined

  const { contractOptions } = useDoctorContracts(normalizedSelectedDoctorId)

  const referenceResponse = referenceQuery.data as ApiSuccessResponse<DoctorScheduleEditorReferenceDataDto> | undefined
  const infoResponse = infoQuery.data as ApiSuccessResponse<DoctorScheduleInfoDto> | undefined

  const doctorOptions = useMemo<SelectOption[]>(
    () =>
      (referenceResponse?.result?.doctors ?? []).map((doctor) => ({
        value: Number(doctor.id),
        label: doctor.name
      })),
    [referenceResponse?.result?.doctors]
  )

  const poliOptions = useMemo<SelectOption[]>(
    () =>
      (referenceResponse?.result?.polis ?? []).map((poli) => ({
        value: Number(poli.id),
        label: poli.name
      })),
    [referenceResponse?.result?.polis]
  )

  useEffect(() => {
    if (!isEdit || !infoResponse?.result) return

    const info = infoResponse.result
    form.setFieldsValue({
      idPegawai: Number(info.doctorId),
      idPoli: Number(info.poliId),
      idLokasiKerja: Number(info.locationId),
      idKontrakKerja: Number(info.contractId),
      kategori: info.category,
      namaJadwal: info.scheduleName ?? undefined,
      berlakuDari: dayjs(info.validFrom),
      berlakuSampai: info.validTo ? dayjs(info.validTo) : null,
      status: info.status,
      keterangan: info.remark ?? undefined
    })
  }, [form, infoResponse?.result, isEdit])

  useEffect(() => {
    if (!isEdit && session?.lokasiKerjaId) {
      form.setFieldValue('idLokasiKerja', Number(session.lokasiKerjaId))
    }
  }, [form, isEdit, session?.lokasiKerjaId])

  useEffect(() => {
    const currentContractId = Number(form.getFieldValue('idKontrakKerja'))
    if (!normalizedSelectedDoctorId) {
      form.setFieldValue('idKontrakKerja', undefined)
      return
    }

    if (contractOptions.length === 0) {
      return
    }

    const hasCurrentValue = contractOptions.some((option) => option.value === currentContractId)
    if (!hasCurrentValue) {
      form.setFieldValue('idKontrakKerja', contractOptions[0]?.value)
    }
  }, [contractOptions, form, normalizedSelectedDoctorId])

  const onFinish = async (values: DoctorScheduleInfoFormValues) => {
    try {
      const payload = {
        doctorId: Number(values.idPegawai),
        poliId: Number(values.idPoli),
        lokasiKerjaId: Number(values.idLokasiKerja),
        kontrakKerjaId: Number(values.idKontrakKerja),
        category: values.kategori.trim(),
        name: values.namaJadwal?.trim() || undefined,
        validFrom: values.berlakuDari.format('YYYY-MM-DD'),
        validTo: values.berlakuSampai ? values.berlakuSampai.format('YYYY-MM-DD') : undefined,
        status: values.status,
        remark: values.keterangan?.trim() || undefined
      }

      let scheduleId = id
      if (isEdit && scheduleId) {
        await ensureSuccess(
          await updateInfoMutation.mutateAsync({
            scheduleId,
            ...payload
          }),
          'Gagal menyimpan informasi jadwal'
        )
      } else {
        const response = ensureSuccess(
          await createInfoMutation.mutateAsync(payload),
          'Gagal membuat jadwal dokter'
        )
        scheduleId = Number(response?.result?.id)
      }

      if (!scheduleId || !Number.isFinite(scheduleId)) {
        throw new Error('ID jadwal dokter tidak ditemukan')
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['doctorScheduleEditor', 'summary', scheduleId] }),
        queryClient.invalidateQueries({ queryKey: ['doctorScheduleEditor', 'info', scheduleId] })
      ])

      message.success(isEdit ? 'Informasi jadwal berhasil diperbarui' : 'Jadwal dokter berhasil dibuat')
      navigate(buildDoctorScheduleEditorPath(scheduleId, 'info'))
    } catch (error) {
      message.error(extractErrorMessage(error, 'Terjadi kesalahan saat menyimpan informasi jadwal'))
    }
  }

  return {
    doctorOptions,
    doctorLoading: referenceQuery.isPending && doctorOptions.length === 0,
    doctorIsError: referenceQuery.isError,
    poliOptions,
    poliLoading: referenceQuery.isPending && poliOptions.length === 0,
    poliIsError: referenceQuery.isError,
    contractOptions,
    selectedDoctorId: normalizedSelectedDoctorId,
    locationKerjaDisplayValue: `ID Lokasi #${Form.useWatch('idLokasiKerja', form) ?? session?.lokasiKerjaId ?? '-'}`,
    isSubmitting: createInfoMutation.isPending || updateInfoMutation.isPending,
    isLoading: referenceQuery.isPending || (isEdit && infoQuery.isPending),
    onFinish
  }
}
