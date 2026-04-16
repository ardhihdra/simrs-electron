import { EyeOutlined, PrinterOutlined } from '@ant-design/icons'
import logoUrl from '@renderer/assets/logo.png'
import { rpc } from '@renderer/utils/client'
import { useQuery } from '@tanstack/react-query'
import { Alert, App, Button, Card, Descriptions, Empty, Modal, Space, Spin, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useReactToPrint } from 'react-to-print'

type QueueDetailPatient = {
  id?: string
  name?: string
  medicalRecordNumber?: string
  birthDate?: string
  gender?: string
}

type QueueDetailSep = {
  id: string
  sepStatus: string
  noSep?: string | null
  tglSep: string
  noKartu: string
  participantName?: string | null
  noMr?: string | null
  jnsPelayanan?: string | null
  kelasRawatHak?: string | null
  kelasRawatNaik?: string | null
  noRujukan?: string | null
  asalRujukanType?: string | null
  asalFaskesCode?: string | null
  asalFaskesName?: string | null
  poliTujuanCode?: string | null
  poliTujuanName?: string | null
  dpjpCode?: string | null
  dpjpName?: string | null
  diagAwalCode?: string | null
  diagAwalName?: string | null
  catatan?: string | null
  tujuanKunjungan?: string | null
  flagProcedure?: string | null
  kdPenunjang?: string | null
  assesmentPel?: string | null
  issuedAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
}

type QueueDetailReferralSummary = {
  id: string
  status: string
  referralType: 'internal' | 'external'
  internalReferralNumber?: string | null
  externalReferralNumber?: string | null
  referralDate: string | null
  targetSummary?: string | null
}

type QueueDetailData = {
  queueId: string
  queueNumber: string
  globalQueueNumber?: number
  formattedQueueNumber: string
  queueDate: string
  status: string
  paymentMethod: string
  registrationType: string
  createdAt: string
  patient: QueueDetailPatient
  encounterId?: string | null
  encounterStatus?: string | null
  poliCodeId?: number
  poliName?: string | null
  serviceUnitName?: string | null
  practitionerId?: number
  doctorName?: string | null
  sep?: QueueDetailSep | null
  referrals: QueueDetailReferralSummary[]
}

type ReferralDetailData = {
  id: string
  status: string
  referralType: 'internal' | 'external'
  direction: 'incoming' | 'outgoing'
  internalReferralNumber?: string | null
  externalReferralNumber?: string | null
  referralDate?: string | null
  referralTime?: string | null
  patient?: {
    name?: string | null
    medicalRecordNumber?: string | null
    birthDate?: string | null
    gender?: string | null
    insuranceNumber?: string | null
    address?: string | null
  }
  source?: {
    organizationName?: string | null
    departemenName?: string | null
    locationName?: string | null
    practitionerName?: string | null
  }
  target?: {
    organizationName?: string | null
    departemenName?: string | null
    locationName?: string | null
    practitionerName?: string | null
  }
  diagnosisCode?: string | null
  diagnosisText?: string | null
  reasonForReferral?: string | null
  keadaanKirim?: string | null
  examinationSummary?: string | null
  treatmentSummary?: string | null
  conditionAtTransfer?: string | null
  transportationMode?: string | null
}

type QueueSummaryRecord = {
  queueId?: string
}

interface RegistrationQueueDetailModalProps {
  open: boolean
  record?: QueueSummaryRecord
  onClose: () => void
}

const PRINTABLE_REFERRAL_STATUSES = new Set(['issued', 'sent', 'accepted'])

function formatDate(value?: string | null) {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD MMMM YYYY') : value
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD MMMM YYYY HH:mm') : value
}

function formatLabel(value?: string | null) {
  return value && String(value).trim().length > 0 ? value : '-'
}

function formatPaymentMethod(value?: string | null) {
  if (!value) return '-'
  return value.toUpperCase()
}

