import { PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Modal, Spin, Table, Tag, Typography } from 'antd'
import React, { useState } from 'react'
import dayjs from 'dayjs'
import { PatientData } from '@renderer/types/doctor.types'
import { AssessmentHeader } from './AssesmentHeader/AssessmentHeader'
import {
  useClinicalImpressionByEncounter,
  useSaveClinicalImpression
} from '@renderer/hooks/query/use-clinical-impression'
import { createClinicalImpression } from '@renderer/utils/builders/clinical-impression-builder'
import { CLINICAL_IMPRESSION_CATEGORIES } from '@renderer/config/maps/clinical-impression-maps'
import { usePerformers } from '@renderer/hooks/query/use-performers'

const { TextArea } = Input
const { Text } = Typography

export interface RiwayatPerjalananPenyakitFormProps {
  encounterId: string
  patientData: PatientData
}

const QUICK_TEMPLATES = [
  'Pasien datang dengan keluhan utama demam',
  'Keluhan disertai sakit kepala dan mual',
  'Pasien memiliki riwayat diabetes mellitus tipe 2',
  'Pernah menderita asma',
  'Riwayat keluarga: ibu dengan DM tipe 2',
  'Belum pernah berobat sebelumnya untuk keluhan ini',
  'Keluhan sudah berlangsung selama ... hari',
  'Tidak ada alergi obat yang diketahui'
]

export const RiwayatPerjalananPenyakitForm: React.FC<RiwayatPerjalananPenyakitFormProps> = ({
  encounterId,
  patientData
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [modalOpen, setModalOpen] = useState(false)

  const patientId = patientData.patient.id
  const patientIdStr = patientId ? String(patientId) : undefined

  const { data: impressionResponse, isLoading } = useClinicalImpressionByEncounter(encounterId)
  const saveImpression = useSaveClinicalImpression()
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])

  const riwayatList = (impressionResponse?.data ?? []).filter(
    (i) => i.description === CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_COURSE
  )

  const onFinish = async (values: Record<string, string>) => {
    if (!patientIdStr) {
      message.error('Data pasien tidak valid.')
      return
    }

    const performerId = form.getFieldValue('performerId')

    try {
      const payload = createClinicalImpression({
        patientId: patientIdStr,
        patientName: patientData.patient?.name,
        encounterId,
        practitionerId: performerId?.toString() ?? patientData.doctor?.id?.toString(),
        summary: values.summary,
        category: CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_COURSE
      })

      await saveImpression.mutateAsync(payload)
      message.success('Riwayat perjalanan penyakit berhasil disimpan')
      form.resetFields()
      setModalOpen(false)
    } catch (error: any) {
      message.error(error.message || 'Gagal menyimpan riwayat perjalanan penyakit')
    }
  }

  // ─── Kolom tabel ──────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Riwayat Perjalanan Penyakit',
      dataIndex: 'summary',
      key: 'summary',
      render: (v: string) => <Text className="text-sm whitespace-pre-wrap">{v || '-'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => (
        <Tag color={v === 'completed' ? 'green' : v === 'in-progress' ? 'processing' : 'default'}>
          {v?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Tanggal',
      dataIndex: 'effectiveDateTime',
      key: 'effectiveDateTime',
      width: 140,
      render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-')
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Riwayat Perjalanan Penyakit"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Tambah Riwayat
          </Button>
        }
      >
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={riwayatList}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            className="border-none"
            locale={{ emptyText: 'Belum ada riwayat perjalanan penyakit yang dicatat' }}
            size="small"
          />
        </Spin>
      </Card>

      <Modal
        title="Input Riwayat Perjalanan Penyakit Baru"
        open={modalOpen}
        onCancel={() => {
          form.resetFields()
          setModalOpen(false)
        }}
        footer={[
          <Button
            key="back"
            onClick={() => {
              form.resetFields()
              setModalOpen(false)
            }}
          >
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SaveOutlined />}
            loading={saveImpression.isPending}
            onClick={() => form.submit()}
          >
            Simpan Riwayat
          </Button>
        ]}
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="pt-4 space-y-4! flex! flex-col!"
        >
          <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

          {/* Info resource FHIR */}
          <div className="bg-blue-50 border border-blue-100 rounded px-3 py-2 mb-4 text-xs text-blue-700">
            <span className="font-semibold">Resource:</span> ClinicalImpression &nbsp;|&nbsp;
            <span className="font-semibold">Status:</span> completed &nbsp;|&nbsp;
            <span className="font-semibold">SNOMED:</span> 312850006 — History of disorder
          </div>

          <Form.Item
            name="summary"
            label="Isi Riwayat Perjalanan Penyakit"
            rules={[{ required: true, message: 'Riwayat perjalanan penyakit wajib diisi' }]}
          >
            <TextArea
              rows={6}
              placeholder="Contoh: Pasien datang dengan keluhan utama demam menggigil disertai sakit kepala. Pasien memiliki riwayat diabetes mellitus tipe 2..."
            />
          </Form.Item>

          {/* Pilihan cepat */}
          <div className="mb-4">
            <Text className="text-xs text-gray-500 block mb-1">Klik untuk menambah ke teks:</Text>
            <div className="flex flex-wrap gap-1">
              {QUICK_TEMPLATES.map((t) => (
                <Tag
                  key={t}
                  className="cursor-pointer hover:bg-blue-50 text-xs"
                  onClick={() => {
                    const current = form.getFieldValue('summary') ?? ''
                    const separator = current ? '\n' : ''
                    form.setFieldValue('summary', `${current}${separator}${t}`)
                  }}
                >
                  + {t}
                </Tag>
              ))}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
