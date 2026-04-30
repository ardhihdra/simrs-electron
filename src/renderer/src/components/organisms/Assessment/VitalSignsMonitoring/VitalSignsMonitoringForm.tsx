/**
 * purpose: Render form monitoring TTV harian with side-by-side input and 24-hour history layout.
 * main callers: Assessment pages that mount `VitalSignsMonitoringForm` for an active encounter.
 * key dependencies: `useQueryObservationByEncounter`, `useBulkCreateObservation`, `usePerformers`, `AssessmentHeader`, `VitalSignsSection`.
 * main/public functions: `VitalSignsMonitoringForm`, `handleFinish`.
 * side effects: Reads observation history, writes batched Observation resources, triggers notification UI, and periodically refetches latest observation data.
 */
import { Alert, Button, Card, Form, Table, notification } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import {
  useBulkCreateObservation,
  useQueryObservationByEncounter
} from '@renderer/hooks/query/use-observation'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES,
  OBSERVATION_SYSTEMS
} from '@renderer/utils/builders/observation-builder'
import { CONSCIOUSNESS_SNOMED_MAP } from '@renderer/config/maps/observation-maps'
import { formatObservationSummary } from '@renderer/utils/formatters/observation-formatter'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { VitalSignsSection } from '../VitalSignsSection'

interface VitalSignsMonitoringFormProps {
  encounterId: string
  patientData: any
}