function formatGender(value?: string | null) {
  if (!value) return '-'
  const normalized = value.toLowerCase()
  if (normalized === 'male') return 'Laki-laki'
  if (normalized === 'female') return 'Perempuan'
  return value
}

function calculateAgeText(value?: string | null) {
  if (!value) return '-'
  const birthDate = dayjs(value)
  if (!birthDate.isValid()) return '-'

  const now = dayjs()
  let years = now.diff(birthDate, 'year')
  const afterYears = birthDate.add(years, 'year')
  let months = now.diff(afterYears, 'month')
  const afterMonths = afterYears.add(months, 'month')
  const days = now.diff(afterMonths, 'day')

  if (years < 0) years = 0
  if (months < 0) months = 0

  return `${years} tahun ${months} bulan ${Math.max(days, 0)} hari`
}

function joinSummary(parts: Array<string | null | undefined>) {
  const summary = parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' / ')

  return summary || '-'
}

function buildDiagnosisText(referral: ReferralDetailData) {
  return joinSummary([referral.diagnosisCode, referral.diagnosisText])
}

function ReferralPrintDocument({ referral }: { referral?: ReferralDetailData | null }) {
  if (!referral) return null

  const referralNumber =
    referral.internalReferralNumber || referral.externalReferralNumber || referral.id || '-'
  const referralTypeLabel =
    referral.referralType === 'external' ? 'Rujukan Eksternal' : 'Rujukan Internal'
  const sourceSummary = joinSummary([
    referral.source?.organizationName,
    referral.source?.departemenName,
    referral.source?.locationName
  ])
  const targetSummary = joinSummary([
    referral.target?.organizationName,
    referral.target?.departemenName,
    referral.target?.locationName
  ])
  const referralDate = formatDate(referral.referralDate)

  const labelStyle: CSSProperties = {
    width: '190px',
    fontWeight: 700,
    verticalAlign: 'top',
    padding: '3px 4px'
  }
  const separatorStyle: CSSProperties = {
    width: '10px',
    verticalAlign: 'top',
    padding: '3px 4px'
  }
  const valueStyle: CSSProperties = {
    verticalAlign: 'top',
    padding: '3px 4px'
  }
  const sectionTitleStyle: CSSProperties = {
    marginTop: '14px',
    marginBottom: '6px',
    fontWeight: 700,
    fontSize: '13px',
    borderBottom: '1px solid #999',
    paddingBottom: '2px'
  }
  const boxStyle: CSSProperties = {
    border: '1px solid #999',
    padding: '8px 10px',
    minHeight: '40px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  }

  const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <tr>
      <td style={labelStyle}>{label}</td>
      <td style={separatorStyle}>:</td>
      <td style={valueStyle}>{formatLabel(value)}</td>
    </tr>
  )

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        background: '#fff',
        color: '#111',
        padding: '12mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '12px',
        lineHeight: 1.45,
        border: '1px solid #7a7a7a',
        backgroundImage:
          'repeating-linear-gradient(to bottom, #ffffff 0px, #ffffff 20px, #fff8f6 20px, #fff8f6 40px)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #6b7280',
          paddingBottom: '6px',
          marginBottom: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={logoUrl}
            alt="Logo Klinik"
            style={{ width: '50px', height: 'auto', objectFit: 'contain', marginRight: '10px' }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}>
              SIMRS Rahayu Medical Center
            </div>
            <div style={{ fontSize: '11px', color: '#374151' }}>Jl. Otista, Tarogong Garut</div>
            <div style={{ fontSize: '11px', color: '#374151' }}>Telp. (0262) 2542608</div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#4b5563',
          color: '#fff',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 700,
          padding: '5px',
          margin: '8px 0 6px',
          textTransform: 'uppercase'
        }}
      >
        SURAT RUJUKAN
      </div>
      <div style={{ textAlign: 'center', marginBottom: '12px', fontSize: '12px' }}>
        Nomor Surat: {formatLabel(referralNumber)}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <InfoRow label="Nomor Rujukan BPJS / Eksternal" value={referral.externalReferralNumber} />
          <InfoRow label="Tanggal Surat" value={referralDate} />
          <InfoRow label="Jam Surat" value={referral.referralTime} />
          <InfoRow label="Jenis Rujukan" value={referralTypeLabel} />
        </tbody>
      </table>

      <div style={sectionTitleStyle}>Data Pasien</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <InfoRow label="Nama Pasien" value={referral.patient?.name} />
          <InfoRow label="No. Rekam Medis" value={referral.patient?.medicalRecordNumber} />
          <InfoRow label="No. BPJS" value={referral.patient?.insuranceNumber} />
          <InfoRow
            label="Jenis Kelamin / Tgl Lahir / Umur"
            value={`${formatGender(referral.patient?.gender)} / ${formatDate(
              referral.patient?.birthDate
            )} / ${calculateAgeText(referral.patient?.birthDate)}`}
          />
          <InfoRow label="Alamat" value={referral.patient?.address} />
        </tbody>
      </table>

      <div style={sectionTitleStyle}>Informasi Rujukan</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <InfoRow label="Asal Faskes / Unit" value={sourceSummary} />
          <InfoRow label="Dokter Perujuk" value={referral.source?.practitionerName} />
          <InfoRow label="Tujuan Faskes / Unit" value={targetSummary} />
          <InfoRow label="Dokter Tujuan" value={referral.target?.practitionerName} />
          <InfoRow label="Transportasi" value={referral.transportationMode} />
        </tbody>
      </table>

      <div style={sectionTitleStyle}>Alasan Dirujuk</div>
      <div style={boxStyle}>{formatLabel(referral.reasonForReferral)}</div>

      <div style={sectionTitleStyle}>Diagnosa</div>
      <div style={boxStyle}>{buildDiagnosisText(referral)}</div>

      <div style={sectionTitleStyle}>Ringkasan Pemeriksaan</div>
      <div style={boxStyle}>{formatLabel(referral.examinationSummary)}</div>

      <div style={sectionTitleStyle}>Terapi / Tindakan yang Sudah Diberikan</div>
      <div style={boxStyle}>{formatLabel(referral.treatmentSummary)}</div>

      <div style={sectionTitleStyle}>Keadaan Pasien Saat Dirujuk</div>
      <div style={boxStyle}>
        {formatLabel(referral.conditionAtTransfer || referral.keadaanKirim)}
      </div>

      <div style={{ marginTop: '32px', width: '100%' }}>
        <div style={{ width: '280px', marginLeft: 'auto', textAlign: 'center' }}>
          <div>{formatLabel(referralDate)}</div>
          <div>Dokter Perujuk</div>
          <div style={{ height: '72px' }} />
          <div>
            <strong>{formatLabel(referral.source?.practitionerName)}</strong>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '18px', fontSize: '10px', color: '#444' }}>
        Dokumen ini dihasilkan oleh sistem informasi rumah sakit. Pastikan isi surat rujukan telah
        diverifikasi sebelum digunakan.
      </div>
    </div>
  )
}

