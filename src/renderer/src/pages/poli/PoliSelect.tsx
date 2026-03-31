import { CalendarOutlined, MedicineBoxOutlined, TeamOutlined } from '@ant-design/icons'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client } from '@renderer/utils/client'
import { Card, Col, Modal, Row, Spin, Tag, Typography, theme } from 'antd'
import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

const { Title, Text } = Typography

const normalizePoliCode = (value: string | number) => String(value).trim().toLowerCase()

interface PoliItem {
  id: number
  name: string
  code: string
  lokasiKerjaId: number
}

/**
 * Determine whether the given role needs a workspace picker.
 * doctor and nurse have fixed destinations; everyone else (admin, rekam_medis, etc.) gets the modal.
 */
const needsWorkspacePicker = (hakAksesId: string | undefined | null): boolean => {
  return hakAksesId !== 'doctor' && hakAksesId !== 'nurse'
}

export default function PoliSelect() {
  const { session } = useModuleScopeStore()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const isAdministrator = session?.hakAksesId === 'administrator'
  const [searchParams] = useSearchParams()

  const [selectedPoli, setSelectedPoli] = useState<PoliItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: poliData, isLoading } = client.visitManagement.poli.useQuery({})
  const { data: moduleMyData } = client.module.my.useQuery({})

  const listPoli = useMemo(
    () =>
      (poliData?.result ?? [])
        .map((poli) => ({
          id: poli.id,
          name: poli.name,
          code: poli.code || poli.id.toString(),
          lokasiKerjaId: poli.location.id
        }))
        .filter((poli) => {
          if (isAdministrator) return true
          return poli.lokasiKerjaId === session?.lokasiKerjaId
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'id')),
    [isAdministrator, poliData?.result, session?.lokasiKerjaId]
  )

  // Auto-open workspace picker if navigated from sidebar with selectPoli param
  useEffect(() => {
    const selectPoliCode = searchParams.get('selectPoli')
    if (!selectPoliCode || listPoli.length === 0) return
    const found = listPoli.find(
      (p) => String(p.code).trim().toLowerCase() === selectPoliCode.trim().toLowerCase()
    )
    if (found && needsWorkspacePicker(session?.hakAksesId)) {
      setSelectedPoli(found)
      setIsModalOpen(true)
    }
  }, [searchParams, listPoli, session?.hakAksesId])

  const lokasiKerjaNameById = useMemo(() => {
    const entries = (moduleMyData?.result ?? [])
      .map((group) => [group.lokasiKerja.id, group.lokasiKerja.nama] as const)
      .filter((entry) => Number.isFinite(entry[0]) && Boolean(entry[1]))
    return new Map(entries)
  }, [moduleMyData?.result])

  const activeLokasiKerjaLabel = useMemo(() => {
    if (isAdministrator) return 'Semua Lokasi'
    if (!session?.lokasiKerjaId) return 'Lokasi Tidak Diketahui'
    return lokasiKerjaNameById.get(session.lokasiKerjaId) ?? 'Lokasi Tidak Diketahui'
  }, [isAdministrator, lokasiKerjaNameById, session?.lokasiKerjaId])

  const handlePoliClick = (poli: PoliItem) => {
    const normalizedCode = encodeURIComponent(normalizePoliCode(poli.code))

    // Doctor: go directly to Doctor EMR
    if (session?.hakAksesId === 'doctor') {
      const params = new URLSearchParams({
        from: 'poli-select',
        poliCode: normalizePoliCode(poli.code),
        poliName: poli.name
      })
      navigate(`/dashboard/doctor?${params.toString()}`)
      return
    }

    // Nurse: go directly to nurse queue
    if (session?.hakAksesId === 'nurse') {
      navigate(`/dashboard/poli/${normalizedCode}`)
      return
    }

    // All other roles (admin, rekam_medis, etc.): show workspace picker modal
    setSelectedPoli(poli)
    setIsModalOpen(true)
  }

  const handleSelectNurseWorkspace = () => {
    if (!selectedPoli) return
    const normalizedCode = encodeURIComponent(normalizePoliCode(selectedPoli.code))
    navigate(`/dashboard/poli/${normalizedCode}`)
    setIsModalOpen(false)
  }

  const handleSelectDoctorWorkspace = () => {
    if (!selectedPoli) return
    const params = new URLSearchParams({
      from: 'poli-select',
      poliCode: normalizePoliCode(selectedPoli.code),
      poliName: selectedPoli.name
    })
    navigate(`/dashboard/doctor?${params.toString()}`)
    setIsModalOpen(false)
  }

  const showPicker = needsWorkspacePicker(session?.hakAksesId)

  return (
    <div className="flex flex-col gap-4 p-6">
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                <CalendarOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
              </div>
              <h1 className="m-0 text-xl leading-tight font-bold text-white">
                Pilih Unit Layanan / Poli
              </h1>
            </div>
            <p className="m-0 ml-12 text-sm text-blue-200">
              {showPicker
                ? 'Pilih poli untuk memilih workspace (Perawat / Dokter).'
                : 'Silakan pilih poli untuk masuk ke workspace pemeriksaan.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag color="blue" bordered={false} className="m-0 font-medium">
              Lokasi Kerja: {activeLokasiKerjaLabel}
            </Tag>
            <Tag color="geekblue" bordered={false} className="m-0 font-medium">
              Total Poli: {listPoli.length}
            </Tag>
          </div>
        </div>
      </Card>

      <Spin spinning={isLoading}>
        <Row gutter={[16, 16]}>
          {listPoli.map((poli) => (
            <Col xs={24} sm={12} md={8} lg={6} key={poli.id}>
              <Card
                hoverable
                className="group h-full overflow-hidden rounded-2xl border-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                style={{
                  background: `linear-gradient(155deg, ${token.colorBgContainer} 0%, ${token.colorFillAlter} 100%)`
                }}
                onClick={() => handlePoliClick(poli)}
                bodyStyle={{ padding: '22px 20px' }}
              >
                <div className="flex h-full flex-col gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: token.colorPrimaryBg,
                      border: `1px solid ${token.colorPrimaryBorder}`
                    }}
                  >
                    <CalendarOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
                  </div>

                  <div className="min-h-[46px]">
                    <Title
                      level={4}
                      className="mb-0! leading-tight transition-colors group-hover:text-primary"
                    >
                      {poli.name}
                    </Title>
                    <Text type="secondary" className="mt-1 block text-xs uppercase tracking-wider">
                      Poliklinik
                    </Text>
                  </div>

                  <div className="mt-auto pt-1">
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: token.colorSuccessBg,
                        color: token.colorSuccessText,
                        border: `1px solid ${token.colorSuccessBorder}`
                      }}
                    >
                      {showPicker ? 'Pilih Workspace' : 'Masuk Workspace'}
                    </span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      {!isLoading && listPoli.length === 0 && (
        <Card
          styles={{ body: { padding: '48px 24px' } }}
          className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center"
        >
          <Text type="secondary" className="text-lg">
            Tidak ada unit layanan yang tersedia untuk hak akses Anda.
          </Text>
        </Card>
      )}

      {/* Workspace Picker Modal — shown only for admin/rekam_medis/non-clinical roles */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={500}
        title={
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: token.colorText }}>
              Pilih Workspace
            </div>
            <div style={{ fontSize: 13, color: token.colorTextSecondary, fontWeight: 400 }}>
              Poli:{' '}
              <span style={{ fontWeight: 600, color: token.colorPrimary }}>
                {selectedPoli?.name}
              </span>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-3 pt-2">
          <p style={{ color: token.colorTextSecondary, fontSize: 13, margin: 0 }}>
            Pilih workspace yang ingin Anda akses untuk poli ini:
          </p>

          <Row gutter={[16, 16]} className="mt-2">
            {/* Nurse Workspace Card */}
            <Col xs={24} sm={12}>
              <Card
                hoverable
                className="h-full cursor-pointer transition-all duration-200 hover:shadow-md"
                style={{
                  border: `2px solid ${token.colorBorderSecondary}`,
                  borderRadius: 12
                }}
                styles={{ body: { padding: '20px 16px' } }}
                onClick={handleSelectNurseWorkspace}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                      background: token.colorSuccessBg,
                      border: `1.5px solid ${token.colorSuccessBorder}`
                    }}
                  >
                    <TeamOutlined style={{ color: token.colorSuccess, fontSize: 24 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: token.colorText }}>
                      Workspace Perawat
                    </div>
                    <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                      Antrian & pemeriksaan awal pasien
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: token.colorSuccessBg,
                      color: token.colorSuccess,
                      border: `1px solid ${token.colorSuccessBorder}`
                    }}
                  >
                    Masuk
                  </span>
                </div>
              </Card>
            </Col>

            {/* Doctor Workspace Card */}
            <Col xs={24} sm={12}>
              <Card
                hoverable
                className="h-full cursor-pointer transition-all duration-200 hover:shadow-md"
                style={{
                  border: `2px solid ${token.colorBorderSecondary}`,
                  borderRadius: 12
                }}
                styles={{ body: { padding: '20px 16px' } }}
                onClick={handleSelectDoctorWorkspace}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                      background: token.colorPrimaryBg,
                      border: `1.5px solid ${token.colorPrimaryBorder}`
                    }}
                  >
                    <MedicineBoxOutlined style={{ color: token.colorPrimary, fontSize: 24 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: token.colorText }}>
                      Workspace Dokter
                    </div>
                    <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                      EMR & pemeriksaan klinis dokter
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: token.colorPrimaryBg,
                      color: token.colorPrimary,
                      border: `1px solid ${token.colorPrimaryBorder}`
                    }}
                  >
                    Masuk
                  </span>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Modal>
    </div>
  )
}
