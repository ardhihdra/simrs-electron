import { useState, useEffect } from 'react'
import { Card, Button, Input, Form, message, Spin, Switch, App } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const { TextArea } = Input

interface HeadToToeFormProps {
    encounterId: string
    patientId?: string
}

const BODY_PARTS = [
    { key: 'HEAD', label: 'Kepala (Head)' },
    { key: 'EYES', label: 'Mata (Eyes)' },
    { key: 'EARS', label: 'Telinga (Ears)' },
    { key: 'NOSE', label: 'Hidung (Nose)' },
    { key: 'THROAT', label: 'Tenggorokan (Throat)' },
    { key: 'NECK', label: 'Leher (Neck)' },
    { key: 'THORAX', label: 'Dada / Paru / Jantung (Thorax)' },
    { key: 'ABDOMEN', label: 'Perut (Abdomen)' },
    { key: 'EXTREMITIES', label: 'Ekstremitas (Extremities)' },
    { key: 'GENITALIA', label: 'Genitalia' },
    { key: 'NEURO', label: 'Neurologis' },
    { key: 'SKIN', label: 'Kulit (Skin)' },
]

export const HeadToToeForm = ({ encounterId, patientId }: HeadToToeFormProps) => {
    const [form] = Form.useForm()
    const queryClient = useQueryClient()
    const { message: antdMessage } = App.useApp ? App.useApp() : { message } // Fallback if App context missing

    // Fetch existing observations
    const { data: observationData, isLoading } = useQuery({
        queryKey: ['observations', encounterId, 'exam'],
        queryFn: async () => {
            const fn = window.api?.query?.observation?.getByEncounter
            if (!fn) throw new Error('API observation tidak tersedia')
            // We fetch all and filter client side or use specific query if available
            // Assuming getByEncounter returns all observations, we might need to filter by category 'exam'
            const res = await fn({ encounterId })
            // Controller returns { all: [], grouped: {} } or similar
            // We need to handle both cases (array or object with all property)
            if (res.result && !Array.isArray(res.result) && Array.isArray(res.result.all)) {
                return res.result.all
            }
            return Array.isArray(res.result) ? res.result : []
        }
    })

    // Mutation to save
    const saveMutation = useMutation({
        mutationFn: async (observations: any[]) => {
            const fn = window.api?.query?.observation?.create // Using create (bulk) logic logic which we verified in controller
            if (!fn) throw new Error('API observation tidak tersedia')

            // We need patientId to save. 
            // In a real app, we might need to delete old ones or update them. 
            // For now, simpler approach: The backend `create` controller we saw handles creation. 
            // If we want "update", we might need a different strategy or the backend handles it.
            // The controller code I saw performs CREATE. 
            // To avoid duplicates, we might strictly rely on the "latest" being the valid one, 
            // or we should update if ID exists.

            // NOTE: The controller `create.ts` seen earlier strictly does `Observation.create`. 
            // It doesn't update. So we will be creating NEW observations every save.
            // This acts like a history log. The UI will just show the latest one.

            return fn({
                encounterId,
                patientId: patientId || '', // We need patientId. If not passed as prop, we might fail.
                observations
            })
        },
        onSuccess: () => {
            antdMessage.success('Data Pemeriksaan Fisik berhasil disimpan')
            queryClient.invalidateQueries({ queryKey: ['observations', encounterId] })
        },
        onError: (err) => {
            console.error(err)
            antdMessage.error('Gagal menyimpan data')
        }
    })

    // Populate Form
    useEffect(() => {
        if (observationData && Array.isArray(observationData)) {
            const examObservations = observationData.filter((obs: any) =>
                obs.categories?.some((cat: any) => cat.code === 'exam')
            )

            // Create a map of latest values for each body part
            const initialValues: any = {}

            // Sort by date desc to get latest
            examObservations.sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            BODY_PARTS.forEach(part => {
                // Find observation with matching code
                const found = examObservations.find((obs: any) =>
                    obs.codeCoding?.some((coding: any) => coding.code === `EXAM-${part.key}`)
                )

                if (found) {
                    initialValues[part.key] = found.valueString
                    initialValues[`${part.key}_NORMAL`] = found.valueBoolean
                } else {
                    initialValues[`${part.key}_NORMAL`] = true // Default to normal
                }
            })

            form.setFieldsValue(initialValues)
        }
    }, [observationData, form])

    const handleSubmit = async (values: any) => {
        if (!patientId) {
            antdMessage.error('Data pasien tidak lengkap (Missing ID)')
            return
        }

        const observationsToSave: any[] = []

        BODY_PARTS.forEach(part => {
            const textValue = values[part.key]
            const isNormal = values[`${part.key}_NORMAL`]

            // Only save if there is data or if it's explicitly marked abnormal
            // Or we force save everything to have complete record? 
            // Let's save if there's text OR if it is toggled.

            if (textValue || !isNormal) {
                observationsToSave.push({
                    category: 'exam',
                    code: `EXAM-${part.key}`,
                    display: `Physical Exam: ${part.label}`,
                    system: 'http://simrs.local/exam-codes',
                    valueString: textValue || (isNormal ? 'Dalam batas normal' : 'Abnormal'),
                    valueBoolean: isNormal, // We use this to store the toggle state
                    bodySites: [{
                        code: part.key,
                        display: part.label,
                        system: 'http://snomed.info/sct' // dummy system for now
                    }]
                })
            }
        })

        if (observationsToSave.length === 0) {
            antdMessage.info('Tidak ada data perubahan untuk disimpan')
            return
        }

        await saveMutation.mutateAsync(observationsToSave)
    }

    return (
        <div className="h-full flex flex-col">
            <Card
                title="Pemeriksaan Fisik (Head to Toe)"
                extra={
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={() => form.submit()}
                        loading={saveMutation.isPending}
                    >
                        Simpan Pemeriksaan
                    </Button>
                }
                className="h-full flex flex-col"
                bodyStyle={{ flex: 1, overflow: 'auto' }}
            >
                {isLoading ? <div className="text-center p-8"><Spin /></div> : (
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {BODY_PARTS.map(part => (
                                <Card
                                    key={part.key}
                                    size="small"
                                    title={part.label}
                                    className="bg-gray-50 border-gray-200"
                                    extra={
                                        <Form.Item
                                            name={`${part.key}_NORMAL`}
                                            valuePropName="checked"
                                            noStyle
                                            initialValue={true}
                                        >
                                            <Switch
                                                checkedChildren="Normal"
                                                unCheckedChildren="Abnormal"
                                                defaultChecked
                                            />
                                        </Form.Item>
                                    }
                                >
                                    <Form.Item name={part.key} className="mb-0">
                                        <TextArea
                                            rows={2}
                                            placeholder={`Deskripsi hasil pemeriksaan ${part.label}...`}
                                        />
                                    </Form.Item>
                                </Card>
                            ))}
                        </div>
                    </Form>
                )}
            </Card>
        </div>
    )
}
