import { client } from '@renderer/utils/client'
import { App, Button, Modal } from 'antd'

interface CallConfirmationModalProps {
  open: boolean
  record?: any
  onClose: () => void
  onSuccess: () => void
}

export default function CallConfirmationModal({
  open,
  record,
  onClose,
  onSuccess
}: CallConfirmationModalProps) {
  const { message } = App.useApp()
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()

  const handleConfirmCalled = async () => {
    if (!record) return

    try {
      await updateStatusMutation.mutateAsync({
        queueId: record.queueId,
        action: 'CALL'
      })

      message.success(`Antrian ${record.formattedQueueNumber} berhasil dikonfirmasi dipanggil`)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Gagal memperbarui status panggilan')
    }
  }

  const handleRecall = () => {
    if (!record) return
    message.info(`Panggil ulang ${record.formattedQueueNumber}. Status belum diubah ke CALLED.`)
  }

  return (
    <Modal
      title="Konfirmasi Pemanggilan"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Batal
        </Button>,
        <Button key="recall" onClick={handleRecall}>
          Panggil Ulang
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={updateStatusMutation.isPending}
          onClick={handleConfirmCalled}
        >
          Konfirmasi
        </Button>
      ]}
    >
      <p>
        Pasien: <b>{record?.patientName || 'Belum ada pasien'}</b>
      </p>
      <p>
        No. Antrian: <b>{record?.formattedQueueNumber}</b>
      </p>
      <p>Konfirmasi hanya jika pasien benar-benar sudah hadir saat dipanggil.</p>
    </Modal>
  )
}
