import { client } from '@renderer/utils/client'
import { App, Button, Modal } from 'antd'

interface CallQueueModalProps {
  open: boolean
  record?: any
  onClose: () => void
  onSuccess: () => void
}

export default function CallQueueModal({ open, record, onClose, onSuccess }: CallQueueModalProps) {
  const { message, modal } = App.useApp()
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()

  const submitAction = async (action: 'CALL' | 'CALL_TO_TRIAGE' | 'START_ENCOUNTER' | 'SKIP') => {
    if (!record) return

    try {
      if (action === 'CALL_TO_TRIAGE') {
        await updateStatusMutation.mutateAsync({
          queueId: record.queueId,
          action: action as any
        })
        message.success(`Antrian ${record.formattedQueueNumber} dipanggil ke Triage`)
      } else if (action === 'START_ENCOUNTER') {
        await updateStatusMutation.mutateAsync({
          queueId: record.queueId,
          action: action as any
        })
        message.success(`Antrian ${record.formattedQueueNumber} dipanggil dan masuk Poli`)
      } else if (action === 'SKIP') {
        await updateStatusMutation.mutateAsync({
          queueId: record.queueId,
          action: action as any
        })
        message.success(`Antrian ${record.formattedQueueNumber} berhasil di-skip`)
      } else {
        await updateStatusMutation.mutateAsync({
          queueId: record.queueId,
          action: action as any
        })
        message.success(`Antrian ${record.formattedQueueNumber} berhasil dipanggil ulang`)
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      message.error(error.message || 'Gagal memperbarui antrian pasien')
    }
  }

  const confirmAction = ({
    title,
    content,
    okText,
    okType,
    action
  }: {
    title: string
    content: string
    okText: string
    okType?: 'primary' | 'danger'
    action: 'CALL' | 'CALL_TO_TRIAGE' | 'START_ENCOUNTER' | 'SKIP'
  }) => {
    modal.confirm({
      title,
      content,
      okText,
      okType,
      cancelText: 'Batal',
      onOk: async () => submitAction(action)
    })
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
          onClick={() =>
            confirmAction({
              title: 'Arahkan ke Pemeriksaan Awal',
              content: `Antrian ${record?.formattedQueueNumber} akan dikirim ke pemeriksaan awal. Lanjutkan?`,
              okText: 'Ya, Kirim',
              action: 'CALL_TO_TRIAGE'
            })
          }
        >
          Ke Pemeriksaan Awal
        </Button>,
        <Button
          key="poli"
          type="primary"
          loading={updateStatusMutation.isPending}
          onClick={() =>
            confirmAction({
              title: 'Arahkan Langsung ke Poli',
              content: `Antrian ${record?.formattedQueueNumber} akan langsung masuk ke poli. Lanjutkan?`,
              okText: 'Ya, Masuk Poli',
              action: 'START_ENCOUNTER'
            })
          }
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
      <p>Pilih tindakan berikutnya untuk pasien setelah dipanggil.</p>
    </Modal>
  )
}
