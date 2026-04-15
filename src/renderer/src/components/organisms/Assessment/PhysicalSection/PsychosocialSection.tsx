import { Card, Checkbox, Col, Form, Input, Row, Select } from 'antd'
import React from 'react'

const { TextArea } = Input
const { Option } = Select

export const PsychosocialSection: React.FC = () => {
  return (
    <Card title="Riwayat Psiko-Sosial, Spiritual & Budaya" className="py-4">
      <Row gutter={24}>
        <Col span={24}>
          <Form.Item label="Status Psikologis" name="psychological_status">
            <Checkbox.Group>
              <Checkbox value="Tenang">Tenang</Checkbox>
              <Checkbox value="Cemas">Cemas</Checkbox>
              <Checkbox value="Takut">Takut</Checkbox>
              <Checkbox value="Marah">Marah</Checkbox>
              <Checkbox value="Sedih">Sedih</Checkbox>
              <Checkbox value="Menangis">Menangis</Checkbox>
            </Checkbox.Group>
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item label="Hubungan dengan Anggota Keluarga" name="family_relation_note">
            <TextArea rows={2} placeholder="Jelaskan hubungan..." />
          </Form.Item>
        </Col>
        <Col span={10}>
          <Form.Item label="Tinggal Dengan" name="living_with_note">
            <TextArea rows={2} placeholder="Tinggal bersama siapa..." />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Agama" name="religion">
            <Select placeholder="Pilih Agama">
              <Option value="Islam">Islam</Option>
              <Option value="Kristen">Kristen</Option>
              <Option value="Katolik">Katolik</Option>
              <Option value="Hindu">Hindu</Option>
              <Option value="Buddha">Buddha</Option>
              <Option value="Konghucu">Konghucu</Option>
              <Option value="Lainnya">Lainnya</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Kepercayaan / Budaya / Nilai-nilai" name="culture_values">
            <TextArea rows={1} placeholder="Nilai khusus..." />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Bahasa Sehari-hari" name="daily_language">
            <Input placeholder="Contoh: Indonesia, Jawa" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )
}
