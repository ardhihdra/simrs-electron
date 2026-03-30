import { SaveOutlined } from '@ant-design/icons'
import { App, Button, Form, Spin, Card, Select, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import { useCreateAllergy, useAllergyByEncounter } from '@renderer/hooks/query/use-allergy'
import { createAllergy as buildAllergy } from '@renderer/utils/builders/allergy-builder'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { PatientData } from '@renderer/types/doctor.types'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

export interface AllergyFormProps {
  encounterId: string
  patientData: PatientData
  hideHeader?: boolean
  globalPerformerId?: string | number
}

export const AllergyForm: React.FC<AllergyFormProps> = ({
  encounterId,
  patientData,
  hideHeader = false,
  globalPerformerId
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createAllergy = useCreateAllergy()
  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: allergyResponse, isLoading: isLoadingAllergy } = useAllergyByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  useEffect(() => {
    if (allergyResponse?.success && allergyResponse?.result) {
      const allergies = allergyResponse.result
      if (Array.isArray(allergies) && allergies.length > 0) {
        const firstAllergy = allergies[0]

        const note = allergies
          .map((a: any) => a.note)
          .filter(Boolean)
          .join(', ')

        form.setFieldsValue({
          allergyHistory: note,
          allergyHistory_category:
            typeof firstAllergy.category === 'string'
              ? firstAllergy.category
              : firstAllergy.category?.[0] || 'food'
        })
      }
    }
  }, [allergyResponse?.success, allergyResponse?.result, form])

  const handleFinish = async (values: any) => {
    if (!encounterId || !patientIdStr) return

    let performerId = values.performerId
    if (hideHeader && globalPerformerId) {
      performerId = Number(globalPerformerId)
    }

    if (!performerId && !hideHeader) {
      message.error('Mohon pilih pemeriksa atau pastikan dokter DPJP tersedia')
      return
    }

    try {
      setIsSubmitting(true)

      if (values.allergyHistory) {
        const allergyPayload = buildAllergy({
          patientId: patientIdStr,
          encounterId,
          note: values.allergyHistory,
          clinicalStatus: 'active',
          verificationStatus: 'confirmed',
          category: values.allergyHistory_category || 'food'
        })

        await createAllergy.mutateAsync(allergyPayload)

        message.success('Alergi berhasil disimpan')
        const { queryClient } = await import('@renderer/query-client')
        queryClient.invalidateQueries({ queryKey: ['allergy', 'byEncounter', encounterId] })
      } else {
        message.warning('Mohon isi catatan atau nama alergen')
      }
    } catch (error: any) {
      console.error('Error saving allergy:', error)
      const detailError = error?.error || error?.message || 'Error'
      message.error(`Gagal menyimpan alergi: ${detailError}`)
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
      <Spin spinning={isSubmitting || isLoadingAllergy} tip="Memuat Form Alergi..." size="large">
        {!hideHeader && (
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        )}

        <Card title="Riwayat Alergi" className="mt-4!">
          <Form.Item
            label={<span className="font-semibold">Nama Alergen & Catatan Alergi</span>}
            name="allergyHistory"
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <TextArea
              rows={3}
              placeholder="Masukkan nama penyebab alergi dan catatan tambahannya..."
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold">Kategori Alergi</span>}
            name="allergyHistory_category"
            rules={[{ required: true, message: 'Kategori wajib dipilih' }]}
            className="mt-4"
          >
            <Select placeholder="Pilih Kategori Alergi" style={{ width: 200 }}>
              <Option value="food">Makanan</Option>
              <Option value="medication">Obat</Option>
              <Option value="environment">Lingkungan</Option>
              <Option value="biologic">Biologi</Option>
              <Option value="other">Lainnya</Option>
            </Select>
          </Form.Item>
        </Card>

        <Form.Item className="flex justify-end pt-4!">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            disabled={isSubmitting}
          >
            Simpan Alergi
          </Button>
        </Form.Item>
      </Spin>
    </Form>
  )
}
