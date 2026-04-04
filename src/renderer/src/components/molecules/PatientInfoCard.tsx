import React from 'react'
import { Card, Tag, theme } from 'antd'
import {
  UserOutlined,
  IdcardOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  CreditCardOutlined,
  WarningFilled,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

interface PatientInfoCardProps {
  patientData: {
    patient: {
      medicalRecordNumber: string
      name: string
      gender?: string | null
      age?: number | null
      identityNumber?: string
      address?: string
      religion?: string
    }
    poli?: {
      name: string
    }
    doctor?: {
      name: string
    }
    visitDate?: string
    paymentMethod?: string
    status?: string
    allergies?: string
  }
  action?: React.ReactNode
  sections?: {
    showIdentityNumber?: boolean
    showAllergies?: boolean
  }
}

const getStatusColor = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case 'arrived':
    case 'examining':
    case 'in_progress':
      return 'warning'
    case 'planned':
      return 'processing'
    case 'finished':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

const getStatusLabel = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case 'arrived':
    case 'planned':
      return 'Menunggu'
    case 'examining':
    case 'in_progress':
      return 'Sedang Diperiksa'
    case 'finished':
      return 'Selesai'
    case 'cancelled':
      return 'Dibatalkan'
    default:
      return status ? status.toUpperCase() : 'UNKNOWN'
  }
}

const InfoItem = ({
  icon,
  label,
  children
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) => {
  const { token } = theme.useToken()

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color: token.colorTextTertiary, fontSize: token.fontSizeSM }}>{icon}</span>
        <span
          style={{
            color: token.colorTextTertiary,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: token.fontSizeSM,
          fontWeight: 600,
          color: token.colorText
        }}
      >
        {children}
      </div>
    </div>
  )
}

export const PatientInfoCard = ({ patientData, action, sections }: PatientInfoCardProps) => {
  const { token } = theme.useToken()
  const { patient, poli, doctor, visitDate, paymentMethod, status, allergies } = patientData
  const { showIdentityNumber = true, showAllergies = true } = sections || {}

  const hasAllergy = allergies && allergies !== '-'
  const normalizedGender = String(patient.gender || '').toLowerCase()
  const genderLabel =
    normalizedGender === 'male' || normalizedGender === 'm'
      ? 'Laki-laki'
      : normalizedGender === 'female' || normalizedGender === 'f'
        ? 'Perempuan'
        : '-'
  const ageLabel =
    typeof patient.age === 'number' && Number.isFinite(patient.age) && patient.age >= 0
      ? `${patient.age} th`
      : '-'

  return (
    <Card
      styles={{ body: { padding: 0 } }}
      className="overflow-hidden rounded-xl"
      variant="borderless"
    >
      <div
        className="px-6 py-4 flex justify-between items-center"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: token.colorPrimaryBg,
              border: `1px solid ${token.colorPrimaryBorder}`
            }}
          >
            <span style={{ color: token.colorPrimary, fontSize: 20, fontWeight: 700 }}>
              {(patient.name || 'U').charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <h2
              className="text-lg font-bold m-0 leading-tight tracking-tight"
              style={{ color: token.colorTextLightSolid }}
            >
              {patient.name || 'Unknown'}
            </h2>
            <span style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, fontWeight: 500 }}>
              {patient.address || 'Alamat tidak tersedia'}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="font-mono text-[10px] font-medium px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  color: 'rgba(255,255,255,0.90)'
                }}
              >
                RM: {patient.medicalRecordNumber || '-'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12 }}>•</span>
              <span style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, fontWeight: 500 }}>
                {genderLabel}, {ageLabel}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12 }}>•</span>
              <span style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, fontWeight: 500 }}>
                {patient.religion}
              </span> 
            </div>
          </div>
        </div>
        {status && (
          <div className="flex flex-col items-end gap-2">
            <Tag
              color={getStatusColor(status)}
              bordered={false}
              className="m-0 font-bold px-3 py-1 text-xs rounded-lg uppercase tracking-wider"
            >
              {getStatusLabel(status)}
            </Tag>
            {action && <div className="mt-1">{action}</div>}
          </div>
        )}
        {/* {onEditStatus && (
            <Button
              type="link"
              size="small"
              onClick={onEditStatus}
              icon={<EditOutlined />}
              className="text-xs p-0 m-0 h-auto"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Ubah Status
            </Button>
          )} */}
      </div>

      {/* ─── Body: menggunakan colorBgContainer dari token ─── */}
      <div className="px-6 py-4" style={{ background: token.colorBgContainer }}>
        {/* Primary Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
          <InfoItem icon={<MedicineBoxOutlined />} label="Poliklinik / Unit">
            {poli?.name || '-'}
          </InfoItem>

          <InfoItem icon={<UserOutlined />} label="Dokter Pemeriksa">
            {doctor?.name || '-'}
          </InfoItem>

          <InfoItem icon={<CalendarOutlined />} label="Tgl Kunjungan">
            {visitDate ? dayjs(visitDate).format('DD MMM YYYY, HH:mm') : '-'}
          </InfoItem>

          <InfoItem icon={<CreditCardOutlined />} label="Penjamin">
            <Tag
              color="cyan"
              bordered={false}
              className="m-0 font-semibold rounded-md text-xs px-2.5"
            >
              {paymentMethod || 'Umum'}
            </Tag>
          </InfoItem>
        </div>

        {(showIdentityNumber || showAllergies) && (
          <>
            {/* Divider: menggunakan colorBorderSecondary dari token */}
            <div
              className="my-4 rounded"
              style={{ height: 1, background: token.colorBorderSecondary }}
            />

            {/* Secondary Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
              {showIdentityNumber && (
                <InfoItem icon={<IdcardOutlined />} label="NIK">
                  <span className="font-mono text-sm">{patient.identityNumber || '-'}</span>
                </InfoItem>
              )}

              {showAllergies && (
                <div
                  className={
                    showIdentityNumber ? 'col-span-1 md:col-span-3' : 'col-span-2 md:col-span-4'
                  }
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }}>
                      {hasAllergy ? (
                        <WarningFilled style={{ color: token.colorError }} />
                      ) : (
                        <SafetyCertificateOutlined style={{ color: token.colorSuccess }} />
                      )}
                    </span>
                    <span
                      style={{
                        color: token.colorTextTertiary,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                      }}
                    >
                      Riwayat Alergi
                    </span>
                  </div>
                  <div>
                    {hasAllergy ? (
                      <div
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5"
                        style={{
                          background: token.colorErrorBg,
                          border: `1px solid ${token.colorErrorBorder}`
                        }}
                      >
                        <WarningFilled
                          style={{ color: token.colorError, fontSize: token.fontSizeSM }}
                          className="shrink-0"
                        />
                        <span
                          className="text-sm font-semibold leading-relaxed"
                          style={{ color: token.colorErrorText }}
                        >
                          {allergies}
                        </span>
                      </div>
                    ) : (
                      <span
                        className="text-xs italic px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 font-medium"
                        style={{
                          background: token.colorSuccessBg,
                          border: `1px solid ${token.colorSuccessBorder}`,
                          color: token.colorSuccessText
                        }}
                      >
                        <SafetyCertificateOutlined />
                        Aman, tidak ada catatan alergi
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
