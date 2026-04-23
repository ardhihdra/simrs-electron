import { Card, Space, Alert, Tag, Checkbox, Divider, Input, Row, Col, Button } from 'antd'
import { CheckCircleFilled, WarningFilled } from '@ant-design/icons'
import { useEffect, useMemo } from 'react'

export interface TelaahResults {
  // kejelasanResep: boolean;
  // tepatPasien: boolean;
  // tepatObat: boolean;
  // tepatDosis: boolean;
  // tepatWaktu: boolean;
  // tepatRute: boolean;
  // identitasDokter: boolean;

  // 1. Administrasi
  tanggalResep?: boolean
  parafDokter?: boolean
  identitasPasien?: boolean
  bbTb?: boolean
  // 2. Farmasetik
  namaObat?: boolean
  kekuatan?: boolean
  jumlahObat?: boolean
  signa?: boolean
  // 3. Klinis
  duplikasi?: boolean
  kontraindikasi?: boolean
  interaksi?: boolean
  dosisLazim?: boolean
  alergi?: boolean
  // 4. Informasi & Edukasi
  infoKesesuaianIdentitas?: boolean
  infoNamaDosisJumlah?: boolean
  infoCaraGuna?: boolean
  infoEso?: boolean
  // 5. Follow up
  keterangan?: string | null
}

interface Criterion {
  key: keyof TelaahResults
  label: string
}

const administrasiCriteria: Criterion[] = [
  { key: 'tanggalResep', label: 'Tanggal Resep' },
  { key: 'parafDokter', label: 'Paraf Dokter' },
  { key: 'identitasPasien', label: 'Identitas Pasien' },
  { key: 'bbTb', label: 'Berat Badan / Tinggi Badan' }
]

const farmasetikCriteria: Criterion[] = [
  { key: 'namaObat', label: 'Nama Obat' },
  { key: 'kekuatan', label: 'Kekuatan' },
  { key: 'jumlahObat', label: 'Jumlah Obat' },
  { key: 'signa', label: 'Signa' }
]

const klinisCriteria: Criterion[] = [
  { key: 'duplikasi', label: 'Duplikasi' },
  { key: 'kontraindikasi', label: 'Kontraindikasi' },
  { key: 'interaksi', label: 'Interaksi' },
  { key: 'dosisLazim', label: 'Dosis Lazim' },
  { key: 'alergi', label: 'Alergi' }
]

const edukasiCriteria: Criterion[] = [
  { key: 'infoKesesuaianIdentitas', label: 'Kesesuaian Identitas Pasien' },
  { key: 'infoNamaDosisJumlah', label: 'Nama Obat, Dosis, Jumlah, Bentuk Sediaan' },
  { key: 'infoCaraGuna', label: 'Cara Penggunaan' },
  { key: 'infoEso', label: 'Efek Samping Obat (ESO)' }
]

interface Props {
  isInternal: boolean
  results: TelaahResults
  onChange: (results: TelaahResults) => void
}

