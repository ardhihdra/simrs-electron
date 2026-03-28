import { client } from '@renderer/utils/client'
import { App, Button, Modal } from 'antd'

interface CallQueueModalProps {
  open: boolean
  record?: any
  onClose: () => void
  onSuccess: () => void
}

export default function CallQueueModal({ open, record, onClose, onSuccess }: CallQueueModalProps) {
  const { message } = App.useApp()
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()

  const handleConfirmDestination = async (withTriage: boolean) => {
    if (!record) return

    try {
      if (withTriage) {
        await updateStatusMutation.mutateAsync({
          queueId: record.queueId,
          action: 'CALL_TO_TRIAGE'
        })
        message.success(`Antrian ${record.formattedQueueNumber} dipanggil ke Triage`)
      } else {
        await updateStatusMutation.mutateAsync({
          queueId: record.queueId,
          action: 'START_ENCOUNTER'
        })
        message.success(`Antrian ${record.formattedQueueNumber} dipanggil dan masuk Poli`)
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Gagal konfirmasi tujuan pasien')
    }
  }

  return (
    <Modal
      title="Konfirmasi Tujuan Pasien"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Batal
        </Button>,
        <Button
          key="triage"
          loading={updateStatusMutation.isPending}
          onClick={() => handleConfirmDestination(true)}
        >
          Ke Pemeriksaan Awal
        </Button>,
        <Button
          key="poli"
          type="primary"
          loading={updateStatusMutation.isPending}
          onClick={() => handleConfirmDestination(false)}
        >
          Langsung ke Poli
        </Button>
      ]}
    >
      <p>
        Pasien: <b>{record?.patientName}</b>
      </p>
      <p>
        No. Antrian: <b>{record?.formattedQueueNumber}</b>
      </p>
      <p>Pilih tujuan pasien setelah dipanggil.</p>
    </Modal>
  )
}
