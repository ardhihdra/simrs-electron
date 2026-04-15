import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { App, Button, Form, Spin, Card, Row, Col, Select, Input, Checkbox } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  useCreateFamilyHistory,
  useFamilyHistoryByPatient
} from '@renderer/hooks/query/use-family-history'
import { createFamilyHistory as buildFamilyHistory } from '@renderer/utils/builders/family-history-builder'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { PatientData } from '@renderer/types/doctor.types'

const { Option } = Select
const { TextArea } = Input

const FAMILY_RELATION_OPTIONS = [
  { value: 'ayah', label: 'Ayah' },
  { value: 'ibu', label: 'Ibu' },
  { value: 'kakak', label: 'Kakak' },
  { value: 'adik', label: 'Adik' },
  { value: 'saudara', label: 'Saudara Kandung' },
  { value: 'anak', label: 'Anak' },
  { value: 'kakek', label: 'Kakek' },
  { value: 'nenek', label: 'Nenek' },
  { value: 'paman', label: 'Paman' },
  { value: 'bibi', label: 'Bibi' },
  { value: 'sepupu', label: 'Sepupu' },
  { value: 'suami', label: 'Suami' },
  { value: 'istri', label: 'Istri' },
  { value: 'lainnya', label: 'Lainnya' },
  { value: 'other', label: 'Lainnya (Legacy)' }
]

const FAMILY_RELATION_LABEL_MAP = new Map(FAMILY_RELATION_OPTIONS.map((item) => [item.value, item.label]))
const OUTCOME_LABEL_MAP: Record<string, string> = {
  resolved: 'Sembuh',
  ongoing: 'Masih Berlangsung',
  unknown: 'Tidak Diketahui',
  remission: 'Remisi'
}
const OUTCOME_FROM_LABEL_MAP: Record<string, 'resolved' | 'ongoing' | 'unknown' | 'remission'> = {
  sembuh: 'resolved',
  resolved: 'resolved',
  'masih berlangsung': 'ongoing',
  ongoing: 'ongoing',
  'tidak diketahui': 'unknown',
  unknown: 'unknown',
  remisi: 'remission',
  remission: 'remission'
}

const parseStructuredFamilyHistoryNote = (rawNote: unknown) => {
  const text = String(rawNote || '')
  if (!text.trim()) {
    return {
      note: '',
      outcome: undefined as 'resolved' | 'ongoing' | 'unknown' | 'remission' | undefined,
      contributedToDeath: undefined as boolean | undefined
    }
  }

  let extractedOutcome: 'resolved' | 'ongoing' | 'unknown' | 'remission' | undefined
  let extractedContributedToDeath: boolean | undefined
  const cleanLines: string[] = []

  text.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    const outcomeMatch = trimmed.match(/^(luaran|outcome)\s*:\s*(.+)$/i)
    if (outcomeMatch) {
      const key = outcomeMatch[2].trim().toLowerCase()
      extractedOutcome = OUTCOME_FROM_LABEL_MAP[key] || extractedOutcome
      return
    }

    const deathMatch = trimmed.match(/^(terkait kematian|contributed to death)\s*:\s*(.+)$/i)
    if (deathMatch) {
      const rawValue = deathMatch[2].trim().toLowerCase()
      if (rawValue === 'ya' || rawValue === 'yes' || rawValue === 'true') {
        extractedContributedToDeath = true
      } else if (rawValue === 'tidak' || rawValue === 'no' || rawValue === 'false') {
        extractedContributedToDeath = false
      }
      return
    }

    cleanLines.push(line)
  })

  return {
    note: cleanLines.join('\n').trim(),
    outcome: extractedOutcome,
    contributedToDeath: extractedContributedToDeath
  }
}

