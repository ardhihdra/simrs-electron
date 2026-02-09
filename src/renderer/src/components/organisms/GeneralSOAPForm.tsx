import { useState, useEffect } from 'react'
import {
    Form,
    Input,
    Button,
    Card,
    App,
    Spin,
    Tag,
    Space,
    Avatar,
    Modal,
    Table,
    Tooltip,
    InputNumber
} from 'antd'
import {
    SaveOutlined,
    PlusOutlined,
    UserOutlined,
    HistoryOutlined,
    CheckCircleOutlined,
    CopyOutlined,
    FormOutlined
} from '@ant-design/icons'
import { useCompositionByEncounter, useUpsertComposition } from '../../hooks/query/use-composition'
import { useObservationByEncounter } from '../../hooks/query/use-observation'
import { formatObservationSummary } from '../../utils/observation-helpers'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import { COMPOSITION_STATUS_MAP, COMPOSITION_STATUS_COLOR_MAP } from '../../config/composition-maps'
import { AssessmentHeader } from './Assessment/AssessmentHeader'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

const { TextArea } = Input

interface GeneralSOAPFormProps {
    encounterId: string
    patientData: PatientWithMedicalRecord
    onSaveSuccess?: () => void
    showTTVSection?: boolean
    allowedRoles?: ('doctor' | 'nurse')[]
}

