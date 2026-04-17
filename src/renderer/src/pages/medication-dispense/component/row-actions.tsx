import { Modal, Button, App as AntdApp } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { queryClient } from '@renderer/query-client'
import type { RowActionsProps } from '../types'
import { getPatientDisplayName, extractTelaahResults } from '../utils'
import { printMedicationLabels } from './print-medication-label'
import { SerahkanObatModal, type SerahkanObatFormValues } from './serahkan-obat-modal'

export function RowActions({ record, patient, employees, employeeNameById, parentServicedAt }: RowActionsProps) {
    const { message } = AntdApp.useApp()
    const [serahkanModalOpen, setSerahkanModalOpen] = useState(false)

    const updateMutation = useMutation({
        mutationKey: ['medicationDispense', 'update', 'complete'],
        mutationFn: async (formValues: SerahkanObatFormValues) => {
            if (typeof record.id !== 'number') {
                throw new Error('ID MedicationDispense tidak valid.')
            }
            const fn = window.api?.query?.medicationDispense?.update
            if (!fn) throw new Error('API MedicationDispense tidak tersedia.')

            const penyiapNama = employeeNameById.get(formValues.penyiapObatId) ?? ''
            const penyerahNama = employeeNameById.get(formValues.penyerahObatId) ?? ''

            const pioAnnotation = {
                text: `PIO: ${JSON.stringify({
                    hubungan: formValues.hubunganPenerima,
                    namaPenerima: formValues.namaPenerima,
                    penyiapObatId: formValues.penyiapObatId,
                    penyiapObatNama: penyiapNama,
                    penyerahObatId: formValues.penyerahObatId,
                    penyerahObatNama: penyerahNama,
                })}`,
            }

            const receiverDisplay =
                formValues.hubunganPenerima === 'Sendiri'
                    ? 'Sendiri (Pasien)'
                    : `${formValues.hubunganPenerima} - ${formValues.namaPenerima}`

            const payload = {
                id: record.id,
                status: 'completed' as const,
                whenHandedOver: new Date().toISOString(),
                performerId: formValues.penyerahObatId,
                note: [pioAnnotation],
                receiver: [{ display: receiverDisplay }],
            }
            const res = await fn(payload as never)
            if (!res.success) {
                throw new Error(res.error || 'Gagal memperbarui MedicationDispense')
            }
            return res
        },
        onSuccess: () => {
            setSerahkanModalOpen(false)
            queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
            message.success('Obat berhasil diserahkan')
        },
        onError: (error) => {
            const msg = error instanceof Error ? error.message : String(error)
            message.error(msg || 'Gagal menyerahkan obat')
        },
    })

    const voidMutation = useMutation({
        mutationKey: ['medicationDispense', 'update', 'void'],
        mutationFn: async () => {
            if (typeof record.id !== 'number') {
                throw new Error('ID MedicationDispense tidak valid.')
            }
            const fn = window.api?.query?.medicationDispense?.update
            if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
            const payload: { id: number; status: 'entered-in-error' } = {
                id: record.id,
                status: 'entered-in-error',
            }
            const res = await fn(payload as never)
            if (!res.success) {
                throw new Error(res.error || 'Gagal melakukan Return/Void MedicationDispense')
            }
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
            message.success('Dispense berhasil di-void / dikembalikan')
        },
        onError: (error) => {
            const msg = error instanceof Error ? error.message : String(error)
            message.error(msg || 'Gagal melakukan Return/Void MedicationDispense')
        },
    })

    const isCompleted = record.status === 'completed'
    const isTerminal =
        record.status === 'cancelled' ||
        record.status === 'declined' ||
        record.status === 'entered-in-error'
    const quantityToDispense = typeof record.quantity === 'number' ? record.quantity : 0
    const hasStockInfo = typeof record.availableStock === 'number'
    const isStockInsufficient = hasStockInfo && quantityToDispense > (record.availableStock as number)
    const isPaid = record.paymentStatus === 'Lunas'
    const isReviewed = useMemo(() => {
        return !!extractTelaahResults(record)
    }, [record])

    const canComplete =
        !isCompleted &&
        !isTerminal &&
        typeof record.id === 'number' &&
        !isStockInsufficient &&
        isPaid &&
        !!parentServicedAt
    const canVoid = isCompleted && typeof record.id === 'number'
    const isKomposisi = record.jenis === 'Komposisi'

    const handlePrintLabel = () => {
        const patientLabel = getPatientDisplayName(patient)
        printMedicationLabels({
            patientName: patientLabel,
            items: [
                {
                    medicineName: record.medicineName,
                    quantity: record.quantity,
                    unit: record.unit,
                    instruksi: record.instruksi,
                    expiryDate: (record as any).expiryDate,
                    batch: (record as any).batch,
                },
            ],
        })
    }

    void isReviewed

    return (
        <div className="flex flex-col items-start gap-1">
            <div className="flex gap-2">
                {canComplete && (
                    <Button
                        type="primary"
                        size="small"
                        disabled={updateMutation.isPending || isStockInsufficient}
                        loading={updateMutation.isPending}
                        onClick={() => setSerahkanModalOpen(true)}
                    >
                        Serahkan Obat
                    </Button>
                )}
                {canVoid && (
                    <Button
                        type="default"
                        size="small"
                        danger
                        disabled={voidMutation.isPending}
                        loading={voidMutation.isPending}
                        onClick={() => {
                            Modal.confirm({
                                title: 'Konfirmasi Return / Void',
                                content:
                                    'Yakin ingin melakukan Return / Void dispense ini? Stok obat akan dikembalikan.',
                                okText: 'Ya, Return / Void',
                                cancelText: 'Batal',
                                okButtonProps: { danger: true },
                                onOk: () => voidMutation.mutate(),
                            })
                        }}
                    >
                        Return / Void
                    </Button>
                )}
                {!isKomposisi && (
                    <Button type="default" size="small" onClick={handlePrintLabel}>
                        Cetak Label
                    </Button>
                )}
            </div>
            {isStockInsufficient && (
                <div className="text-xs text-red-500">
                    Stok obat kosong / tidak cukup, tidak dapat menyerahkan obat.
                </div>
            )}
            {!isKomposisi && !isPaid && !isCompleted && !isTerminal && !isStockInsufficient && (
                <div className="text-xs text-orange-500">
                    Pembayaran belum lunas, tidak dapat menyerahkan obat.
                </div>
            )}
            {!isKomposisi &&
                isPaid &&
                !isCompleted &&
                !isTerminal &&
                !isStockInsufficient &&
                !parentServicedAt && (
                    <div className="text-xs text-orange-500 font-semibold bg-orange-50 border border-orange-200 p-1 px-2 rounded-md">
                        Harap &quot;Mulai Proses&quot; (di menu titik tiga) terlebih dahulu.
                    </div>
                )}
            <SerahkanObatModal
                open={serahkanModalOpen}
                loading={updateMutation.isPending}
                employees={employees}
                onSubmit={(values) => updateMutation.mutate(values)}
                onCancel={() => setSerahkanModalOpen(false)}
            />
        </div>
    )
}