export const TelaahAdministrasiForm = ({ isInternal, results, onChange }: Props) => {
  const allCriteriaMet = useMemo(() => {
    const criteriaKeys: (keyof TelaahResults)[] = [
      ...administrasiCriteria.map((c) => c.key),
      ...farmasetikCriteria.map((c) => c.key),
      ...klinisCriteria.map((c) => c.key),
      ...edukasiCriteria.map((c) => c.key)
    ]
    return criteriaKeys.every((v) => results[v] === true)
  }, [results])

  // useEffect(() => {
  //   if (isInternal) {
  //     onChange({
  //       kejelasanResep: true,
  //       tepatPasien: true,
  //       tepatObat: true,
  //       tepatDosis: true,
  //       tepatWaktu: true,
  //       tepatRute: true,
  //       identitasDokter: true
  //     })
  //   }
  // }, [isInternal])

  const handleCheckInternalCriteria = () => {
    const allTrueResults: TelaahResults = { ...results }
    const criteriaKeys: (keyof TelaahResults)[] = administrasiCriteria.map((c) => c.key)
    criteriaKeys.forEach((key) => {
      ; (allTrueResults[key] as boolean) = true
    })
    onChange(allTrueResults)
  }

  const handleCheckAll = () => {
    const allTrueResults: TelaahResults = { ...results }
    const criteriaKeys: (keyof TelaahResults)[] = [
      ...administrasiCriteria.map((c) => c.key),
      ...farmasetikCriteria.map((c) => c.key),
      ...klinisCriteria.map((c) => c.key),
      ...edukasiCriteria.map((c) => c.key)
    ]
    criteriaKeys.forEach((key) => {
      ; (allTrueResults[key] as boolean) = true
    })
    onChange(allTrueResults)
  }

  useEffect(() => {
    if (isInternal) {
      handleCheckInternalCriteria()
    }
  }, [isInternal])

  const renderCheckbox = (c: Criterion) => (
    <div key={c.key} className="py-1 px-2 hover:bg-gray-50 rounded-md transition-colors">
      <Checkbox
        checked={results[c.key] as boolean}
        onChange={(e) => onChange({ ...results, [c.key]: e.target.checked })}
      >
        <span className="text-gray-700 text-sm">{c.label}</span>
      </Checkbox>
    </div>
  )

  return (
    <Card
      title={
        <div className="flex justify-between items-center w-full">
          <Space>
            <span className="text-lg font-bold">Telaah Administrasi, Farmasetik & Klinis</span>
            {isInternal && (
              <Tag color="blue" icon={<CheckCircleFilled />}>
                Resep Internal Rumah Sakit
              </Tag>
            )}
          </Space>
          {import.meta.env.DEV && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleFilled />}
              onClick={handleCheckAll}
              className="bg-orange-500 border-none rounded-lg hover:bg-orange-600"
            >
              Ceklis Semua
            </Button>
          )}
        </div>
      }
      size="small"
      styles={{ body: { padding: '24px' } }}
      className="shadow-sm border-none bg-gray-50/50"
    >
      {isInternal && (
        <Alert
          message="Validasi Otomatis (Internal)"
          description="Resep ini berasal dari sistem internal SIMRS dan telah divalidasi secara otomatis melalui integrasi E-Resep. Seluruh kriteria telah dicentang otomatis."
          type="info"
          showIcon
          className="mb-6 rounded-xl border-blue-100 bg-blue-50/50"
        />
      )}

      <Row gutter={[24, 24]} className="mt-2">
        <Col span={24} lg={6}>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
            <Divider orientation="left" plain style={{ margin: '0 0 16px 0' }}>
              <span className="font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                ADMINISTRASI
              </span>
            </Divider>
            <div className="flex flex-col gap-1">{administrasiCriteria.map(renderCheckbox)}</div>
          </div>
        </Col>

        <Col span={24} lg={6}>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
            <Divider orientation="left" plain style={{ margin: '0 0 16px 0' }}>
              <span className="font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                FARMASETIK
              </span>
            </Divider>
            <div className="flex flex-col gap-1">{farmasetikCriteria.map(renderCheckbox)}</div>
          </div>
        </Col>

        <Col span={24} lg={6}>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
            <Divider orientation="left" plain style={{ margin: '0 0 16px 0' }}>
              <span className="font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                KLINIS
              </span>
            </Divider>
            <div className="flex flex-col gap-1">{klinisCriteria.map(renderCheckbox)}</div>
          </div>
        </Col>

        <Col span={24} lg={6}>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-full">
            <Divider orientation="left" plain style={{ margin: '0 0 16px 0' }}>
              <span className="font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                INFO & EDUKASI
              </span>
            </Divider>
            <div className="flex flex-col gap-1">{edukasiCriteria.map(renderCheckbox)}</div>
          </div>
        </Col>

        <Col span={24}>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <Divider orientation="left" plain style={{ margin: '0 0 12px 0' }}>
              <span className="font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-gray-400 rounded-full" />
                TINDAK LANJUT - KETERANGAN
              </span>
            </Divider>
            <Input.TextArea
              rows={3}
              placeholder="Masukkan keterangan tindak lanjut jika diperlukan..."
              value={results.keterangan || ''}
              onChange={(e) => onChange({ ...results, keterangan: e.target.value })}
              className="rounded-lg"
            />
          </div>
        </Col>
      </Row>

      {!allCriteriaMet && (
        <div className="mt-8">
          <Alert
            message="Pemeriksaan Manual Diperlukan"
            description="Pastikan semua kriteria telah diperiksa. Kriteria yang belum dicentang mengindikasikan ketidaksesuaian yang perlu ditindaklanjuti."
            type="warning"
            showIcon
            icon={<WarningFilled />}
            className="rounded-xl border-none shadow-sm"
          />
        </div>
      )}
    </Card>
  )
}
