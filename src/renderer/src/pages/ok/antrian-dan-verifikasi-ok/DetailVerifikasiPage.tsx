import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import dayjs from 'dayjs'
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SaveOutlined
} from '@ant-design/icons'
import { ChecklistPreOpForm } from '../../../components/organisms/OK/ChecklistPreOpForm'
import { SignInForm, TimeOutForm, SignOutForm } from '../../../components/organisms/OK/WHOChecklist'
import {
  ChecklistPostOpForm,
  AdministrasiOKForm,
  TagihanOKView
} from '../../../components/organisms/OK/PostOpForms'
import { useOkRequestList } from '@renderer/hooks/query/use-ok-request'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useOperatingRoomList } from '@renderer/hooks/query/use-operating-room'
import { useEncounterDetail } from '@renderer/hooks/query/use-encounter'

const { Text } = Typography

interface BackendOkRequest {
  id: number
  kode?: string | null
  encounterId?: string | null
  sourceUnit?: string | null
  surgeonId?: number | null
  operatingRoomId?: number | null
  requestedAt?: string | null
  scheduledAt?: string | null
  estimatedDurationMinutes?: number | null
  priority?: string | null
  status?: string | null
  mainDiagnosis?: string | null
  plannedProcedureSummary?: string | null
  createdBy?: number | null
}

interface BHPRow {
  nama: string
  qty: number
  satuan: string
  harga: number
}

interface EncounterDetailResponse {
  result?: {
    patient?: {
      id?: string
      name?: string
      medicalRecordNumber?: string
    }
    patientId?: string
  }
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: 'Menunggu Verifikasi', color: 'orange' },
  verified: { label: 'Disetujui', color: 'green' },
  rejected: { label: 'Ditolak', color: 'red' },
  in_progress: { label: 'Sedang Diproses', color: 'blue' },
  done: { label: 'Selesai', color: 'green' },
  cancelled: { label: 'Dibatalkan', color: 'red' }
}

const formatDate = (value?: string | null): string => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '-'
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY HH:mm') : '-'
}