export const VitalSignsMonitoringForm = ({
  encounterId,
  patientData
}: VitalSignsMonitoringFormProps) => {
  const [form] = Form.useForm()
  const bulkCreateObservation = useBulkCreateObservation()

  const {
    data: response,
    isLoading,
    refetch,
    error,
    isError
  } = useQueryObservationByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  const handleFinish = async (values: any) => {
    try {
      const obsBatch = [
        {
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8480-6',
          codeCoding: [
            {
              code: '8480-6',
              display: 'Tekanan Darah Sistolik',
              system: OBSERVATION_SYSTEMS.LOINC
            }
          ],
          display: 'Tekanan Darah Sistolik',
          valueQuantity: {
            value: values.vitalSigns.systolicBloodPressure,
            unit: 'mm[Hg]',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          },
          bodySites: [
            ...(values.vitalSigns.bloodPressureBodySite
              ? [
                  {
                    code: values.vitalSigns.bloodPressureBodySite,
                    display: values.vitalSigns.bloodPressureBodySite
                  }
                ]
              : []),
            ...(values.vitalSigns.bloodPressurePosition
              ? [
                  {
                    code: values.vitalSigns.bloodPressurePosition,
                    display: values.vitalSigns.bloodPressurePosition
                  }
                ]
              : [])
          ]
        },
        {
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8462-4',
          codeCoding: [
            {
              code: '8462-4',
              display: 'Tekanan Darah Diastolik',
              system: OBSERVATION_SYSTEMS.LOINC
            }
          ],
          display: 'Tekanan Darah Diastolik',
          valueQuantity: {
            value: values.vitalSigns.diastolicBloodPressure,
            unit: 'mm[Hg]',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]'
          }
        },
        {
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8867-4',
          codeCoding: [
            { code: '8867-4', display: 'Denyut Nadi', system: OBSERVATION_SYSTEMS.LOINC }
          ],
          display: 'Denyut Nadi',
          valueQuantity: {
            value: values.vitalSigns.pulseRate,
            unit: '{beats}/min',
            system: 'http://unitsofmeasure.org',
            code: '{beats}/min'
          },
          bodySites: values.vitalSigns.pulseRateBodySite
            ? [
                {
                  code: values.vitalSigns.pulseRateBodySite,
                  display: values.vitalSigns.pulseRateBodySite
                }
              ]
            : undefined
        },
        {
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '9279-1',
          codeCoding: [
            { code: '9279-1', display: 'Frekuensi Napas', system: OBSERVATION_SYSTEMS.LOINC }
          ],
          display: 'Frekuensi Napas',
          valueQuantity: {
            value: values.vitalSigns.respiratoryRate,
            unit: 'breaths/min',
            system: 'http://unitsofmeasure.org',
            code: '/min'
          }
        },
        {
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '8310-5',
          codeCoding: [
            { code: '8310-5', display: 'Suhu Tubuh', system: OBSERVATION_SYSTEMS.LOINC }
          ],
          display: 'Suhu Tubuh',
          valueQuantity: {
            value: values.vitalSigns.temperature,
            unit: 'Cel',
            system: 'http://unitsofmeasure.org',
            code: 'Cel'
          },
          methods: values.vitalSigns.temperatureMethod
            ? [
                {
                  code: values.vitalSigns.temperatureMethod,
                  display: values.vitalSigns.temperatureMethod
                }
              ]
            : undefined
        },
        {
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '59408-5',
          codeCoding: [
            { code: '59408-5', display: 'Saturasi Oksigen', system: OBSERVATION_SYSTEMS.LOINC }
          ],
          display: 'Saturasi Oksigen',
          valueQuantity: { value: values.vitalSigns.oxygenSaturation, unit: '%' }
        }
      ]

      const snomedMap = CONSCIOUSNESS_SNOMED_MAP[values.consciousness]
      if (snomedMap) {
        obsBatch.push({
          category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
          code: '67775-7',
          codeCoding: [
            {
              code: '67775-7',
              display: 'Tingkat Kesadaran',
              system: OBSERVATION_SYSTEMS.LOINC
            }
          ],
          display: 'Tingkat Kesadaran',
          valueString: values.consciousness,
          valueCodeableConcept: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: snomedMap.code,
                display: snomedMap.display
              }
            ]
          }
        } as any)
      }

      const observations = createObservationBatch(obsBatch, values.assessment_date)

      const performerName = performersData?.find((p: any) => p.id === values.performerId)?.name

      await bulkCreateObservation.mutateAsync({
        encounterId,
        patientId: patientData?.patient?.id || patientData?.id,
        observations,
        performerId: String(values.performerId),
        performerName
      })

      notification.success({
        message: 'Berhasil',
        description: 'Data monitoring TTV berhasil disimpan'
      })

      form.resetFields(['vitalSigns', 'consciousness'])
      form.setFieldValue('assessment_date', dayjs())
      refetch()
    } catch (saveError: any) {
      console.error(saveError)
      notification.error({
        message: 'Gagal Menyimpan',
        description: saveError.message || 'Terjadi kesalahan saat menyimpan data'
      })
    }
  }

  const groupedHistory = useMemo(() => {
    const historyData = response?.result || []

    return historyData
      .filter((obs: any) => {
        const categoryCode = obs.category || obs.categories?.[0]?.code
        return (
          categoryCode === OBSERVATION_CATEGORIES.VITAL_SIGNS ||
          categoryCode === OBSERVATION_CATEGORIES.EXAM
        )
      })
      .reduce((acc: any[], obs: any) => {
        const observedAt = dayjs(obs.issued || obs.effectiveDateTime)
        const dateKey = observedAt.format('YYYY-MM-DD HH:mm:ss')
        const displayDate = observedAt.format('YYYY-MM-DD HH:mm')

        let existing = acc.find((item) => item.key === dateKey)
        if (!existing) {
          existing = {
            key: dateKey,
            date: displayDate,
            timestamp: observedAt.valueOf(),
            performer: obs.performers?.[0]?.display || 'Unknown',
            items: []
          }
          acc.push(existing)
        }

        existing.items.push(obs)
        return acc
      }, [])
      .map((group) => {
        const summary = formatObservationSummary(group.items, [])
        return {
          ...group,
          vitals: summary.vitalSigns,
          consciousness: summary.physicalExamination?.consciousness,
          bmiCategory: summary.vitalSigns.bmiCategory
        }
      })
      .filter((group) => {
        const v = group.vitals
        return (
          v.systolicBloodPressure ||
          v.diastolicBloodPressure ||
          v.pulseRate ||
          v.respiratoryRate ||
          v.temperature ||
          v.oxygenSaturation ||
          group.consciousness
        )
      })
      .sort((a, b) => b.timestamp - a.timestamp)
  }, [response])

  const historyLast24Hours = useMemo(() => {
    const now = dayjs().valueOf()
    const oneDayMs = 24 * 60 * 60 * 1000
    return groupedHistory.filter((item) => now - item.timestamp <= oneDayMs)
  }, [groupedHistory])

  const systolicTrend = useMemo(() => {
    return historyLast24Hours
      .map((item) => Number(item.vitals.systolicBloodPressure))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, 10)
      .reverse()
  }, [historyLast24Hours])

  useEffect(() => {
    if (!encounterId) return

    refetch()

    const intervalId = window.setInterval(() => {
      refetch()
    }, 30000)

    const handleWindowFocus = () => {
      refetch()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch()
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [encounterId, refetch])

  const historyColumns = [
    {
      title: 'Waktu',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (value: string) => <span className="text-xs font-mono">{value}</span>
    },
    {
      title: 'TD',
      key: 'td',
      width: 95,
      render: (_: unknown, record: any) => {
        const systolic = Number(record.vitals.systolicBloodPressure)
        const diastolic = Number(record.vitals.diastolicBloodPressure)
        const isHigh = Number.isFinite(systolic) && systolic >= 140
        return (
          <span className={`font-mono font-semibold ${isHigh ? 'text-amber-600' : ''}`}>
            {systolic ? `${systolic}/${diastolic || '-'}` : '-'}
          </span>
        )
      }
    },
    {
      title: 'HR',
      key: 'hr',
      width: 70,
      render: (_: unknown, record: any) => (
        <span className="font-mono">{record.vitals.pulseRate || '-'}</span>
      )
    },
    {
      title: 'RR',
      key: 'rr',
      width: 70,
      render: (_: unknown, record: any) => (
        <span className="font-mono">{record.vitals.respiratoryRate || '-'}</span>
      )
    },
    {
      title: 'Suhu',
      key: 'temperature',
      width: 80,
      render: (_: unknown, record: any) => {
        const temperature = Number(record.vitals.temperature)
        const isHigh = Number.isFinite(temperature) && temperature >= 37.5
        return (
          <span className={`font-mono ${isHigh ? 'text-amber-600' : ''}`}>
            {temperature ? `${temperature}°` : '-'}
          </span>
        )
      }
    },
    {
      title: 'SpO2',
      key: 'spo2',
      width: 78,
      render: (_: unknown, record: any) => {
        const oxygen = Number(record.vitals.oxygenSaturation)
        const isLow = Number.isFinite(oxygen) && oxygen < 95
        return (
          <span className={`font-mono ${isLow ? 'text-red-600' : ''}`}>
            {oxygen ? `${oxygen}%` : '-'}
          </span>
        )
      }
    },
    {
      title: 'GCS',
      dataIndex: 'consciousness',
      key: 'consciousness',
      width: 140,
      render: (value: string) => <span className="text-xs">{value || '-'}</span>
    },
    {
      title: 'Petugas',
      dataIndex: 'performer',
      key: 'performer',
      width: 130,
      render: (value: string) => <span className="text-xs text-gray-500">{value || '-'}</span>
    }
  ]

  const visibleHistory = historyLast24Hours.length > 0 ? historyLast24Hours : groupedHistory

  return (
    <div className="flex! flex-col! gap-4!">
      {isError && error && (
        <Alert
          type="error"
          message="Gagal Memuat Data"
          description={
            <pre className="text-xs break-words whitespace-pre-wrap m-0 font-sans">
              {error.message}
            </pre>
          }
          showIcon
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ assessment_date: dayjs() }}
        className="flex! flex-col! gap-4!"
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <Card
            title="Riwayat TTV"
            extra={<span className="text-xs text-gray-500 font-mono">24 jam terakhir</span>}
          >
            <Table
              dataSource={visibleHistory}
              columns={historyColumns}
              loading={isLoading}
              pagination={false}
              size="small"
              rowKey="key"
              scroll={{ x: 760 }}
            />

            <div className="mt-4 border-t border-gray-200 pt-3">
              <div className="text-[10px] font-semibold tracking-wide uppercase text-gray-500 mb-2">
                Tren Tekanan Darah Sistolik
              </div>
              <div className="flex items-end gap-1 h-14">
                {systolicTrend.length > 0 ? (
                  systolicTrend.map((systolic, index) => {
                    const normalized = ((systolic - 90) / 90) * 100
                    const barHeight = Math.max(6, Math.min(44, normalized))
                    const isHigh = systolic >= 140
                    return (
                      <div
                        key={`${systolic}-${index}`}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <span className="text-[9px] text-gray-500 font-mono">{systolic}</span>
                        <div
                          className={`w-full rounded-sm ${isHigh ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ height: `${barHeight}px` }}
                        />
                      </div>
                    )
                  })
                ) : (
                  <div className="text-xs text-gray-500">Belum ada data tren sistolik.</div>
                )}
              </div>
            </div>
          </Card>

          <Card title="Input TTV Baru">
            <div className="flex flex-col">
              <VitalSignsSection form={form} hideAnthropometry showConsciousness />
              <div className="mt-2 flex items-center justify-between gap-3">
                <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
                <Button
                  type="primary"
                  size="large"
                  loading={bulkCreateObservation.isPending}
                  onClick={() => form.submit()}
                >
                  Simpan Monitoring
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Form>
    </div>
  )
}
