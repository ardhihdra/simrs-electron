import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Col, Form, FormInstance, Row, Select, Spin, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import { useDiagnosisCodeList } from '@renderer/hooks/query/use-diagnosis-code'

const { Option } = Select
const { TextArea } = Input

interface AnamnesisSectionProps {
  form: FormInstance
}

export const AnamnesisSection: React.FC<AnamnesisSectionProps> = ({ form }) => {
  const [diagnosisOptions, setDiagnosisOptions] = useState<any[]>([])
  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const [debouncedDiagnosisSearch, setDebouncedDiagnosisSearch] = useState('')

  const { data: masterDiagnosis, isLoading: searchingDiagnosis } = useDiagnosisCodeList({
    q: debouncedDiagnosisSearch,
    items: 20
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDiagnosisSearch(diagnosisSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [diagnosisSearch])

  useEffect(() => {
    if (debouncedDiagnosisSearch.length >= 2 && masterDiagnosis) {
      setDiagnosisOptions(masterDiagnosis)
    } else {
      setDiagnosisOptions([])
    }
  }, [masterDiagnosis, debouncedDiagnosisSearch])

  const handleDiagnosisSearch = (value: string) => {
    setDiagnosisSearch(value)
  }

  return (
    <Card title="Anamnesis" className="mt-4!">
      <Form.Item label="Keluhan Utama" className="">
        <Form.Item name={['anamnesis', 'chiefComplaint_codeId']} style={{ marginBottom: 16 }}>
          <Select
            showSearch
            filterOption={false}
            onSearch={handleDiagnosisSearch}
            placeholder="Cari kode ICD-10/SNOMED untuk keluhan utama..."
            className="w-full mb-2"
            notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
            onSelect={(_, option: any) => {
              const current = form.getFieldValue(['anamnesis', 'chiefComplaint'])
              if (!current) form.setFieldValue(['anamnesis', 'chiefComplaint'], option.label)
            }}
            allowClear
          >
            {diagnosisOptions.map((d) => (
              <Option key={d.id} value={d.id} label={`${d.code} - ${d.id_display || d.display}`}>
                {d.code} - {d.id_display || d.display}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Detail Keluhan Utama"
          name={['anamnesis', 'chiefComplaint']}
          rules={[{ required: true, message: 'Wajib diisi' }]}
        >
          <TextArea rows={2} placeholder="Masukkan catatan tambahan keluhan utama pasien..." />
        </Form.Item>
      </Form.Item>
      <Form.Item label="Keluhan Penyerta" className="mb-0">
        <Form.Item name={['anamnesis', 'associatedSymptoms_codeId']} style={{ marginBottom: 16 }}>
          <Select
            showSearch
            filterOption={false}
            onSearch={handleDiagnosisSearch}
            placeholder="Cari kode ICD-10/SNOMED untuk keluhan penyerta..."
            className="w-full mb-2"
            notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
            onSelect={(_, option: any) => {
              const current = form.getFieldValue(['anamnesis', 'associatedSymptoms'])
              if (!current) form.setFieldValue(['anamnesis', 'associatedSymptoms'], option.label)
            }}
            allowClear
          >
            {diagnosisOptions.map((d) => (
              <Option key={d.id} value={d.id} label={`${d.code} - ${d.id_display || d.display}`}>
                {d.code} - {d.id_display || d.display}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name={['anamnesis', 'associatedSymptoms']}>
          <TextArea
            rows={2}
            placeholder="Masukkan catatan tambahan keluhan penyerta (jika ada)..."
          />
        </Form.Item>
      </Form.Item>
      <Form.Item label="Riwayat Penyakit" className="mb-0">
        <Form.Item
          name={['anamnesis', 'historyOfPresentIllness_codeId']}
          style={{ marginBottom: 16 }}
        >
          <Select
            showSearch
            filterOption={false}
            onSearch={handleDiagnosisSearch}
            placeholder="Cari kode ICD-10/SNOMED untuk riwayat penyakit..."
            className="w-full mb-2"
            notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
            onSelect={(_, option: any) => {
              const currentNotes = form.getFieldValue(['anamnesis', 'historyOfPresentIllness'])
              if (!currentNotes) {
                form.setFieldValue(['anamnesis', 'historyOfPresentIllness'], option.label)
              }
            }}
            allowClear
          >
            {diagnosisOptions.map((d) => (
              <Option key={d.id} value={d.id} label={`${d.code} - ${d.id_display || d.display}`}>
                {d.code} - {d.id_display || d.display}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="Rincian Riwayat Penyakit"
          name={['anamnesis', 'historyOfPresentIllness']}
          rules={[{ required: true, message: 'Wajib diisi' }]}
        >
          <TextArea rows={3} placeholder="Masukkan catatan tambahan atau riwayat penyakit..." />
        </Form.Item>
      </Form.Item>
      <Form.Item label="Riwayat Penyakit Keluarga">
        <Form.List name={['anamnesis', 'familyHistoryList']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  size="small"
                  className="mt-4 bg-gray-50 bg-opacity-50"
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
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        label="Diagnosis"
                        name={[name, 'diagnosisCodeId']}
                        rules={[{ required: true, message: 'Wajib memilih diagnosa' }]}
                      >
                        <Select
                          showSearch
                          filterOption={false}
                          onSearch={handleDiagnosisSearch}
                          placeholder="Cari kode diagnosa..."
                          notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
                        >
                          {diagnosisOptions.map((d) => (
                            <Option
                              key={d.id}
                              value={d.id}
                              label={`${d.code} - ${d.id_display || d.display}`}
                            >
                              {d.code} - {d.id_display || d.display}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item {...restField} label="Outcome" name={[name, 'outcome']}>
                        <Select placeholder="Pilih outcome">
                          <Select.Option value="resolved">Diabetes resolved</Select.Option>
                          <Select.Option value="ongoing">Ongoing</Select.Option>
                          <Select.Option value="unknown">Unknown</Select.Option>
                          <Select.Option value="remission">Remission</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4} className="flex items-end pb-6">
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
                  <Form.Item {...restField} label="Catatan (Onset/Detail)" name={[name, 'note']}>
                    <TextArea
                      rows={2}
                      placeholder="Contoh: Ibu pasien pernah menderita DM 10 tahun yll..."
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
                Tambah Riwayat Penyakit Keluarga
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
      <Form.Item label="Riwayat Alergi" className="gap-4 flex flex-col">
        <Form.Item name={['anamnesis', 'allergyHistory_codeId']} style={{ marginBottom: 16 }}>
          <Select
            showSearch
            filterOption={false}
            onSearch={handleDiagnosisSearch}
            placeholder="Cari zat/substansi alergi (ICD-10/SNOMED)..."
            className="w-full mb-2"
            notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
            onSelect={(_, option: any) => {
              const current = form.getFieldValue(['anamnesis', 'allergyHistory'])
              if (!current) form.setFieldValue(['anamnesis', 'allergyHistory'], option.label)
            }}
            allowClear
          >
            {diagnosisOptions.map((d) => (
              <Option key={d.id} value={d.id} label={`${d.code} - ${d.id_display || d.display}`}>
                {d.code} - {d.id_display || d.display}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name={['anamnesis', 'allergyHistory']}>
          <TextArea rows={2} placeholder="Masukkan catatan tambahan riwayat alergi (jika ada)..." />
        </Form.Item>
      </Form.Item>
      <Form.Item label="Riwayat Pengobatan" name={['anamnesis', 'medicationHistory']}>
        <TextArea rows={2} placeholder="Masukkan riwayat pengobatan sebelumnya (jika ada)..." />
      </Form.Item>
    </Card>
  )
}