function SepPrintDocument({ detail }: { detail: QueueDetailData }) {
  const sep = detail.sep
  if (!sep) return null

  const lineStyle: CSSProperties = {
    borderBottom: '1px solid #e5e7eb',
    padding: '8px 0'
  }

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        background: '#fff',
        color: '#111827',
        padding: '20mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>SURAT ELIGIBILITAS PESERTA (SEP)</div>
        <div style={{ fontSize: '13px', marginTop: '4px' }}>
          Ringkasan Detail Antrian Pendaftaran
        </div>
      </div>

      <div style={{ marginBottom: '12px', fontWeight: 700 }}>Data Pasien</div>
      <div style={lineStyle}>Nama: {formatLabel(sep.participantName || detail.patient?.name)}</div>
      <div style={lineStyle}>
        No. RM: {formatLabel(sep.noMr || detail.patient?.medicalRecordNumber)}
      </div>
      <div style={lineStyle}>No. Kartu: {formatLabel(sep.noKartu)}</div>
      <div style={lineStyle}>Jenis Kelamin: {formatGender(detail.patient?.gender)}</div>
      <div style={lineStyle}>Tanggal Lahir: {formatDate(detail.patient?.birthDate)}</div>

      <div style={{ margin: '20px 0 12px', fontWeight: 700 }}>Data SEP</div>
      <div style={lineStyle}>Status SEP: {formatLabel(sep.sepStatus)}</div>
      <div style={lineStyle}>No. SEP: {formatLabel(sep.noSep)}</div>
      <div style={lineStyle}>Tanggal SEP: {formatDate(sep.tglSep)}</div>
      <div style={lineStyle}>Jenis Pelayanan: {formatLabel(sep.jnsPelayanan)}</div>
      <div style={lineStyle}>Hak Kelas: {formatLabel(sep.kelasRawatHak)}</div>
      <div style={lineStyle}>Poli Tujuan: {formatLabel(sep.poliTujuanName)}</div>
      <div style={lineStyle}>DPJP: {formatLabel(sep.dpjpName)}</div>
      <div style={lineStyle}>No. Rujukan: {formatLabel(sep.noRujukan)}</div>
      <div style={lineStyle}>Asal Faskes: {formatLabel(sep.asalFaskesName)}</div>
      <div style={lineStyle}>
        Diagnosis Awal: {formatLabel(sep.diagAwalCode || sep.diagAwalName)}
      </div>
      <div style={lineStyle}>Catatan: {formatLabel(sep.catatan)}</div>

      <div style={{ margin: '20px 0 12px', fontWeight: 700 }}>Data Antrian</div>
      <div style={lineStyle}>No. Antrian: {formatLabel(detail.formattedQueueNumber)}</div>
      <div style={lineStyle}>Tanggal Antrian: {formatDate(detail.queueDate)}</div>
      <div style={lineStyle}>Poli: {formatLabel(detail.poliName)}</div>
      <div style={lineStyle}>Dokter: {formatLabel(detail.doctorName)}</div>
      <div style={lineStyle}>Metode Bayar: {formatPaymentMethod(detail.paymentMethod)}</div>

      <div style={{ marginTop: '40px', textAlign: 'right', fontSize: '11px' }}>
        Dicetak pada {formatDateTime(new Date().toISOString())}
      </div>
    </div>
  )
}