export interface FamilyHistoryFormProps {
  encounterId: string
  patientData: PatientData
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const FamilyHistoryForm: React.FC<FamilyHistoryFormProps> = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createFamilyHistory = useCreateFamilyHistory()
  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: familyHistoryResponse, isLoading: isLoadingFamilyHistory } =
    useFamilyHistoryByPatient(patientId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  const relationOptions = useMemo(() => {
    const base = [...FAMILY_RELATION_OPTIONS]
    const existingValues = new Set(base.map((item) => item.value))

    if (familyHistoryResponse?.success && familyHistoryResponse?.result) {
      familyHistoryResponse.result.forEach((fh: any) => {
        const relationValue = String(fh?.relationship || '').trim().toLowerCase()
        if (!relationValue || existingValues.has(relationValue)) return
        base.push({
          value: relationValue,
          label: fh?.relationshipDisplay || relationValue
        })
        existingValues.add(relationValue)
      })
    }

    return base
  }, [familyHistoryResponse?.success, familyHistoryResponse?.result])

  useEffect(() => {
    if (familyHistoryResponse?.success && familyHistoryResponse?.result) {
      const fhList = familyHistoryResponse.result.flatMap(
        (fh: any) => {
          const relationship = String(fh.relationship || 'other').toLowerCase()
          const relationshipDisplay = fh.relationshipDisplay || null
          const conditions = Array.isArray(fh.conditions) ? fh.conditions : []

          if (conditions.length > 0) {
            return conditions.map((cond: any) => {
              const parsed = parseStructuredFamilyHistoryNote(cond.note || fh.note || '')
              return {
                relationship,
                relationshipDisplay,
                outcome: cond.outcome || parsed.outcome,
                contributedToDeath:
                  typeof cond.contributedToDeath === 'boolean'
                    ? cond.contributedToDeath
                    : parsed.contributedToDeath,
                note: parsed.note
              }
            })
          }

          const parsedHeaderNote = parseStructuredFamilyHistoryNote(fh.note || '')
          return [
            {
              relationship,
              relationshipDisplay,
              outcome: parsedHeaderNote.outcome,
              contributedToDeath: parsedHeaderNote.contributedToDeath,
              note: parsedHeaderNote.note
            }
          ]
        }
      )

      if (fhList.length > 0) {
        form.setFieldValue('familyHistoryList', fhList)
      }
    }
  }, [familyHistoryResponse?.success, familyHistoryResponse?.result, form])

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientIdStr) return

    let performerId = values.performerId
    if (hideHeader && globalPerformerId) {
      performerId = Number(globalPerformerId)
    }

    if (!hideHeader && !performerId) {
      // Only validate performerId if header is visible
      message.error('Mohon pilih pemeriksa atau pastikan dokter DPJP tersedia')
      return
    }

    try {
      setIsSubmitting(true)

      const familyHistoryList = values.familyHistoryList || []
      const normalizedRows = familyHistoryList
        .map((item: any) => {
          const relationship = String(item?.relationship || '')
            .trim()
            .toLowerCase()
          if (!relationship) return null

          const relationshipDisplay =
            FAMILY_RELATION_LABEL_MAP.get(relationship) ||
            relationOptions.find((relation) => relation.value === relationship)?.label ||
            item?.relationshipDisplay ||
            relationship

          const noteParts: string[] = []
          const freeTextNote = String(item?.note || '').trim()
          if (freeTextNote) noteParts.push(freeTextNote)

          if (item?.outcome) {
            noteParts.push(`Luaran: ${OUTCOME_LABEL_MAP[item.outcome] || item.outcome}`)
          }
          if (typeof item?.contributedToDeath === 'boolean') {
            noteParts.push(`Terkait Kematian: ${item.contributedToDeath ? 'Ya' : 'Tidak'}`)
          }

          return {
            relationship,
            relationshipDisplay,
            note: noteParts.join('\n')
          }
        })
        .filter((row: any) => row?.relationship && row?.note)

      if (normalizedRows.length > 0) {
        for (const row of normalizedRows) {
          await createFamilyHistory.mutateAsync(
            buildFamilyHistory({
              patientId: patientIdStr,
              status: 'completed',
              relationship: row.relationship,
              relationshipDisplay: row.relationshipDisplay,
              note: row.note,
              conditions: []
            })
          )
        }

        message.success('Riwayat Penyakit Keluarga berhasil disimpan')
        const { queryClient } = await import('@renderer/query-client')
        queryClient.invalidateQueries({ queryKey: ['family-history', 'list', patientIdStr] })
      } else {
        message.warning('Tidak ada data riwayat penyakit keluarga yang diisi')
      }
    } catch (error: any) {
      console.error('Error saving family history:', error)
      const detailError = error?.error || error?.message || 'Error'
      message.error(`Gagal menyimpan riwayat penyakit keluarga: ${detailError}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="flex! flex-col! gap-4!"
      initialValues={{
        assessment_date: dayjs()
      }}
    >
      <Spin
        spinning={isSubmitting || isLoadingFamilyHistory}
        tip="Memuat Form Riwayat Keluarga..."
        size="large"
      >
        {!hideHeader && (
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        )}

        <Card title="Riwayat Penyakit Keluarga" className="mt-4!">
          <Form.List name="familyHistoryList">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mt-4! bg-gray-50 bg-opacity-50"
                    title={`Riwayat Penyakit Keluarga ${key + 1}`}
                    extra={
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<DeleteOutlined />}
                      />
                    }
                  >
                    <Row gutter={16}>
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          label="Keluarga"
                          name={[name, 'relationship']}
                          rules={[{ required: true, message: 'Wajib pilih hubungan keluarga' }]}
                        >
                          <Select placeholder="Pilih keluarga">
                            {relationOptions.map((relation) => (
                              <Option key={relation.value} value={relation.value}>
                                {relation.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item {...restField} label="Luaran" name={[name, 'outcome']}>
                          <Select placeholder="Pilih luaran">
                            <Select.Option value="resolved">Sembuh</Select.Option>
                            <Select.Option value="ongoing">Masih Berlangsung</Select.Option>
                            <Select.Option value="unknown">Tidak Diketahui</Select.Option>
                            <Select.Option value="remission">Remisi</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={6} className="flex items-end mt-7">
                        <Form.Item
                          {...restField}
                          name={[name, 'contributedToDeath']}
                          valuePropName="checked"
                          className="mb-0"
                        >
                          <Checkbox>Meninggal?</Checkbox>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      {...restField}
                      label="Catatan Riwayat Penyakit"
                      name={[name, 'note']}
                      rules={[{ required: true, message: 'Catatan riwayat penyakit wajib diisi' }]}
                    >
                      <TextArea
                        rows={2}
                        placeholder="Contoh: Ibu pasien memiliki riwayat diabetes melitus sejak 10 tahun lalu."
                      />
                    </Form.Item>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  className="mt-4"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Tambah Riwayat Keluarga
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Form.Item className="flex justify-end pt-4!">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            disabled={isSubmitting}
          >
            Simpan Riwayat Keluarga
          </Button>
        </Form.Item>
      </Spin>
    </Form>
  )
}
