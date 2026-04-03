import { useEncounterDetail, useEncounterList } from '@renderer/hooks/query/use-encounter'
import { EncounterType } from '@shared/encounter'
import { Alert, Card, Empty, Select, Space, Spin, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { PengajuanOKForm } from '../../components/organisms/OK/PengajuanOKForm'

type SubmissionType = 'rajal' | 'ranap' | 'igd'

interface EncounterListItem {
  id: string
  patientId: string
  patient?: { id?: string; name?: string }
  encounterType?: string
  serviceType?: string
  status?: string
  visitDate?: string | Date
}

interface PatientDataPayload {
  patient?: { id?: string; name?: string; medicalRecordNumber?: string }
  subjectId?: string
  [key: string]: unknown
}

interface OKSubmissionLocationState {
  encounterId?: string
  patientId?: string
  patientData?: PatientDataPayload
  type?: SubmissionType
}

interface EncounterDetailPayload {
  patient?: { id?: string; name?: string; medicalRecordNumber?: string }
  patientId?: string
  [key: string]: unknown
}

interface EncounterDetailResponse {
  result?: EncounterDetailPayload
}

interface EncounterListResponseShape {
  success?: boolean
  data?: EncounterListItem[]
  result?: EncounterListItem[]
  error?: string
}

const mapEncounterTypeToSubmissionType = (encounterType?: string): SubmissionType => {
  if (encounterType === EncounterType.IMP) return 'ranap'
  if (encounterType === EncounterType.EMER) return 'igd'
  return 'rajal'
}

const OKSubmissionPage = () => {
  const location = useLocation()
  const locationState = (location.state as OKSubmissionLocationState | null) || null

  const { data: encounterListResponse, isLoading: isLoadingEncounterList } = useEncounterList()

  const encounterListPayload = encounterListResponse as EncounterListResponseShape | undefined
  const allEncounters = useMemo<EncounterListItem[]>(() => {
    const source = Array.isArray(encounterListPayload?.result)
      ? encounterListPayload.result
      : Array.isArray(encounterListPayload?.data)
        ? encounterListPayload.data
        : []

    return source
      .map((enc) => {
        const normalizedId = String(enc?.id || '')
        const normalizedPatientId = String(enc?.patientId || enc?.patient?.id || '')
        return {
          ...enc,
          id: normalizedId,
          patientId: normalizedPatientId,
          patient: enc?.patient
        }
      })
      .filter((enc) => !!enc.id && !!enc.patientId)
  }, [encounterListPayload])

  const [selectedPatientId, setSelectedPatientId] = useState(
    locationState?.patientId ||
      locationState?.patientData?.patient?.id ||
      locationState?.patientData?.subjectId ||
      ''
  )
  const [selectedEncounterId, setSelectedEncounterId] = useState(locationState?.encounterId || '')

  const selectedEncounterFromList = useMemo(
    () => allEncounters.find((enc) => enc.id === selectedEncounterId),
    [allEncounters, selectedEncounterId]
  )

  useEffect(() => {
    if (!selectedEncounterFromList) return
    if (!selectedPatientId && selectedEncounterFromList.patientId) {
      setSelectedPatientId(selectedEncounterFromList.patientId)
    }
  }, [selectedEncounterFromList, selectedPatientId])

  useEffect(() => {
    if (!selectedPatientId || !selectedEncounterFromList) return
    if (selectedEncounterFromList.patientId !== selectedPatientId) {
      setSelectedEncounterId('')
    }
  }, [selectedPatientId, selectedEncounterFromList])

  const patientOptions = useMemo(() => {
    const patientMap = new Map<string, string>()
    allEncounters.forEach((enc) => {
      if (enc.patientId && !patientMap.has(enc.patientId)) {
        patientMap.set(enc.patientId, enc.patient?.name || `Pasien (${enc.patientId})`)
      }
    })

    return Array.from(patientMap.entries()).map(([value, label]) => ({ value, label }))
  }, [allEncounters])

  const encounterOptions = useMemo(() => {
    const candidates = selectedPatientId
      ? allEncounters.filter((enc) => enc.patientId === selectedPatientId)
      : allEncounters

    return candidates.map((enc) => {
      const visitDateLabel = enc.visitDate
        ? dayjs(enc.visitDate).format('DD MMM YYYY HH:mm')
        : 'Tanggal kunjungan tidak tersedia'
      const typeLabel = mapEncounterTypeToSubmissionType(enc.encounterType).toUpperCase()
      const statusLabel = (enc.status || '-').toUpperCase()
      const patientName = enc.patient?.name || `Pasien (${enc.patientId})`

      return {
        value: enc.id,
        label: `${patientName} • ${visitDateLabel} • ${typeLabel} • ${statusLabel}`
      }
    })
  }, [allEncounters, selectedPatientId])

  const { data: encounterDetailResponse, isLoading: isLoadingEncounterDetail } = useEncounterDetail(
    selectedEncounterId || undefined
  )

  const encounterDetail = (encounterDetailResponse as EncounterDetailResponse | undefined)?.result
  const selectedEncounterType =
    selectedEncounterFromList?.encounterType ||
    (typeof encounterDetail?.encounterType === 'string' ? encounterDetail.encounterType : undefined)

  const resolvedSubmissionType = mapEncounterTypeToSubmissionType(selectedEncounterType)

  const encounterListErrorMessage =
    encounterListPayload?.error ||
    (encounterListPayload?.success === false ? 'Gagal memuat data encounter.' : '')

  useEffect(() => {
    if (isLoadingEncounterList) return

    if (encounterListErrorMessage) {
      console.error('[OKSubmissionPage] Encounter list error', {
        error: encounterListErrorMessage,
        response: encounterListPayload
      })
      return
    }

    if (allEncounters.length === 0) {
      console.warn('[OKSubmissionPage] Encounter list empty', {
        responseKeys: encounterListPayload ? Object.keys(encounterListPayload) : [],
        success: encounterListPayload?.success,
        dataCount: Array.isArray(encounterListPayload?.data) ? encounterListPayload.data.length : 0,
        resultCount: Array.isArray(encounterListPayload?.result)
          ? encounterListPayload.result.length
          : 0
      })
    }
  }, [
    isLoadingEncounterList,
    encounterListErrorMessage,
    encounterListPayload,
    allEncounters.length
  ])

  useEffect(() => {
    if (!selectedEncounterId) return
    console.log('[OKSubmissionPage] Encounter selected', {
      encounterId: selectedEncounterId,
      encounterType: selectedEncounterType,
      mappedSubmissionType: resolvedSubmissionType,
      patientId: selectedPatientId
    })
  }, [selectedEncounterId, selectedEncounterType, resolvedSubmissionType, selectedPatientId])

  const resolvedPatientData = useMemo(() => {
    if (encounterDetail?.patient) {
      return {
        ...encounterDetail,
        patient: encounterDetail.patient,
        subjectId: encounterDetail.patient?.id || encounterDetail.patientId || selectedPatientId
      }
    }

    if (locationState?.patientData && locationState?.encounterId === selectedEncounterId) {
      return locationState.patientData
    }

    if (selectedPatientId) {
      return {
        patient: {
          id: selectedPatientId,
          name: selectedEncounterFromList?.patient?.name || 'Pasien'
        },
        subjectId: selectedPatientId
      }
    }

    return null
  }, [
    encounterDetail,
    locationState?.patientData,
    locationState?.encounterId,
    selectedEncounterId,
    selectedPatientId,
    selectedEncounterFromList?.patient?.name
  ])

  const canRenderForm = !!selectedEncounterId && !!resolvedPatientData

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-4">
      <Card title={<Typography.Text strong>Buat Pengajuan Kamar Operasi (OK)</Typography.Text>}>
        <Space direction="vertical" size={12} className="w-full">
          <Typography.Text type="secondary">
            Pilih pasien atau langsung pilih encounter terlebih dahulu.
          </Typography.Text>
          <Select
            allowClear
            showSearch
            placeholder="Pilih pasien (opsional)"
            value={selectedPatientId || undefined}
            options={patientOptions}
            onChange={(value) => setSelectedPatientId(value || '')}
            optionFilterProp="label"
          />
          <Select
            allowClear
            showSearch
            placeholder="Pilih encounter untuk mulai pengajuan OK"
            value={selectedEncounterId || undefined}
            options={encounterOptions}
            onChange={(value) => setSelectedEncounterId(value || '')}
            optionFilterProp="label"
            loading={isLoadingEncounterList}
          />
          {!selectedEncounterId && (
            <Alert type="info" showIcon message="Form akan aktif setelah encounter dipilih." />
          )}
          {!!encounterListErrorMessage && (
            <Alert type="error" showIcon message={encounterListErrorMessage} />
          )}
        </Space>
      </Card>

      {isLoadingEncounterDetail && selectedEncounterId ? (
        <Card>
          <div className="py-8 flex justify-center">
            <Spin tip="Memuat data encounter..." />
          </div>
        </Card>
      ) : !isLoadingEncounterList && allEncounters.length === 0 ? (
        <Card>
          <Empty description="Belum ada data encounter yang bisa dipilih." />
        </Card>
      ) : canRenderForm ? (
        <PengajuanOKForm
          key={`${resolvedSubmissionType}-${selectedEncounterId}`}
          type={resolvedSubmissionType}
          encounterId={selectedEncounterId}
          patientData={resolvedPatientData}
        />
      ) : (
        <Card>
          <Alert
            type="warning"
            showIcon
            message="Silakan pilih encounter terlebih dahulu untuk melanjutkan pengajuan OK."
          />
        </Card>
      )}
    </div>
  )
}

export default OKSubmissionPage