export default function RegistrationQueueDetailModal({
  open,
  record,
  onClose
}: RegistrationQueueDetailModalProps) {
  const { message } = App.useApp()
  const [sepViewerOpen, setSepViewerOpen] = useState(false)
  const [selectedReferralId, setSelectedReferralId] = useState<string>()
  const [referralPrintDetail, setReferralPrintDetail] = useState<ReferralDetailData | null>(null)
  const sepPrintRef = useRef<HTMLDivElement>(null)
  const referralPrintRef = useRef<HTMLDivElement>(null)

  const queueDetailQuery = useQuery({
    queryKey: ['registration-queue-detail', record?.queueId],
    queryFn: async () => {
      const response = await rpc.registration.getQueueDetail({ queueId: record?.queueId || '' })
      if (!response.success) {
        throw new Error(response.message || 'Gagal memuat detail antrian')
      }
      return response.result as QueueDetailData
    },
    enabled: open && !!record?.queueId
  })

  const referralDetailQuery = useQuery({
    queryKey: ['registration-referral-detail', selectedReferralId],
    queryFn: async () => {
      const response = await rpc.referral.getDetail({ id: selectedReferralId || '' })
      if (!response.success) {
        throw new Error(response.message || 'Gagal memuat detail rujukan')
      }
      return response.result as ReferralDetailData
    },
    enabled: !!selectedReferralId
  })

  useEffect(() => {
    if (!open) {
      setSepViewerOpen(false)
      setSelectedReferralId(undefined)
    }
  }, [open])

  const detail = queueDetailQuery.data
  const sep = detail?.sep
  const selectedReferral = referralDetailQuery.data

  const handlePrintSep = useReactToPrint({
    contentRef: sepPrintRef,
    documentTitle: sep?.noSep ? `SEP_${sep.noSep}` : `SEP_${detail?.queueId || ''}`
  })

  const handlePrintReferralDocument = useReactToPrint({
    contentRef: referralPrintRef,
    documentTitle: referralPrintDetail?.internalReferralNumber
      ? `Surat_Rujukan_${referralPrintDetail.internalReferralNumber}`
      : `Surat_Rujukan_${referralPrintDetail?.id || ''}`
  })

  const handleReferralPrint = async (referralId: string) => {
    try {
      message.loading({ content: 'Menyiapkan surat rujukan...', key: 'referral-print' })
      let referral = selectedReferralId === referralId ? selectedReferral : undefined

      if (!referral) {
        const response = await rpc.referral.getDetail({ id: referralId })
        if (!response.success || !response.result) {
          throw new Error(response.message || 'Detail rujukan tidak tersedia')
        }
        referral = response.result as ReferralDetailData
      }

      if (!PRINTABLE_REFERRAL_STATUSES.has(referral.status)) {
        throw new Error(`Rujukan dengan status ${referral.status} belum bisa dicetak`)
      }

      setReferralPrintDetail(referral)
      window.setTimeout(() => {
        handlePrintReferralDocument()
        message.success({ content: 'Dialog cetak surat rujukan dibuka', key: 'referral-print' })
      }, 100)
    } catch (error: any) {
      message.error({ content: error?.message || 'Gagal mencetak rujukan', key: 'referral-print' })
    }
  }

  return (
    <>
      <Modal
        open={open}
        title="Detail Antrian"
        onCancel={onClose}
        footer={null}
        width={980}
        destroyOnClose={false}
      >
        {queueDetailQuery.isLoading || queueDetailQuery.isFetching ? (
          <div className="py-16 flex justify-center">
            <Spin size="large" />
          </div>
        ) : queueDetailQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message="Gagal memuat detail antrian"
            description={(queueDetailQuery.error as Error)?.message}
          />
        ) : detail ? (
          <div className="flex flex-col gap-4">
            <Card title="Data Antrian" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="No. Antrian">
                  {formatLabel(detail.formattedQueueNumber)}
                </Descriptions.Item>
                <Descriptions.Item label="No. Antrian Global">
                  {detail.globalQueueNumber != null ? String(detail.globalQueueNumber).padStart(3, '0') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="blue">{formatLabel(detail.status)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal Antrian">
                  {formatDate(detail.queueDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Dibuat Pada">
                  {formatDateTime(detail.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Metode Bayar">
                  {formatPaymentMethod(detail.paymentMethod)}
                </Descriptions.Item>
                <Descriptions.Item label="Tipe Registrasi">
                  {formatLabel(detail.registrationType)}
                </Descriptions.Item>
                <Descriptions.Item label="Pasien">
                  {formatLabel(detail.patient?.name)}
                </Descriptions.Item>
                <Descriptions.Item label="No. RM">
                  {formatLabel(detail.patient?.medicalRecordNumber)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Poli dan Dokter Tujuan" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Poli">{formatLabel(detail.poliName)}</Descriptions.Item>
                <Descriptions.Item label="Unit">
                  {formatLabel(detail.serviceUnitName)}
                </Descriptions.Item>
                <Descriptions.Item label="Dokter">
                  {formatLabel(detail.doctorName)}
                </Descriptions.Item>
                <Descriptions.Item label="Encounter Status">
                  {formatLabel(detail.encounterStatus)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="SEP" size="small">
              {sep ? (
                <div className="space-y-3">
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Status SEP">
                      <Tag color={sep.sepStatus === 'issued' ? 'cyan' : 'orange'}>
                        {formatLabel(sep.sepStatus)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="No. SEP">{formatLabel(sep.noSep)}</Descriptions.Item>
                    <Descriptions.Item label="Tanggal SEP">
                      {formatDate(sep.tglSep)}
                    </Descriptions.Item>
                    <Descriptions.Item label="No. Rujukan">
                      {formatLabel(sep.noRujukan)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Poli Tujuan">
                      {formatLabel(sep.poliTujuanName)}
                    </Descriptions.Item>
                    <Descriptions.Item label="DPJP">{formatLabel(sep.dpjpName)}</Descriptions.Item>
                  </Descriptions>
                  <Space className="mt-4!">
                    <Button icon={<EyeOutlined />} onClick={() => setSepViewerOpen(true)}>
                      Lihat
                    </Button>
                    <Button
                      icon={<PrinterOutlined />}
                      type="primary"
                      onClick={() => handlePrintSep()}
                    >
                      Print
                    </Button>
                  </Space>
                </div>
              ) : (
                <Empty description="Belum ada SEP" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            <Card title="Rujukan" size="small">
              {detail.referrals?.length ? (
                <div className="space-y-3">
                  {detail.referrals.map((referral) => (
                    <div key={referral.id} className="space-y-2">
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="No. Rujukan">
                          {formatLabel(
                            referral.internalReferralNumber ||
                              referral.externalReferralNumber ||
                              '-'
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tipe Rujukan">
                          <Tag color={referral.referralType === 'internal' ? 'blue' : 'purple'}>
                            {referral.referralType.toUpperCase()}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                          <Tag
                            color={
                              PRINTABLE_REFERRAL_STATUSES.has(referral.status) ? 'green' : 'default'
                            }
                          >
                            {referral.status}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Tanggal Rujukan">
                          {formatDate(referral.referralDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tujuan" span={2}>
                          {formatLabel(referral.targetSummary)}
                        </Descriptions.Item>
                      </Descriptions>
                      <Space className="mt-2!">
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => setSelectedReferralId(referral.id)}
                        >
                          Lihat
                        </Button>
                        <Button
                          icon={<PrinterOutlined />}
                          type="primary"
                          disabled={!PRINTABLE_REFERRAL_STATUSES.has(referral.status)}
                          onClick={() => handleReferralPrint(referral.id)}
                        >
                          Print
                        </Button>
                      </Space>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="Belum ada rujukan" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </div>
        ) : (
          <Empty description="Detail antrian tidak tersedia" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>

      <Modal
        open={sepViewerOpen}
        title="Detail SEP"
        onCancel={() => setSepViewerOpen(false)}
        footer={[
          <Button key="close" onClick={() => setSepViewerOpen(false)}>
            Tutup
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintSep()}
          >
            Print
          </Button>
        ]}
        width={900}
      >
        {sep ? (
          <div className="flex flex-col gap-4">
            <Card title="Peserta" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Nama Peserta">
                  {formatLabel(sep.participantName || detail?.patient?.name)}
                </Descriptions.Item>
                <Descriptions.Item label="No. Kartu">{formatLabel(sep.noKartu)}</Descriptions.Item>
                <Descriptions.Item label="No. RM">
                  {formatLabel(sep.noMr || detail?.patient?.medicalRecordNumber)}
                </Descriptions.Item>
                <Descriptions.Item label="Jenis Kelamin">
                  {formatGender(detail?.patient?.gender)}
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal Lahir">
                  {formatDate(detail?.patient?.birthDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Status SEP">
                  {formatLabel(sep.sepStatus)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Detail SEP" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="No. SEP">{formatLabel(sep.noSep)}</Descriptions.Item>
                <Descriptions.Item label="Tanggal SEP">{formatDate(sep.tglSep)}</Descriptions.Item>
                <Descriptions.Item label="Jenis Pelayanan">
                  {formatLabel(sep.jnsPelayanan)}
                </Descriptions.Item>
                <Descriptions.Item label="Hak Kelas">
                  {formatLabel(sep.kelasRawatHak)}
                </Descriptions.Item>
                <Descriptions.Item label="Kelas Naik">
                  {formatLabel(sep.kelasRawatNaik)}
                </Descriptions.Item>
                <Descriptions.Item label="Tujuan Kunjungan">
                  {formatLabel(sep.tujuanKunjungan)}
                </Descriptions.Item>
                <Descriptions.Item label="No. Rujukan">
                  {formatLabel(sep.noRujukan)}
                </Descriptions.Item>
                <Descriptions.Item label="Asal Rujukan">
                  {formatLabel(sep.asalRujukanType)}
                </Descriptions.Item>
                <Descriptions.Item label="Asal Faskes">
                  {formatLabel(sep.asalFaskesName)}
                </Descriptions.Item>
                <Descriptions.Item label="Kode Faskes">
                  {formatLabel(sep.asalFaskesCode)}
                </Descriptions.Item>
                <Descriptions.Item label="Poli Tujuan">
                  {formatLabel(sep.poliTujuanName)}
                </Descriptions.Item>
                <Descriptions.Item label="Kode Poli">
                  {formatLabel(sep.poliTujuanCode)}
                </Descriptions.Item>
                <Descriptions.Item label="DPJP">{formatLabel(sep.dpjpName)}</Descriptions.Item>
                <Descriptions.Item label="Kode DPJP">{formatLabel(sep.dpjpCode)}</Descriptions.Item>
                <Descriptions.Item label="Diagnosis Awal">
                  {formatLabel(sep.diagAwalName || sep.diagAwalCode)}
                </Descriptions.Item>
                <Descriptions.Item label="Kode Diagnosis">
                  {formatLabel(sep.diagAwalCode)}
                </Descriptions.Item>
                <Descriptions.Item label="Flag Procedure">
                  {formatLabel(sep.flagProcedure)}
                </Descriptions.Item>
                <Descriptions.Item label="Kode Penunjang">
                  {formatLabel(sep.kdPenunjang)}
                </Descriptions.Item>
                <Descriptions.Item label="Assessment Pelayanan">
                  {formatLabel(sep.assesmentPel)}
                </Descriptions.Item>
                <Descriptions.Item label="Issued At">
                  {formatDateTime(sep.issuedAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Cancelled At">
                  {formatDateTime(sep.cancelledAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Catatan" span={2}>
                  {formatLabel(sep.catatan)}
                </Descriptions.Item>
                <Descriptions.Item label="Alasan Batal" span={2}>
                  {formatLabel(sep.cancelReason)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        ) : (
          <Empty description="Belum ada SEP" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>

      <Modal
        open={!!selectedReferralId}
        title="Detail Surat Rujukan"
        onCancel={() => setSelectedReferralId(undefined)}
        footer={[
          <Button key="close" onClick={() => setSelectedReferralId(undefined)}>
            Tutup
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            disabled={
              !selectedReferralId ||
              !selectedReferral ||
              !PRINTABLE_REFERRAL_STATUSES.has(selectedReferral.status)
            }
            onClick={() => selectedReferralId && handleReferralPrint(selectedReferralId)}
          >
            Print
          </Button>
        ]}
        width={920}
      >
        {referralDetailQuery.isLoading || referralDetailQuery.isFetching ? (
          <div className="py-12 flex justify-center">
            <Spin />
          </div>
        ) : referralDetailQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message="Gagal memuat detail rujukan"
            description={(referralDetailQuery.error as Error)?.message}
          />
        ) : selectedReferral ? (
          <div className="flex flex-col gap-4">
            <Card title="Ringkasan Rujukan" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="No. Surat">
                  {formatLabel(selectedReferral.internalReferralNumber)}
                </Descriptions.Item>
                <Descriptions.Item label="No. Rujukan Eksternal">
                  {formatLabel(selectedReferral.externalReferralNumber)}
                </Descriptions.Item>
                <Descriptions.Item label="Tipe">
                  {formatLabel(selectedReferral.referralType)}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {formatLabel(selectedReferral.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal">
                  {formatDate(selectedReferral.referralDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Jam">
                  {formatLabel(selectedReferral.referralTime)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Pasien" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Nama">
                  {formatLabel(selectedReferral.patient?.name)}
                </Descriptions.Item>
                <Descriptions.Item label="No. RM">
                  {formatLabel(selectedReferral.patient?.medicalRecordNumber)}
                </Descriptions.Item>
                <Descriptions.Item label="No. BPJS">
                  {formatLabel(selectedReferral.patient?.insuranceNumber)}
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal Lahir">
                  {formatDate(selectedReferral.patient?.birthDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Jenis Kelamin">
                  {formatGender(selectedReferral.patient?.gender)}
                </Descriptions.Item>
                <Descriptions.Item label="Alamat" span={2}>
                  {formatLabel(selectedReferral.patient?.address)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Asal dan Tujuan" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Asal Faskes">
                  {formatLabel(selectedReferral.source?.organizationName)}
                </Descriptions.Item>
                <Descriptions.Item label="Tujuan Faskes">
                  {formatLabel(selectedReferral.target?.organizationName)}
                </Descriptions.Item>
                <Descriptions.Item label="Asal Poli">
                  {/* {formatLabel(selectedReferral.source?.departemenName)} */}
                  {formatLabel(selectedReferral.source?.organizationName)}
                </Descriptions.Item>
                <Descriptions.Item label="Tujuan Poli">
                  {/* {formatLabel(selectedReferral.target?.departemenName)} */}
                  {formatLabel(selectedReferral.target?.organizationName)}
                </Descriptions.Item>
                <Descriptions.Item label="Asal Lokasi">
                  {formatLabel(selectedReferral.source?.locationName)}
                </Descriptions.Item>
                <Descriptions.Item label="Tujuan Lokasi">
                  {formatLabel(selectedReferral.target?.locationName)}
                </Descriptions.Item>
                <Descriptions.Item label="Dokter Pengirim">
                  {formatLabel(selectedReferral.source?.practitionerName)}
                </Descriptions.Item>
                <Descriptions.Item label="Dokter Tujuan">
                  {formatLabel(selectedReferral.target?.practitionerName)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Klinis" size="small">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Diagnosis">
                  {formatLabel(selectedReferral.diagnosisText || selectedReferral.diagnosisCode)}
                </Descriptions.Item>
                <Descriptions.Item label="Keadaan Kirim">
                  {formatLabel(selectedReferral.keadaanKirim)}
                </Descriptions.Item>
                <Descriptions.Item label="Alasan Rujukan" span={2}>
                  {formatLabel(selectedReferral.reasonForReferral)}
                </Descriptions.Item>
                <Descriptions.Item label="Ringkasan Pemeriksaan" span={2}>
                  {formatLabel(selectedReferral.examinationSummary)}
                </Descriptions.Item>
                <Descriptions.Item label="Terapi / Tindakan" span={2}>
                  {formatLabel(selectedReferral.treatmentSummary)}
                </Descriptions.Item>
                <Descriptions.Item label="Kondisi Saat Transfer" span={2}>
                  {formatLabel(selectedReferral.conditionAtTransfer)}
                </Descriptions.Item>
                <Descriptions.Item label="Transportasi" span={2}>
                  {formatLabel(selectedReferral.transportationMode)}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        ) : (
          <Empty description="Detail rujukan tidak tersedia" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>

      <div style={{ display: 'none' }}>
        <div ref={sepPrintRef}>{detail ? <SepPrintDocument detail={detail} /> : null}</div>
        <div ref={referralPrintRef}>
          <ReferralPrintDocument referral={referralPrintDetail} />
        </div>
      </div>
    </>
  )
}
