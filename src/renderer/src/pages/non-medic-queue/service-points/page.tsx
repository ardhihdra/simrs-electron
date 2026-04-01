import { EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import {
    Alert,
    App,
    Button,
    Card,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useActiveLokasiKerjaName } from '../useActiveLokasiKerjaName'

type QueueConfigDto = {
    id: number
    lokasiKerjaId: number
    serviceTypeCode: string
    serviceTypeName: string
    queuePrefix: string
    isActive: boolean
}

type ServicePointDto = {
    id: number
    lokasiKerjaId: number
    serviceTypeCode: string
    serviceTypeName: string
    code: string
    name: string
    displayName?: string | null
    isActive: boolean
}

type ServicePointFormValues = {
    serviceTypeCode: string
    code: string
    name: string
    displayName?: string
    isActive: boolean
}

function NonMedicQueueServicePointPage() {
    const { message } = App.useApp()
    const navigate = useNavigate()
    const { lokasiKerjaId, lokasiKerjaName } = useActiveLokasiKerjaName()
    const [selectedServiceTypeCode, setSelectedServiceTypeCode] = useState<string>()
    const [editingRecord, setEditingRecord] = useState<ServicePointDto | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm<ServicePointFormValues>()

    const configQuery = client.nonMedicQueue.getConfigs.useQuery(
        {
            lokasiKerjaId: lokasiKerjaId ?? 0,
            isActive: true,
        },
        {
            enabled: Boolean(lokasiKerjaId),
            queryKey: [
                'nonMedicQueue.configs',
                {
                    lokasiKerjaId: lokasiKerjaId ?? 0,
                    isActive: true,
                },
            ],
        }
    )

    const servicePointQuery = client.nonMedicQueue.getServicePoints.useQuery(
        {
            lokasiKerjaId: lokasiKerjaId ?? 0,
            serviceTypeCode: selectedServiceTypeCode,
        },
        {
            enabled: Boolean(lokasiKerjaId),
            queryKey: [
                'nonMedicQueue.servicePoints',
                {
                    lokasiKerjaId: lokasiKerjaId ?? 0,
                    serviceTypeCode: selectedServiceTypeCode ?? '',
                },
            ],
        }
    )

    const createServicePointMutation = client.nonMedicQueue.createServicePoint.useMutation()
    const updateServicePointMutation = client.nonMedicQueue.updateServicePoint.useMutation()

    const availableConfigs = ((configQuery.data?.result as QueueConfigDto[] | undefined) ?? []).filter(
        (item) => item.isActive
    )
    const availableServiceTypes = useMemo(() => {
        const map = new Map<string, QueueConfigDto>()
        for (const config of availableConfigs) {
            if (!map.has(config.serviceTypeCode)) {
                map.set(config.serviceTypeCode, config)
            }
        }
        return Array.from(map.values())
    }, [availableConfigs])

    useEffect(() => {
        if (!availableServiceTypes.length) {
            setSelectedServiceTypeCode(undefined)
            return
        }

        if (!selectedServiceTypeCode || !availableServiceTypes.some((item) => item.serviceTypeCode === selectedServiceTypeCode)) {
            setSelectedServiceTypeCode(availableServiceTypes[0]?.serviceTypeCode)
        }
    }, [availableServiceTypes, selectedServiceTypeCode])

    useEffect(() => {
        if (isModalOpen && !editingRecord && availableServiceTypes.length > 0) {
            form.setFieldsValue({
                serviceTypeCode: availableServiceTypes[0]?.serviceTypeCode,
                isActive: true,
            })
        }
    }, [availableServiceTypes, editingRecord, form, isModalOpen])

    const dataSource = (servicePointQuery.data?.result as ServicePointDto[] | undefined) ?? []

    const columns: ColumnsType<ServicePointDto> = [
        {
            title: 'Service Type',
            dataIndex: 'serviceTypeName',
            key: 'serviceTypeName',
            render: (_value, record) => <Tag color="blue">{record.serviceTypeCode}</Tag>,
        },
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Nama',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Display Name',
            dataIndex: 'displayName',
            key: 'displayName',
            render: (value?: string | null) => value ?? '-',
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? 'ACTIVE' : 'INACTIVE'}</Tag>,
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space wrap>
                    <Button
                        onClick={() => navigate(`/dashboard/non-medic-queue/service-points/${record.id}/workspace`)}
                    >
                        Buka Counter
                    </Button>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingRecord(record)
                            setIsModalOpen(true)
                            form.setFieldsValue({
                                serviceTypeCode: record.serviceTypeCode,
                                code: record.code,
                                name: record.name,
                                displayName: record.displayName ?? undefined,
                                isActive: record.isActive,
                            })
                        }}
                    >
                        Edit
                    </Button>
                </Space>
            ),
        },
    ]

    async function handleSubmit(values: ServicePointFormValues) {
        if (!lokasiKerjaId) {
            message.error('Lokasi kerja aktif belum tersedia.')
            return
        }

        try {
            if (editingRecord) {
                await updateServicePointMutation.mutateAsync({
                    id: editingRecord.id,
                    lokasiKerjaId,
                    serviceTypeCode: values.serviceTypeCode,
                    code: values.code,
                    name: values.name,
                    displayName: values.displayName,
                    isActive: values.isActive,
                })
                message.success('Service point berhasil diperbarui.')
            } else {
                await createServicePointMutation.mutateAsync({
                    lokasiKerjaId,
                    serviceTypeCode: values.serviceTypeCode,
                    code: values.code,
                    name: values.name,
                    displayName: values.displayName,
                    isActive: values.isActive,
                })
                message.success('Service point berhasil dibuat.')
            }

            setIsModalOpen(false)
            setEditingRecord(null)
            form.resetFields()
            await servicePointQuery.refetch()
        } catch (error: any) {
            message.error(error?.message ?? 'Gagal menyimpan service point.')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <Typography.Title level={2} style={{ marginBottom: 0 }}>
                        Service Point Antrian Non-Medis
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Kelola counter per service type untuk lokasi kerja aktif.
                    </Typography.Paragraph>
                    <Typography.Text type="secondary">
                        Lokasi aktif: {lokasiKerjaName}
                    </Typography.Text>
                </div>

                <Space wrap>
                    <Select
                        placeholder="Pilih service type"
                        value={selectedServiceTypeCode}
                        onChange={setSelectedServiceTypeCode}
                        options={availableServiceTypes.map((item) => ({
                            label: `${item.serviceTypeName} (${item.queuePrefix})`,
                            value: item.serviceTypeCode,
                        }))}
                        style={{ minWidth: 220 }}
                        disabled={!availableServiceTypes.length}
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                            void configQuery.refetch()
                            void servicePointQuery.refetch()
                        }}
                        loading={configQuery.isFetching || servicePointQuery.isFetching}
                        disabled={!lokasiKerjaId}
                    >
                        Refresh
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingRecord(null)
                            form.resetFields()
                            setIsModalOpen(true)
                        }}
                        disabled={!lokasiKerjaId || !availableServiceTypes.length}
                    >
                        Tambah Service Point
                    </Button>
                </Space>
            </div>

            {!lokasiKerjaId ? (
                <Alert
                    type="error"
                    showIcon
                    message="Lokasi kerja aktif belum ditemukan. Pilih module scope dengan lokasi kerja terlebih dahulu."
                />
            ) : null}

            {lokasiKerjaId && !availableServiceTypes.length ? (
                <Alert
                    type="warning"
                    showIcon
                    message="Belum ada config antrian aktif untuk lokasi kerja ini, sehingga service point belum bisa dikelola."
                />
            ) : null}

            <Card title="Daftar Service Point">
                <Table<ServicePointDto>
                    rowKey="id"
                    columns={columns}
                    dataSource={dataSource}
                    loading={servicePointQuery.isLoading}
                    pagination={false}
                    locale={{ emptyText: 'Belum ada service point untuk filter yang dipilih.' }}
                />
            </Card>

            <Modal
                title={editingRecord ? 'Edit Service Point' : 'Tambah Service Point'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false)
                    setEditingRecord(null)
                    form.resetFields()
                }}
                onOk={() => form.submit()}
                okText={editingRecord ? 'Simpan Perubahan' : 'Buat Service Point'}
                confirmLoading={createServicePointMutation.isPending || updateServicePointMutation.isPending}
            >
                <Form<ServicePointFormValues>
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ isActive: true }}
                >
                    <Form.Item
                        name="serviceTypeCode"
                        label="Service Type"
                        rules={[{ required: true, message: 'Service type wajib dipilih.' }]}
                    >
                        <Select
                            options={availableServiceTypes.map((item) => ({
                                label: `${item.serviceTypeName} (${item.queuePrefix})`,
                                value: item.serviceTypeCode,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="code"
                        label="Code"
                        rules={[{ required: true, message: 'Code wajib diisi.' }]}
                    >
                        <Input placeholder="Contoh: BILLING-1" />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Nama"
                        rules={[{ required: true, message: 'Nama wajib diisi.' }]}
                    >
                        <Input placeholder="Contoh: Billing 1" />
                    </Form.Item>
                    <Form.Item name="displayName" label="Display Name">
                        <Input placeholder="Contoh: Billing Counter 1" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Aktif" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default NonMedicQueueServicePointPage
