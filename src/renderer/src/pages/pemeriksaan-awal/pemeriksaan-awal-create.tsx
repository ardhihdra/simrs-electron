import {
  Card,
  Descriptions,
  Table,
  Tabs,
  Form,
  Input,
  Row,
  Col,
  InputNumber,
  Select,
  Button
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ArrowLeftOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import { Link } from 'react-router'

const { TextArea } = Input

// Dummy Data for Patient Info
const patientInfo = {
  noRm: 'RM-0001',
  nik: '1234567890123456',
  nama: 'John Doe',
  noWa: '081234567890',
  pekerjaan: 'PNS',
  jenisKelamin: 'Laki-laki',
  tglLahir: '1990-01-01 (35 Tahun)',
  alamat: 'Jl. Sudirman No. 1, Jakarta'
}

// Dummy Data for Visit Info
const visitInfo = {
  tglKunjungan: '2025-12-17',
  noKunjungan: 'REG-001',
  tglPeriksa: '2025-12-17',
  jaminan: 'BPJS',
  poli: 'Poli Umum',
  dokter: 'Dr. Smith'
}

interface MedicalHistoryType {
  key: string
  tanggal: string
  diagnosa: string
  tindakan: string
  dokter: string
}

const medicalHistoryData: MedicalHistoryType[] = [
  {
    key: '1',
    tanggal: '2025-11-17',
    diagnosa: 'Flu',
    tindakan: 'Resep Obat',
    dokter: 'Dr. Smith'
  },
  {
    key: '2',
    tanggal: '2025-10-17',
    diagnosa: 'Demam',
    tindakan: 'Resep Obat',
    dokter: 'Dr. Smith'
  }
]

const PemeriksaanAwalCreate = () => {
  const [form] = Form.useForm()

  const columns: ColumnsType<MedicalHistoryType> = [
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal'
    },
    {
      title: 'Diagnosa',
      dataIndex: 'diagnosa',
      key: 'diagnosa'
    },
    {
      title: 'Tindakan',
      dataIndex: 'tindakan',
      key: 'tindakan'
    },
    {
      title: 'Dokter',
      dataIndex: 'dokter',
      key: 'dokter'
    }
  ]

  const items = [
    {
      key: '1',
      label: 'Data Data Medis Umum',
      children: (
        <Form form={form} layout="vertical" className="flex flex-col gap-4">
          <Card type="inner" title="Data Kunjungan & Diagnosis" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Tipe Kunjungan" name="tipeKunjungan">
                  <Select placeholder="Pilih Tipe">
                    <Select.Option value="rawat_jalan">Rawat Jalan</Select.Option>
                    <Select.Option value="igd">IGD</Select.Option>
                    <Select.Option value="rawat_inap">Rawat Inap</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Status Encounter" name="statusEncounter">
                  <Select placeholder="Pilih Status">
                    <Select.Option value="in_progress">In-Progress</Select.Option>
                    <Select.Option value="finished">Finished</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Dokter Penanggung Jawab" name="dokterId">
                  <Select placeholder="Pilih Dokter">
                    <Select.Option value="doc1">Dr. Smith</Select.Option>
                    <Select.Option value="doc2">Dr. Strange</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Diagnosis Awal" name="diagnosisAwal">
                  <Input placeholder="Diagnosis saat masuk" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Diagnosis Utama / Kerja" name="diagnosisUtama">
                  <Input placeholder="Diagnosis utama yang ditegakkan" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Keluhan Utama" name="keluhanUtama">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Keluhan Tambahan" name="keluhanTambahan">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Card type="inner" title="Keadaan Umum & Vital Signs" size="small">
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Nadi" name="nadi">
                  <InputNumber style={{ width: '100%' }} addonAfter="x/mnt" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Suhu" name="suhu">
                  <InputNumber style={{ width: '100%' }} addonAfter="°C" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Pernapasan" name="pernapasan">
                  <InputNumber style={{ width: '100%' }} addonAfter="x/mnt" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Sistole" name="sistole">
                  <InputNumber style={{ width: '100%' }} addonAfter="mmHg" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Diastole" name="diastole">
                  <InputNumber style={{ width: '100%' }} addonAfter="mmHg" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={4}>
                <Form.Item label="Tinggi Badan" name="tb">
                  <InputNumber style={{ width: '100%' }} addonAfter="cm" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Berat Badan" name="bb">
                  <InputNumber style={{ width: '100%' }} addonAfter="kg" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Lingkar Perut" name="lp">
                  <InputNumber style={{ width: '100%' }} addonAfter="cm" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card type="inner" title="Status Kesadaran & Nyeri" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="GCS Total" name="gcs">
                  <InputNumber style={{ width: '100%' }} placeholder="E + V + M" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Skala Nyeri (NRS)" name="nrs">
                  <InputNumber min={0} max={10} style={{ width: '100%' }} placeholder="0 - 10" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card type="inner" title="Riwayat Alergi & Obat" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Jenis Alergi" name="alergiJenis">
                  <Select placeholder="Pilih Jenis">
                    <Select.Option value="makanan">Makanan</Select.Option>
                    <Select.Option value="obat">Obat</Select.Option>
                    <Select.Option value="udara">Udara</Select.Option>
                    <Select.Option value="lainnya">Lainnya</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Reaksi Alergi" name="alergiReaksi">
                  <Input placeholder="Contoh: Gatal, Sesak" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Tingkat Keparahan" name="alergiSeverity">
                  <Select placeholder="Pilih Keparahan">
                    <Select.Option value="ringan">Ringan</Select.Option>
                    <Select.Option value="sedang">Sedang</Select.Option>
                    <Select.Option value="berat">Berat</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Obat yang sedang dikonsumsi / Terapi Awal" name="obatBerjalan">
                  <TextArea
                    rows={2}
                    placeholder="Sebutkan obat-obatan yang sedang dikonsumsi pasien saat ini"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Kelainan Kongenital" name="kognital">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kondisi Sistemik / Penyakit Penyerta" name="sistemik">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Bad Oral Habit" name="badOralHabit">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )
    },
    {
      key: '2',
      label: 'Asuhan Keperawatan',
      children: (
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Perawat Pemeriksa" name="perawatId">
                <Select placeholder="Pilih Perawat">
                  <Select.Option value="nurse1">Perawat Siti</Select.Option>
                  <Select.Option value="nurse2">Perawat Budi</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Subjective" name="subjective">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Objective" name="objective">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Assesment" name="assesment">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Plan" name="plan">
                <TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4 pt-6 md:pt-8 pl-4 md:pl-6">
      <Card title="Informasi Pasien" bordered={false}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="No. RM">{patientInfo.noRm}</Descriptions.Item>
          <Descriptions.Item label="Tgl Kunjungan">{visitInfo.tglKunjungan}</Descriptions.Item>

          <Descriptions.Item label="NIK">{patientInfo.nik}</Descriptions.Item>
          <Descriptions.Item label="No. Kunjungan">{visitInfo.noKunjungan}</Descriptions.Item>

          <Descriptions.Item label="Nama Pasien">{patientInfo.nama}</Descriptions.Item>
          <Descriptions.Item label="Tgl Periksa">{visitInfo.tglPeriksa}</Descriptions.Item>

          <Descriptions.Item label="No. WA">{patientInfo.noWa}</Descriptions.Item>
          <Descriptions.Item label="Jaminan">{visitInfo.jaminan}</Descriptions.Item>

          <Descriptions.Item label="Pekerjaan">{patientInfo.pekerjaan}</Descriptions.Item>
          <Descriptions.Item label="Poli">{visitInfo.poli}</Descriptions.Item>

          <Descriptions.Item label="Jenis Kelamin">{patientInfo.jenisKelamin}</Descriptions.Item>
          <Descriptions.Item label="Dokter">{visitInfo.dokter}</Descriptions.Item>

          <Descriptions.Item label="Tgl Lahir / Umur">{patientInfo.tglLahir}</Descriptions.Item>
          <Descriptions.Item label="Alamat">{patientInfo.alamat}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Riwayat Medis" bordered={false}>
        <Table columns={columns} dataSource={medicalHistoryData} pagination={false} size="small" />
      </Card>

      <Card bordered={false}>
        <Tabs defaultActiveKey="1" items={items} />

        <div className="mt-8 flex justify-end gap-2">
          <Link to="/dashboard/pemeriksaan-awal">
            <Button icon={<ArrowLeftOutlined />}>Kembali</Button>
          </Link>
          <Button icon={<ReloadOutlined />}>Reset</Button>
          <Button type="primary" icon={<SaveOutlined />}>
            Simpan
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default PemeriksaanAwalCreate
