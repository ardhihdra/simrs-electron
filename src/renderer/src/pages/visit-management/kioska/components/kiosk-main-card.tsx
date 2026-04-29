import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  QrcodeOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { Avatar, Button, Card, Col, Divider, Grid, Input, Row, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'

const { Title, Text } = Typography
const { useBreakpoint } = Grid

interface ServiceCardProps {
  icon: React.ReactNode
  name: string
  desc: string
  onClick: () => void
  style?: React.CSSProperties
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, name, desc, onClick, style }) => (
  <Card
    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
    style={{ ...(style as any), borderRadius: 12, padding: 20 }}
    onClick={onClick}
  >
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
        {icon}
      </div>
      <Text strong className="text-lg">
        {name}
      </Text>
      <Text className="text-sm text-gray-500 text-center">{desc}</Text>
    </div>
  </Card>
)

interface PenjaminCardProps {
  icon: React.ReactNode
  name: string
  desc: string
  onClick: () => void
}

const PenjaminCard: React.FC<PenjaminCardProps> = ({ icon, name, desc, onClick }) => (
  <Card
    className="cursor-pointer transition-all hover:shadow-md"
    style={{ borderRadius: 12, padding: 20, maxWidth: 240 }}
    onClick={onClick}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600">
        {icon}
      </div>
      <Text strong>{name}</Text>
      <Text className="text-xs text-gray-500 text-center">{desc}</Text>
    </div>
  </Card>
)

interface OptionItemProps {
  name: string
  sub: string
  quota: string
  quotaType: 'ok' | 'warn' | 'full'
  onClick: () => void
  doctor?: boolean
  avatar?: string
}