const formatTimeRange = (startAt?: string | null, durationMinutes?: number | null): string => {
  if (!startAt) return '-'
  const start = dayjs(startAt)
  if (!start.isValid()) return '-'

  if (durationMinutes && durationMinutes > 0) {
    const end = start.add(durationMinutes, 'minute')
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}`
  }

  return start.format('HH:mm')
}

const DetailVerifikasiPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [preOpForm] = Form.useForm()
  const [signInForm] = Form.useForm()
  const [timeOutForm] = Form.useForm()
  const [signOutForm] = Form.useForm()
  const [postOpCheckForm] = Form.useForm()

  const routeId = String(id || '').trim()

  const {
    data: okRequestData,
    isLoading: isLoadingOkRequest,
    isFetching: isFetchingOkRequest,
    error: okRequestError,
    refetch: refetchOkRequest
  } = useOkRequestList()

  const { data: performers } = usePerformers(['doctor'])
  const { data: operatingRooms } = useOperatingRoomList()

  const okRequests = useMemo<BackendOkRequest[]>(() => {
    return Array.isArray(okRequestData) ? (okRequestData as BackendOkRequest[]) : []
  }, [okRequestData])

  const selectedRequest = useMemo(() => {
    if (!routeId) return undefined
    return okRequests.find(
      (item) => String(item.id) === routeId || (item.kode ? item.kode === routeId : false)
    )
  }, [okRequests, routeId])

  const { data: encounterDetailResponse, isLoading: isLoadingEncounter } = useEncounterDetail(
    selectedRequest?.encounterId || undefined
  )

  const performerMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(performers || []).forEach((item) => {
      if (typeof item.id === 'number') map.set(item.id, item.name)
    })
    return map
  }, [performers])

  const operatingRoomMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(operatingRooms || []).forEach((item) => {
      if (typeof item.id === 'number') {
        const label = `${item.nama || 'Ruang OK'}${item.kelas ? ` (${item.kelas})` : ''}`
        map.set(item.id, label)
      }
    })
    return map
  }, [operatingRooms])

  const encounterDetail = (encounterDetailResponse as EncounterDetailResponse | undefined)?.result

  const statusMeta = STATUS_META[selectedRequest?.status || 'draft'] || {
    label: selectedRequest?.status || 'Menunggu Verifikasi',
    color: 'default'
  }

  const bhpRows: BHPRow[] = []
  const bhpTotal = bhpRows.reduce((sum, b) => sum + b.qty * b.harga, 0)

  const displayData = useMemo(() => {
    const rencanaAt = selectedRequest?.scheduledAt || selectedRequest?.requestedAt

    return {
      transaksiId: selectedRequest?.kode || routeId || '-',
      namaPasien: encounterDetail?.patient?.name || '-',
      noRM: encounterDetail?.patient?.medicalRecordNumber || '-',
      kelas: '-',
      tindakan: selectedRequest?.plannedProcedureSummary || selectedRequest?.mainDiagnosis || '-',
      dokterOperator: selectedRequest?.surgeonId
        ? performerMap.get(selectedRequest.surgeonId) || `ID ${selectedRequest.surgeonId}`
        : '-',
      ruangOK: selectedRequest?.operatingRoomId
        ? operatingRoomMap.get(selectedRequest.operatingRoomId) || `Ruang #${selectedRequest.operatingRoomId}`
        : '-',
      tanggalRencana: formatDate(rencanaAt),
      jamRencana: formatTimeRange(rencanaAt, selectedRequest?.estimatedDurationMinutes),
      dibuatPada: formatDateTime(selectedRequest?.requestedAt),
      dibuatOleh: selectedRequest?.createdBy
        ? performerMap.get(selectedRequest.createdBy) || `User ID ${selectedRequest.createdBy}`
        : '-'
    }
  }, [encounterDetail, operatingRoomMap, performerMap, routeId, selectedRequest])

  const isLoadingPage = isLoadingOkRequest || isFetchingOkRequest || isLoadingEncounter
  const errorMessage =
    okRequestError instanceof Error
      ? okRequestError.message
      : okRequestError
        ? 'Gagal memuat data detail verifikasi OK'
        : ''

  const handleSavePreOp = async () => {
    try {
      const values = await preOpForm.validateFields()
      console.log('Saving Pre-Op:', values)
      message.success('Checklist Pre-Op berhasil disimpan')
    } catch {
      message.error('Mohon lengkapi seluruh field wajib di Checklist Pre-Op')
    }
  }

  const handleSaveIntraOp = async () => {
    try {
      const signInValues = await signInForm.validateFields()
      const timeOutValues = await timeOutForm.validateFields()
      console.log('Saving Intra-Op:', { signInValues, timeOutValues })
      message.success('WHO Checklist (Sign-In & Time-Out) berhasil dikonfirmasi')
    } catch {
      message.error('Mohon lengkapi seluruh item WHO Checklist yang wajib diisi')
    }
  }

  const handleSavePostOp = async () => {
    try {
      const signOutValues = await signOutForm.validateFields()
      const postOpValues = await postOpCheckForm.validateFields()
      console.log('Saving Post-Op:', { signOutValues, postOpValues })
      message.success('Data Post-Operasi berhasil disimpan')
    } catch {
      message.error('Mohon lengkapi seluruh field wajib di form Post-Op')
    }
  }

  const tabItems = [
    {
      key: 'verifikasi',
      label: '1. Verifikasi & BHP',
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 gap-4 flex flex-col">
            <Card title="Informasi Pasien & Operasi" className="shadow-none border-gray-100" size="small">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Nama Pasien" span={2}>
                  {displayData.namaPasien}
                </Descriptions.Item>
                <Descriptions.Item label="No. Rekam Medis">{displayData.noRM}</Descriptions.Item>
                <Descriptions.Item label="Kelas Layanan">{displayData.kelas}</Descriptions.Item>
                <Descriptions.Item label="Jenis Tindakan" span={2}>
                  {displayData.tindakan}
                </Descriptions.Item>
                <Descriptions.Item label="Dokter Operator">{displayData.dokterOperator}</Descriptions.Item>
                <Descriptions.Item label="Ruang OK">{displayData.ruangOK}</Descriptions.Item>
                <Descriptions.Item label="Tanggal Rencana">{displayData.tanggalRencana}</Descriptions.Item>
                <Descriptions.Item label="Estimasi Waktu">{displayData.jamRencana}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Daftar Permintaan BHP" className="shadow-none border-gray-100" size="small">
              <Table<BHPRow>
                size="small"
                dataSource={bhpRows}
                rowKey="nama"
                pagination={false}
                locale={{ emptyText: <Empty description="Belum ada data BHP dari backend" /> }}
                columns={[
                  { title: 'Item', dataIndex: 'nama', key: 'nama' },
                  { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
                  { title: 'Satuan', dataIndex: 'satuan', key: 'satuan' },
                  {
                    title: 'Harga',
                    dataIndex: 'harga',
                    key: 'harga',
                    align: 'right',
                    render: (v: number) => `Rp ${v.toLocaleString('id-ID')}`
                  },
                  {
                    title: 'Subtotal',
                    key: 'subtotal',
                    align: 'right',
                    render: (_, r) => `Rp ${(r.qty * r.harga).toLocaleString('id-ID')}`
                  }
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Text strong>Total Estimasi Biaya BHP</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>Rp {bhpTotal.toLocaleString('id-ID')}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Verifikasi Keputusan" className="shadow-none border-gray-100" size="small">
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Setelah disetujui, jadwal akan otomatis masuk ke kalender ruang operasi dan
                  notifikasi akan dikirim ke dokter pengaju.
                </p>
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    block
                    size="large"
                    icon={<CheckCircleOutlined />}
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    Setujui & Jadwalkan
                  </Button>
                  <Button danger block size="large" icon={<CloseCircleOutlined />}>
                    Tolak Pengajuan
                  </Button>
                </Space>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-500">
                  <FileTextOutlined className="mr-1" />
                  Dibuat oleh {displayData.dibuatOleh} pada {displayData.dibuatPada}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'pre-op',
      label: '2. Checklist Pre-Op',
      children: (
        <div className="space-y-6">
          <Form form={preOpForm} layout="vertical">
            <ChecklistPreOpForm standalone={false} externalForm={preOpForm} />
            <div className="flex justify-end mt-6">
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSavePreOp}
                style={{ background: '#3b82f6', border: 'none' }}
              >
                Simpan Seluruh Data Pre-Op
              </Button>
            </div>
          </Form>
        </div>
      )
    },
    {
      key: 'intra-op',
      label: '3. WHO (SignIn + TimeOut)',
      children: (
        <div className="space-y-4">
          <div className="space-y-4">
            <SignInForm standalone={false} externalForm={signInForm} />
            <TimeOutForm standalone={false} externalForm={timeOutForm} />
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSaveIntraOp}
              style={{ background: '#3b82f6', border: 'none' }}
            >
              Simpan WHO Checklist (SignIn + TimeOut)
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'post-op-checklist',
      label: '4. SignOut & Post-Op',
      children: (
        <div className="space-y-4">
          <SignOutForm standalone={false} externalForm={signOutForm} />
          <ChecklistPostOpForm standalone={false} externalForm={postOpCheckForm} />
          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSavePostOp}
              style={{ background: '#3b82f6', border: 'none' }}
            >
              Simpan Sign-Out & Checklist Post-Op
            </Button>
          </div>
        </div>
      )
    },
    {
      key: 'administrasi',
      label: '5. Administrasi & Order',
      children: (
        <div className="space-y-6">
          <AdministrasiOKForm />
        </div>
      )
    },
    {
      key: 'billing',
      label: '6. Billing & Tagihan',
      children: (
        <div className="space-y-6">
          <TagihanOKView />
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard/ok/verifikasi')}
          type="text"
          className="text-gray-500 hover:text-blue-500"
        >
          Kembali ke Daftar Antrian
        </Button>
      </div>

      {isLoadingPage ? (
        <Card className="shadow-none border-gray-100">
          <div className="py-10 flex justify-center">
            <Spin tip="Memuat detail verifikasi OK..." />
          </div>
        </Card>
      ) : errorMessage ? (
        <Card className="shadow-none border-gray-100">
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            action={
              <Button
                size="small"
                onClick={() => {
                  void refetchOkRequest()
                }}
              >
                Muat Ulang
              </Button>
            }
          />
        </Card>
      ) : !selectedRequest ? (
        <Card className="shadow-none border-gray-100">
          <Alert
            type="warning"
            showIcon
            message={`Data pengajuan OK dengan ID ${routeId || '-'} tidak ditemukan.`}
          />
        </Card>
      ) : (
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <FileTextOutlined className="text-blue-500" />
                <span className="text-gray-700 font-bold uppercase tracking-wider text-xs">
                  Detail Transaksi Operasi: {displayData.transaksiId}
                </span>
              </div>
              <Tag color={statusMeta.color} icon={<HistoryOutlined />} className="mr-0">
                Status: {statusMeta.label}
              </Tag>
            </div>
          }
          className="shadow-none border-gray-100 overflow-hidden"
          bodyStyle={{ padding: '0 24px 24px 24px' }}
        >
          <Tabs
            defaultActiveKey="verifikasi"
            items={tabItems}
            size="small"
            className="ok-tabs-custom"
            tabBarStyle={{ marginBottom: 20 }}
          />
        </Card>
      )}

      <style>{`
        .ok-tabs-custom .ant-tabs-tab {
          padding: 12px 0 !important;
          margin-right: 24px !important;
        }
        .ok-tabs-custom .ant-tabs-tab-btn {
          font-weight: 500;
          color: #6b7280;
          font-size: 13px;
        }
        .ok-tabs-custom .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #3b82f6 !important;
        }
        .ok-tabs-custom .ant-tabs-ink-bar {
          height: 3px !important;
          background: #3b82f6 !important;
        }
      `}</style>
    </div>
  )
}

export default DetailVerifikasiPage