export const GeneralSOAPForm = ({ encounterId, patientData, onSaveSuccess, showTTVSection = true, allowedRoles }: GeneralSOAPFormProps) => {
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [hasFinalEntry, setHasFinalEntry] = useState(false)
    const [draftEntry, setDraftEntry] = useState<any>(null)
    const [editingId, setEditingId] = useState<number | null>(null)

    const { data: compositionData, isLoading, refetch } = useCompositionByEncounter(encounterId)
    const { data: obsData } = useObservationByEncounter(encounterId)
    const upsertMutation = useUpsertComposition()

    const { data: performersData, isLoading: isLoadingPerformers } = useQuery({
        queryKey: ['kepegawaian', 'list', 'all'],
        queryFn: async () => {
            const fn = window.api?.query?.kepegawaian?.list
            if (!fn) throw new Error('API kepegawaian tidak tersedia')
            const res = await fn()
            if (res.success && res.result) {
                let filtered = res.result.filter((p: any) => p.hakAksesId === 'doctor' || p.hakAksesId === 'nurse')

                if (allowedRoles && allowedRoles.length > 0) {
                    filtered = filtered.filter((p: any) => allowedRoles.includes(p.hakAksesId))
                }

                return filtered.map((p: any) => ({
                    id: p.id,
                    name: p.namaLengkap,
                    role: p.hakAksesId
                }))
            }
            return []
        }
    })

    const selectedPerformerId = Form.useWatch('performerId', form)
    const selectedPerformer = performersData?.find((p: any) => p.id === selectedPerformerId)
    const currentRole = selectedPerformer?.role

    const handleSubmit = async (values: any) => {
        try {
            if (currentRole === 'doctor' && values.status === 'final') {
                if (!values.soapAssessment || !values.soapPlan) {
                    message.error('Dokter harus mengisi Assessment dan Plan untuk finalisasi')
                    return
                }
            }

            const payload: any = {
                encounterId,
                patientId: patientData.patient.id,
                doctorId: Number(values.performerId),
                title: 'SOAP Umum',
                soapSubjective: values.soapSubjective,
                soapObjective: values.soapObjective,
                soapAssessment: values.soapAssessment,
                soapPlan: values.soapPlan,
                status: values.status,
                issued: values.assessment_date ? values.assessment_date.toISOString() : undefined
            }

            if (editingId) {
                payload.id = editingId
            }

            await upsertMutation.mutateAsync(payload)

            const statusMsg = values.status === 'final' ? 'Final' : 'Draft'
            const roleMsg = currentRole === 'nurse' ? 'Perawat' : 'Dokter'
            const actionMsg = editingId ? 'diupdate' : 'disimpan'
            message.success(`SOAP Umum berhasil ${actionMsg} oleh ${roleMsg} (${statusMsg})`)
            form.resetFields()
            setIsAddingNew(false)
            setEditingId(null)
            refetch()
            onSaveSuccess?.()
        } catch (error) {
            console.error('Error saving SOAP:', error)
            message.error('Gagal menyimpan SOAP Umum')
        }
    }

    const handleFetchVitals = () => {
        if (!obsData?.result?.all) {
            message.warning('Tidak ada data TTV ditemukan')
            return
        }

        const rawObs = obsData?.result?.all || []
        const sortedObs = [...rawObs].sort(
            (a: any, b: any) =>
                dayjs(b.effectiveDateTime || b.issued).valueOf() -
                dayjs(a.effectiveDateTime || a.issued).valueOf()
        )

        const summary = formatObservationSummary(sortedObs, [])
        const { vitalSigns, physicalExamination } = summary

        form.setFieldsValue({
            systolic: vitalSigns.systolicBloodPressure,
            diastolic: vitalSigns.diastolicBloodPressure,
            heartRate: vitalSigns.pulseRate,
            respRate: vitalSigns.respiratoryRate,
            temperature: vitalSigns.temperature,
            consciousness: physicalExamination.consciousness,
            gcs_e: summary.vitalSigns?.gcsEye,
            gcs_v: summary.vitalSigns?.gcsVerbal,
            gcs_m: summary.vitalSigns?.gcsMotor,
            gcs:
                (summary.vitalSigns?.gcsEye || 0) +
                (summary.vitalSigns?.gcsVerbal || 0) +
                (summary.vitalSigns?.gcsMotor || 0) || undefined
        })

        const vitalsParts: string[] = []

        if (vitalSigns.systolicBloodPressure && vitalSigns.diastolicBloodPressure) {
            vitalsParts.push(`TD: ${vitalSigns.systolicBloodPressure}/${vitalSigns.diastolicBloodPressure} mmHg`)
        }
        if (vitalSigns.pulseRate) vitalsParts.push(`N: ${vitalSigns.pulseRate} x/m`)
        if (vitalSigns.respiratoryRate) vitalsParts.push(`RR: ${vitalSigns.respiratoryRate} x/m`)
        if (vitalSigns.temperature) vitalsParts.push(`S: ${vitalSigns.temperature} °C`)

        const observations = obsData?.result?.all || []
        const findObs = (code: string) => observations.find((o: any) => o.code === code)
        const gcsEye = findObs('9267-5')?.valueQuantity?.value
        const gcsVerbal = findObs('9270-9')?.valueQuantity?.value
        const gcsMotor = findObs('9268-3')?.valueQuantity?.value

        if (gcsEye || gcsVerbal || gcsMotor) {
            const total = (gcsEye || 0) + (gcsVerbal || 0) + (gcsMotor || 0)
            vitalsParts.push(`GCS: E${gcsEye || '-'}V${gcsVerbal || '-'}M${gcsMotor || '-'} (${total})`)
        }

        if (physicalExamination.consciousness) {
            vitalsParts.push(`Kesadaran: ${physicalExamination.consciousness}`)
        }

        if (vitalsParts.length === 0) {
            message.warning('Data TTV kosong')
            return
        }

        const ttvString = `[TTV] ${vitalsParts.join(' | ')} [/TTV]`
        const currentObjective = form.getFieldValue('soapObjective') || ''
        const cleanObjective = currentObjective.replace(/\[TTV\].*?\[\/TTV\]/s, '').trim()

        form.setFieldValue('soapObjective', `${ttvString}\n\n${cleanObjective}`.trim())
        message.success('Data TTV berhasil diambil ke kolom Objective')
    }

    const parseVitals = (text: string) => {
        const match = text.match(/\[TTV\](.*?)\[\/TTV\]/s)
        if (match) {
            const vitalsText = match[1]
            const remainingText = text.replace(/\[TTV\](.*?)\[\/TTV\]/s, '').trim()

            const tags = vitalsText
                .split('|')
                .map((v) => v.trim())
                .map((v, i) => {
                    let color = 'blue'
                    if (v.startsWith('TD:')) color = 'geekblue'
                    if (v.startsWith('N:')) color = 'green'
                    if (v.startsWith('RR:')) color = 'cyan'
                    if (v.startsWith('S:')) color = 'orange'
                    if (v.startsWith('GCS:') || v.startsWith('Kesadaran:')) color = 'purple'

                    return (
                        <Tag key={i} color={color} className="mr-1 mb-1">
                            {v}
                        </Tag>
                    )
                })

            return { tags, remainingText }
        }
        return { tags: null, remainingText: text }
    }

    const handleEdit = (record: any) => {
        const { remainingText } = parseVitals(record.soapObjective || '')
        form.setFieldsValue({
            performerId: record.authorId?.[0] || undefined,
            soapSubjective: record.soapSubjective,
            soapObjective: remainingText,
            soapAssessment: record.soapAssessment,
            soapPlan: record.soapPlan,
            status: record.status
        })

        form.setFieldValue('soapObjective', record.soapObjective)

        setEditingId(record.id)
        setIsAddingNew(true)
    }

    const handleVerify = async (record: any) => {
        try {
            if (record.status === 'final') return

            await upsertMutation.mutateAsync({
                encounterId,
                patientId: patientData.patient.id,
                doctorId: 1,
                ...record,
                status: 'final',
                title: record.title || 'SOAP Umum',
                soapSubjective: record.soapSubjective,
                soapObjective: record.soapObjective,
                soapAssessment: record.soapAssessment,
                soapPlan: record.soapPlan
            })

            message.success('SOAP Umum berhasil diverifikasi (Final)')
            refetch()
        } catch (error) {
            console.error('Verification failed', error)
            message.error('Gagal verifikasi')
        }
    }

    const columns = [
        {
            title: 'No',
            key: 'no',
            width: 50,
            render: (_: any, __: any, index: number) => index + 1
        },
        {
            title: 'Tgl / Jam',
            dataIndex: 'date',
            key: 'date',
            width: 120,
            render: (date: string) => (
                <div className="flex flex-col">
                    <span className="font-semibold">{dayjs(date).format('DD/MM/YY')}</span>
                    <span className="text-gray-500 text-xs">{dayjs(date).format('HH:mm')}</span>
                </div>
            )
        },
        {
            title: 'PPA',
            key: 'ppa',
            width: 180,
            render: (_: any, record: any) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        icon={<UserOutlined />}
                        src={record.authorAvatar}
                        className="bg-blue-100 text-blue-600"
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-sm">
                            {record.authorName || 'PPA'}
                        </span>
                        <span className="text-gray-500 text-xs">{record.role || 'Dokter/Perawat'}</span>
                    </div>
                </div>
            )
        },
        {
            title: 'SOAP',
            key: 'soap',
            render: (_: any, record: any) => {
                const { tags, remainingText } = parseVitals(record.soapObjective || '')
                return (
                    <div className="flex flex-col gap-3 text-sm">
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-400 w-4">S:</span>
                            <div className="flex-1 whitespace-pre-wrap">{record.soapSubjective || '-'}</div>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-400 w-4">O:</span>
                            <div className="flex-1">
                                {tags && <div className="mb-2">{tags}</div>}
                                <div className="whitespace-pre-wrap">{remainingText || '-'}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-400 w-4">A:</span>
                            <div className="flex-1 whitespace-pre-wrap">{record.soapAssessment || '-'}</div>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-yellow-600 w-4">P:</span>
                            <div className="flex-1 whitespace-pre-wrap">{record.soapPlan || '-'}</div>
                        </div>
                    </div>
                )
            }
        },
        {
            title: 'Status',
            key: 'verification',
            width: 120,
            render: (_: any, record: any) => (
                <div className="flex flex-col gap-2 items-center">
                    {record.status !== 'final' && (
                        <Space>
                            <Tooltip title="Edit SOAP">
                                <Button
                                    type="text"
                                    shape="circle"
                                    onClick={() => handleEdit(record)}
                                    icon={<FormOutlined className="text-blue-500 text-lg" />}
                                />
                            </Tooltip>
                            <Tooltip title="Verifikasi">
                                <Button
                                    type="text"
                                    shape="circle"
                                    onClick={() => handleVerify(record)}
                                    icon={
                                        <CheckCircleOutlined className="text-gray-300 hover:text-green-500 text-lg transition-colors" />
                                    }
                                />
                            </Tooltip>
                        </Space>
                    )}

                    {record.status === 'final' && <CheckCircleOutlined className="text-green-500 text-lg" />}

                    <Tag color={COMPOSITION_STATUS_COLOR_MAP[record.status || 'preliminary']}>
                        {COMPOSITION_STATUS_MAP[record.status?.toLowerCase() || 'preliminary']}
                    </Tag>
                </div>
            )
        }
    ]

    useEffect(() => {
        const soapEntries = (compositionData?.result || []).filter(
            (comp: any) => comp.title === 'SOAP Umum'
        )
        const finalEntry = soapEntries.find((entry: any) => entry.status === 'final')
        setHasFinalEntry(!!finalEntry)

        const draft = soapEntries.find((entry: any) => entry.status === 'preliminary')
        setDraftEntry(draft || null)
    }, [compositionData])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spin size="large" tip="Memuat SOAP Umum..." />
            </div>
        )
    }

    // Filter hanya SOAP Umum (bukan CPPT)
    const soapHistory = (compositionData?.result || []).filter(
        (comp: any) => comp.title === 'SOAP Umum'
    )

    return (
        <div className="flex flex-col gap-6">
            <Card
                title={
                    <Space>
                        <HistoryOutlined /> SOAP Umum - Kolaboratif Perawat & Dokter
                    </Space>
                }
                extra={
                    <>
                        {/* {hasFinalEntry && (
                            <Alert
                                message="SOAP Umum Sudah Final"
                                description="SOAP Umum untuk encounter ini sudah difinalisasi. Untuk catatan berkelanjutan, gunakan CPPT."
                                type="info"
                                showIcon
                                className="mb-0"
                                style={{ maxWidth: 400 }}
                            />
                        )} */}
                        {!hasFinalEntry && !draftEntry && (
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddingNew(true)}>
                                Tambah SOAP
                            </Button>
                        )}
                        {/* {draftEntry && !hasFinalEntry && (
                            <Alert
                                message="Ada Draft SOAP"
                                description="Silakan edit atau finalisasi draft yang ada di tabel di bawah."
                                type="warning"
                                showIcon
                                className="mb-0"
                                style={{ maxWidth: 400 }}
                            />
                        )} */}
                    </>
                }
                className='rounded-none!'
            >
                <Table
                    columns={columns}
                    dataSource={soapHistory}
                    rowKey="id"
                    pagination={false}
                    className="border-none"
                    locale={{
                        emptyText: 'Belum ada data SOAP Umum'
                    }}
                />
            </Card>

            <Modal
                title={editingId ? "Edit SOAP Umum" : "Input SOAP Umum"}
                open={isAddingNew}
                onCancel={() => {
                    setIsAddingNew(false)
                    setEditingId(null)
                    form.resetFields()
                }}
                footer={[
                    <Button key="back" onClick={() => {
                        setIsAddingNew(false)
                        setEditingId(null)
                        form.resetFields()
                    }}>
                        Batal
                    </Button>,
                    <Button
                        key="draft"
                        icon={<SaveOutlined />}
                        loading={upsertMutation.isPending}
                        onClick={() => {
                            form.setFieldValue('status', 'preliminary')
                            form.submit()
                        }}
                    >
                        Simpan Draft
                    </Button>,
                    currentRole === 'doctor' && (
                        <Button
                            key="submit"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={upsertMutation.isPending}
                            onClick={() => {
                                form.setFieldValue('status', 'final')
                                form.submit()
                            }}
                        >
                            Simpan & Finalisasi
                        </Button>
                    )
                ]}
                width={900}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-4">
                    <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

                    {/* {currentRole === 'nurse' && (
                        <Alert
                            message="Info untuk Perawat"
                            description="Anda dapat mengisi Subjective (keluhan utama) dan Objective (TTV). Assessment dan Plan akan dilengkapi oleh dokter."
                            type="info"
                            icon={<InfoCircleOutlined />}
                            showIcon
                            className="mb-4"
                        />
                    )}

                    {currentRole === 'doctor' && (
                        <Alert
                            message="Info untuk Dokter"
                            description="Anda dapat melengkapi data dari perawat atau mengisi langsung semua field SOAP. Assessment dan Plan wajib diisi untuk finalisasi."
                            type="success"
                            icon={<InfoCircleOutlined />}
                            showIcon
                            className="mb-4"
                        />
                    )} */}

                    {showTTVSection && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6 mt-4">
                            <div className="flex justify-between items-center mb-4 border-b border-blue-200 pb-2">
                                <div className="font-bold text-blue-700 uppercase text-xs tracking-wider">
                                    Data Tanda-Tanda Vital (Dari Monitoring)
                                </div>
                                <Button
                                    type="primary"
                                    ghost
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={handleFetchVitals}
                                >
                                    Ambil Data TTV Terakhir
                                </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                                <Form.Item label="Tekanan Darah" style={{ marginBottom: 0 }}>
                                    <Space align="start" className="w-full">
                                        <Form.Item name="systolic" noStyle>
                                            <InputNumber placeholder="-" className="w-[80px]" readOnly disabled />
                                        </Form.Item>
                                        <span className="text-gray-400 font-light text-lg">/</span>
                                        <Form.Item name="diastolic" noStyle>
                                            <InputNumber placeholder="-" className="w-[80px]" readOnly disabled />
                                        </Form.Item>
                                        <span className="text-gray-500 text-xs mt-1">mmHg</span>
                                    </Space>
                                </Form.Item>

                                <Form.Item label="Nadi" name="heartRate" className="mb-0">
                                    <InputNumber className="w-full" placeholder="-" addonAfter="x/mnt" readOnly disabled />
                                </Form.Item>

                                <Form.Item label="Laju Pernafasan (RR)" name="respRate" className="mb-0">
                                    <InputNumber className="w-full" placeholder="-" addonAfter="x/mnt" readOnly disabled />
                                </Form.Item>

                                <Form.Item label="Suhu Tubuh" name="temperature" className="mb-0">
                                    <InputNumber className="w-full" placeholder="-" addonAfter="°C" readOnly disabled />
                                </Form.Item>

                                <Form.Item label="GCS (Total)" name="gcs" className="mb-0">
                                    <Input className="w-full" placeholder="-" readOnly disabled />
                                </Form.Item>

                                <Form.Item label="Kesadaran" name="consciousness" className="mb-0">
                                    <Input className="w-full" placeholder="-" readOnly disabled />
                                </Form.Item>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Form.Item
                                name="soapSubjective"
                                label={<span className="font-bold text-gray-700">Subjective (S) - Keluhan Utama</span>}
                                rules={[{ required: true, message: 'Wajib diisi' }]}
                                extra={currentRole === 'nurse' ? 'Isi keluhan utama pasien' : 'Keluhan utama dan riwayat penyakit'}
                            >
                                <TextArea
                                    rows={5}
                                    placeholder="Contoh: Pasien mengeluh nyeri kepala sejak 2 hari yang lalu..."
                                />
                            </Form.Item>

                            <Form.Item
                                name="soapObjective"
                                label={<span className="font-bold text-gray-700">Objective (O) - Pemeriksaan</span>}
                                rules={[{ required: currentRole === 'nurse', message: 'Wajib diisi untuk perawat' }]}
                                extra="Hasil pemeriksaan fisik dan TTV"
                            >
                                <TextArea
                                    rows={5}
                                    placeholder="Gunakan tombol 'Ambil Data TTV' atau isi manual..."
                                />
                            </Form.Item>
                        </div>

                        <div className="space-y-4">
                            <Form.Item
                                name="soapAssessment"
                                label={<span className="font-bold text-gray-700">Assessment (A) - Diagnosis</span>}
                                rules={[
                                    {
                                        required: currentRole === 'doctor',
                                        message: 'Wajib diisi oleh dokter untuk finalisasi'
                                    }
                                ]}
                                extra={currentRole === 'nurse' ? 'Opsional - akan diisi dokter' : 'Diagnosis kerja dan diagnosis banding'}
                            >
                                <TextArea
                                    rows={5}
                                    placeholder={
                                        currentRole === 'nurse'
                                            ? '(Akan diisi oleh dokter)'
                                            : 'Contoh: Tension Headache, Hipertensi Grade I...'
                                    }
                                    disabled={currentRole === 'nurse'}
                                />
                            </Form.Item>

                            <Form.Item
                                name="soapPlan"
                                label={<span className="font-bold text-gray-700">Plan (P) - Rencana Terapi</span>}
                                rules={[
                                    {
                                        required: currentRole === 'doctor',
                                        message: 'Wajib diisi oleh dokter untuk finalisasi'
                                    }
                                ]}
                                extra={currentRole === 'nurse' ? 'Opsional - akan diisi dokter' : 'Rencana pengobatan dan edukasi'}
                            >
                                <TextArea
                                    rows={5}
                                    placeholder={
                                        currentRole === 'nurse'
                                            ? '(Akan diisi oleh dokter)'
                                            : 'Contoh: Paracetamol 3x500mg, Kontrol 3 hari...'
                                    }
                                    disabled={currentRole === 'nurse'}
                                />
                            </Form.Item>
                        </div>
                    </div>
                    <Form.Item name="status" hidden>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
