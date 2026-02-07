import { Button, DatePicker, Form, Input, Modal, Select, Timeline, Typography, App } from 'antd';
import { Content } from 'antd/es/layout/layout';
import dayjs from 'dayjs';
import { useMemo, useState, useEffect } from 'react';
import { useBulkCreateObservation, useObservationByEncounter } from '@renderer/hooks/query/use-observation';
import { mapDentalDataToObservationPayload } from './dental-mapper';
import { transformObservationsToTimeline } from '@renderer/config/observation-maps';
import { ToothDetail } from './type';
import Odontogram from './Odontogram';
import { TimelineContent } from './TimelineContent';

export interface TimelineContentProps {
    date: string;
    treatment: string;
    condition: string;
    dentist: string;
    tooth: ToothDetail[];
    status: 'done' | 'pending';
    notes?: string;
}

interface DentalPageProps {
    encounterId?: string;
    patientId?: string;
    performerId?: string;
    performerName?: string;
    onSaveSuccess?: () => void;
}

const DentalPage = ({
    encounterId,
    patientId,
    performerId,
    performerName,
    onSaveSuccess
}: DentalPageProps = {}) => {
    const { message } = App.useApp();
    const { mutateAsync: saveToDB, isPending: isSaving } = useBulkCreateObservation();
    const { data: observationData } = useObservationByEncounter(encounterId);

    const [selected, setSelected] = useState<TimelineContentProps[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingTeeth, setPendingTeeth] = useState<ToothDetail[]>([]);
    const [lastFormValues, setLastFormValues] = useState<{
        date: any;
        treatment: string;
        condition: string;
        dentist: string;
        status: 'done' | 'pending';
        notes?: string;
    } | null>(null);
    const [form] = Form.useForm<{
        date: any;
        treatment: string;
        condition: string;
        dentist: string;
        status: 'done' | 'pending';
        notes?: string;
    }>();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [odontoKey, setOdontoKey] = useState<number>(0);
    const [hoveredTeeth, setHoveredTeeth] = useState<ToothDetail[]>([]);

    useEffect(() => {
        if (observationData?.result?.all && observationData.result.all.length > 0) {
            const timelineData = transformObservationsToTimeline(observationData.result.all);
            setSelected(timelineData);
        }
    }, [observationData]);

    const handleChange = (props: ToothDetail[]) => {
        setPendingTeeth(props);
        if (props.length === 0) return;
        if (lastFormValues) {
            form.setFieldsValue(lastFormValues);
        }

        setIsModalOpen(true);
    };

    const pendingToothIds = useMemo(() => pendingTeeth.map((t) => t.id).join(', '), [pendingTeeth]);

    const onSubmit = async () => {
        try {
            const values = await form.validateFields();
            const dateStr = dayjs(values.date).isValid()
                ? dayjs(values.date).format('DD-MM-YYYY')
                : String(values.date ?? '01-01-2023');

            if (encounterId && patientId && pendingTeeth.length > 0) {
                const dentalData = {
                    date: values.date,
                    treatment: values.treatment,
                    condition: values.condition,
                    dentist: values.dentist,
                    tooth: pendingTeeth,
                    status: values.status,
                    notes: values.notes
                };

                const payload = mapDentalDataToObservationPayload(
                    dentalData,
                    encounterId,
                    patientId,
                    {
                        id: performerId || 'unknown',
                        name: performerName || values.dentist,
                        role: 'Doctor'
                    }
                );

                await saveToDB(payload);
                message.success(`Berhasil menyimpan ${pendingTeeth.length} pemeriksaan gigi`);
                onSaveSuccess?.();
            }

            setSelected((prev) => {
                const next = [...prev];

                if (editingIndex !== null) {
                    const original = next[editingIndex];
                    const mergedToothMap = new Map<string, ToothDetail>();
                    original.tooth.forEach((t) => mergedToothMap.set(t.id, t));
                    pendingTeeth.forEach((t) => mergedToothMap.set(t.id, t));
                    const mergedTeeth = Array.from(mergedToothMap.values());

                    const updated: TimelineContentProps = {
                        date: dateStr,
                        treatment: values.treatment,
                        condition: values.condition,
                        dentist: values.dentist,
                        tooth: mergedTeeth,
                        status: values.status,
                        notes: values.notes,
                    };

                    const targetIdx = next.findIndex((p, i) => p.date === dateStr && i !== editingIndex);
                    if (targetIdx >= 0) {
                        const mergeMap = new Map<string, ToothDetail>();
                        next[targetIdx].tooth.forEach((t) => mergeMap.set(t.id, t));
                        updated.tooth.forEach((t) => mergeMap.set(t.id, t));
                        next[targetIdx] = {
                            ...next[targetIdx],
                            ...updated,
                            tooth: Array.from(mergeMap.values()),
                        };
                        next.splice(editingIndex, 1);
                    } else {
                        next[editingIndex] = updated;
                    }
                    return next;
                }

                const idx = next.findIndex((p) => p.date === dateStr);
                if (idx >= 0) {
                    const existing = next[idx];
                    const mergedToothMap = new Map<string, ToothDetail>();
                    existing.tooth.forEach((t) => mergedToothMap.set(t.id, t));
                    pendingTeeth.forEach((t) => mergedToothMap.set(t.id, t));
                    const mergedTeeth = Array.from(mergedToothMap.values());
                    next[idx] = { ...existing, tooth: mergedTeeth };
                    return next;
                }

                const newEntry: TimelineContentProps = {
                    date: dateStr,
                    treatment: values.treatment,
                    condition: values.condition,
                    dentist: values.dentist,
                    tooth: pendingTeeth,
                    status: values.status,
                    notes: values.notes,
                };
                next.push(newEntry);
                return next;
            });

            setLastFormValues({
                date: values.date,
                treatment: values.treatment,
                condition: values.condition,
                dentist: values.dentist,
                status: values.status,
                notes: values.notes
            });

            setIsModalOpen(false);
            form.resetFields();
            setEditingIndex(null);
            setPendingTeeth([]);
            setOdontoKey((k) => k + 1);
        } catch (error: any) {
            console.error('Error saving dental data:', error);
            message.error(error?.message || 'Gagal menyimpan data pemeriksaan gigi');
        }
    };

    const onCancel = () => {
        setIsModalOpen(false);
        form.resetFields();
        setEditingIndex(null);
        setPendingTeeth([]);
        setOdontoKey((k) => k + 1);
    };
    return (
        <Content className="md:ml-[40px] md:mr-[14px] my-4 rounded-md shadow bg-white">
            <div className="flex gap-4 w-full">
                <div className="py-8 w-full max-w-lg h-[600px] flex justify-center items-center">
                    <Odontogram
                        key={odontoKey}
                        theme="light"
                        showTooltip={false}
                        onChange={(props) => handleChange(props)}
                        selectedIds={hoveredTeeth.map((t) => t.id)}
                    />
                </div>
                <div className="bg-zinc-100 p-4 border-l border-l-zinc-300 w-full">
                    <Typography.Title level={4}>Dental Examination</Typography.Title>
                    <div className="flex items-center justify-start mt-8">
                        {selected.length > 0 ? (
                            <Timeline
                                className="w-full"
                                items={selected.map((item, idx) => ({
                                    color: 'gray',
                                    children: (
                                        <TimelineContent
                                            setHoveredTeeth={setHoveredTeeth}
                                            date={item.date}
                                            treatment={item.treatment}
                                            condition={item.condition}
                                            dentist={item.dentist}
                                            tooth={item.tooth}
                                            status={item.status}
                                            notes={item.notes}
                                            onEdit={() => {
                                                const values = {
                                                    date: dayjs(item.date, 'DD-MM-YYYY'),
                                                    treatment: item.treatment,
                                                    condition: item.condition,
                                                    dentist: item.dentist,
                                                    status: item.status,
                                                    notes: item.notes,
                                                };
                                                form.setFieldsValue(values as any);
                                                setPendingTeeth(item.tooth);
                                                setEditingIndex(idx);
                                                setIsModalOpen(true);
                                            }}
                                        />
                                    ),
                                }))}
                            />
                        ) : (
                            <Typography.Text>Please select a tooth</Typography.Text>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                title="Add Treatment"
                open={isModalOpen}
                onCancel={onCancel}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ status: 'pending', date: dayjs() }}
                    onFinish={onSubmit}
                >
                    <Form.Item label="Date" name="date" rules={[{ required: true }]}>
                        <DatePicker className="w-full" format="DD-MM-YYYY" />
                    </Form.Item>
                    <Form.Item label="Treatment" name="treatment" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Tooth Fillings" />
                    </Form.Item>
                    <Form.Item label="Condition" name="condition" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Caries" />
                    </Form.Item>
                    <Form.Item label="Dentist" name="dentist" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Dr. Amrul" />
                    </Form.Item>
                    <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'done', label: 'Done' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="Notes" name="notes">
                        <Input.TextArea placeholder="Add any additional notes" />
                    </Form.Item>
                    <Form.Item label="Selected Teeth">
                        <Typography.Paragraph className="mb-2">{pendingToothIds || '-'}</Typography.Paragraph>
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={onCancel}>Cancel</Button>
                        <Button type="primary" onClick={onSubmit} loading={isSaving}>
                            Save
                        </Button>
                    </div>
                </Form>
            </Modal>
        </Content>
    );
};

export default DentalPage;