const OptionItem: React.FC<OptionItemProps> = ({
  name,
  sub,
  quota,
  quotaType,
  onClick,
  doctor,
  avatar
}) => {
  const quotaClass =
    quotaType === 'ok'
      ? 'bg-green-100 text-green-600'
      : quotaType === 'warn'
        ? 'bg-yellow-100 text-yellow-600'
        : 'bg-red-100 text-red-600'
  return (
    <Card
      className={`cursor-pointer transition-all hover:border-blue-500 ${doctor ? 'flex-row items-center' : 'flex-col'}`}
      style={{ borderRadius: 8, padding: 16, minHeight: doctor ? 'auto' : 90 }}
      onClick={onClick}
    >
      {doctor && avatar && (
        <Avatar size={40} className="bg-blue-100 text-blue-600 mr-3">
          {avatar}
        </Avatar>
      )}
      <div className="flex-1">
        <Text strong className="text-sm">
          {name}
        </Text>
        <Text className="text-xs text-gray-500 block">{sub}</Text>
        <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${quotaClass}`}>
          {quota}
        </div>
      </div>
    </Card>
  )
}

const KioskMainCard: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<
    'home' | 'rj-penjamin' | 'rj-poli' | 'rj-dokter' | 'ticket-rj' | 'checkin' | 'ticket-direct'
  >('home')
  const [clock, setClock] = useState(new Date())
  const screens = useBreakpoint()

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const renderHome = () => (
    <div className="p-6">
      <div className="text-center mb-4">
        <Title level={3}>Pilih layanan yang Anda butuhkan</Title>
        <Text>Sentuh kartu layanan untuk mengambil nomor antrian</Text>
      </div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <ServiceCard
            icon={<span>🏥</span>}
            name="Rawat Jalan"
            desc="Poliklinik · Konsultasi dokter spesialis"
            onClick={() => setCurrentScreen('rj-penjamin')}
            style={{ backgroundColor: '#eff6ff', borderColor: '#3b82f6' }}
          />
        </Col>
        <Col span={6}>
          <ServiceCard
            icon={<CheckCircleOutlined />}
            name="Check-in Online"
            desc="Konfirmasi pendaftaran online Anda"
            onClick={() => setCurrentScreen('checkin')}
            style={{ backgroundColor: '#f0fdf4', borderColor: '#22c55e' }}
          />
        </Col>
        <Col span={6}>
          <ServiceCard
            icon={<span>🧪</span>}
            name="Laboratorium"
            desc="Antrian pemeriksaan lab"
            onClick={() => setCurrentScreen('ticket-direct')}
            style={{ backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }}
          />
        </Col>
        <Col span={6}>
          <ServiceCard
            icon={<span>📡</span>}
            name="Radiologi"
            desc="Antrian X-Ray, CT-Scan, MRI"
            onClick={() => setCurrentScreen('ticket-direct')}
            style={{ backgroundColor: '#f3f4f6', borderColor: '#8b5cf6' }}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="mt-4">
        <Col span={8}>
          <ServiceCard
            icon={<span>💊</span>}
            name="Farmasi"
            desc="Antrian pengambilan obat"
            onClick={() => setCurrentScreen('ticket-direct')}
            style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}
          />
        </Col>
        <Col span={8}>
          <ServiceCard
            icon={<span>📄</span>}
            name="Billing"
            desc="Antrian informasi tagihan"
            onClick={() => setCurrentScreen('ticket-direct')}
            style={{ backgroundColor: '#fdf2f8', borderColor: '#ec4899' }}
          />
        </Col>
        <Col span={8}>
          <ServiceCard
            icon={<span>💳</span>}
            name="Kasir"
            desc="Antrian pembayaran tagihan"
            onClick={() => setCurrentScreen('ticket-direct')}
            style={{ backgroundColor: '#f9fafb', borderColor: '#6b7280' }}
          />
        </Col>
      </Row>
    </div>
  )

  const renderRjPenjamin = () => (
    <div className="p-6 flex flex-col items-center justify-center">
      <Title level={4} className="text-center mb-2">
        Siapa yang menanggung biaya?
      </Title>
      <Text className="text-center mb-6">Pilih jenis penjamin untuk kunjungan hari ini</Text>
      <Row gutter={[16, 16]}>
        <Col>
          <PenjaminCard
            icon={<span>👤</span>}
            name="Umum"
            desc="Biaya ditanggung sendiri tanpa asuransi"
            onClick={() => setCurrentScreen('rj-poli')}
          />
        </Col>
        <Col>
          <PenjaminCard
            icon={<CheckCircleOutlined />}
            name="BPJS Kesehatan"
            desc="Jaminan Kesehatan Nasional — siapkan kartu BPJS"
            onClick={() => setCurrentScreen('rj-poli')}
          />
        </Col>
        <Col>
          <PenjaminCard
            icon={<span>🛡️</span>}
            name="Asuransi Swasta"
            desc="Asuransi Inhealth, Allianz, AXA, dan lainnya"
            onClick={() => setCurrentScreen('rj-poli')}
          />
        </Col>
      </Row>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => setCurrentScreen('home')}
        className="mt-6"
      >
        Kembali
      </Button>
    </div>
  )

  const renderRjPoli = () => (
    <div className="p-6">
      <Title level={4} className="mb-4">
        Pilih Poliklinik
      </Title>
      <Row gutter={[16, 16]}>
        {/* Add more OptionItem for polikliniks */}
        <Col span={6}>
          <OptionItem
            name="Poli Umum"
            sub="Dokter Umum"
            quota="Sisa 12 kuota"
            quotaType="ok"
            onClick={() => setCurrentScreen('rj-dokter')}
          />
        </Col>
        {/* Repeat for other polikliniks */}
      </Row>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => setCurrentScreen('rj-penjamin')}
        className="mt-6"
      >
        Kembali
      </Button>
    </div>
  )

  const renderRjDokter = () => (
    <div className="p-6">
      <Title level={4} className="mb-4">
        Pilih Dokter — Poli Penyakit Dalam
      </Title>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <OptionItem
            doctor
            name="dr. Fahreza, Sp.PD"
            sub="Spesialis Penyakit Dalam<br>Praktik: 08:00 – 12:00"
            quota="Sisa 5 kuota"
            quotaType="ok"
            onClick={() => setCurrentScreen('ticket-rj')}
            avatar="FH"
          />
        </Col>
        {/* Add more doctors */}
      </Row>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => setCurrentScreen('rj-poli')}
        className="mt-6"
      >
        Kembali
      </Button>
    </div>
  )

  const renderTicketRj = () => (
    <div className="p-6 flex flex-col items-center">
      <Space direction="vertical" align="center">
        <CheckCircleOutlined style={{ fontSize: 40, color: '#22c55e' }} />
        <Text strong style={{ color: '#22c55e' }}>
          Nomor antrian berhasil diambil
        </Text>
      </Space>
      <Card className="mt-4" style={{ maxWidth: 400 }}>
        <Title level={5}>Rawat Jalan · Poli Penyakit Dalam</Title>
        <Text>dr. Sinta Rahayu, Sp.PD-KGEH · Umum</Text>
        <Title level={1} className="text-center">
          B-023
        </Title>
        <Divider />
        <Row gutter={16}>
          <Col span={8}>
            <Text>Saat ini dilayani: B-018</Text>
          </Col>
          <Col span={8}>
            <Text>Estimasi tunggu: ±25 mnt</Text>
          </Col>
          <Col span={8}>
            <Text>Diterbitkan: {clock.toLocaleTimeString()}</Text>
          </Col>
        </Row>
      </Card>
      <Space className="mt-4">
        <Button icon={<PrinterOutlined />}>Cetak Tiket</Button>
        <Button type="primary" onClick={() => setCurrentScreen('home')}>
          Selesai
        </Button>
      </Space>
    </div>
  )

  const renderCheckin = () => (
    <div className="p-6">
      <Row gutter={32}>
        <Col span={12}>
          <Title level={4}>Konfirmasi Pendaftaran Online</Title>
          <Text>Masukkan nomor booking atau pindai QR Code</Text>
          <Input placeholder="Nomor Booking" className="mt-4" />
          <Button type="primary" icon={<SearchOutlined />} className="mt-4 w-full">
            Cari & Konfirmasi
          </Button>
          <Card className="mt-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#22c55e' }}>
            <Text strong style={{ color: '#22c55e' }}>
              Pendaftaran ditemukan
            </Text>
            {/* Add details */}
          </Card>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setCurrentScreen('home')}
            className="mt-4"
          >
            Kembali
          </Button>
        </Col>
        <Col span={12} className="text-center">
          <Title level={5}>Pindai QR Code</Title>
          <Card
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <QrcodeOutlined />
          </Card>
        </Col>
      </Row>
    </div>
  )

  const renderTicketDirect = () => (
    <div className="p-6 flex flex-col items-center">
      <Space direction="vertical" align="center">
        <CheckCircleOutlined style={{ fontSize: 40, color: '#22c55e' }} />
        <Text strong style={{ color: '#22c55e' }}>
          Nomor antrian berhasil diambil
        </Text>
      </Space>
      <Card className="mt-4" style={{ maxWidth: 400 }}>
        <Title level={5}>Laboratorium</Title>
        <Text>Pemeriksaan Darah & Urin</Text>
        <Title level={1} className="text-center">
          L-047
        </Title>
        <Divider />
        <Row gutter={16}>
          <Col span={8}>
            <Text>Saat ini dilayani: L-041</Text>
          </Col>
          <Col span={8}>
            <Text>Estimasi tunggu: ±18 mnt</Text>
          </Col>
          <Col span={8}>
            <Text>Diterbitkan: {clock.toLocaleTimeString()}</Text>
          </Col>
        </Row>
      </Card>
      <Space className="mt-4">
        <Button icon={<PrinterOutlined />}>Cetak Tiket</Button>
        <Button type="primary" onClick={() => setCurrentScreen('home')}>
          Selesai
        </Button>
      </Space>
    </div>
  )

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return renderHome()
      case 'rj-penjamin':
        return renderRjPenjamin()
      case 'rj-poli':
        return renderRjPoli()
      case 'rj-dokter':
        return renderRjDokter()
      case 'ticket-rj':
        return renderTicketRj()
      case 'checkin':
        return renderCheckin()
      case 'ticket-direct':
        return renderTicketDirect()
      default:
        return renderHome()
    }
  }

  return (
    <Card
      title={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar style={{ backgroundColor: '#3b82f6' }}>RS</Avatar>
            <div>
              <Text strong>SIMRS Sentosa</Text>
              <br />
              <Text type="secondary">Jl. Sentosa No. 1, Jakarta</Text>
            </div>
          </div>
          <div className="text-right">
            <Text strong>{clock.toLocaleTimeString()}</Text>
            <br />
            <Text type="secondary">{clock.toLocaleDateString('id-ID')}</Text>
          </div>
        </div>
      }
      style={{ width: 1080, height: 720, borderRadius: 16 }}
      bodyStyle={{ height: '100%', overflow: 'auto' }}
    >
      {renderScreen()}
    </Card>
  )
}

export default KioskMainCard
