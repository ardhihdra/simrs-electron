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
  const { message, modal } = App.useApp()
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()
  const isSkipped = record?.status === 'SKIPPED'

  const submitAction = async (action: 'CALL' | 'SKIP' | 'RECALL_TO_PRE_RESERVED') => {
    if (!record) return

    try {
      await updateStatusMutation.mutateAsync({
        queueId: record.queueId,
        action: action as any
      })

      message.success(
        action === 'SKIP'
          ? `Antrian ${record.formattedQueueNumber} berhasil di-skip`
          : action === 'RECALL_TO_PRE_RESERVED'
            ? `Antrian ${record.formattedQueueNumber} dikembalikan ke status konfirmasi`
            : `Antrian ${record.formattedQueueNumber} berhasil dipanggil`
      )
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error(error)
      message.error(
        error.message ||
          (action === 'SKIP'
            ? 'Gagal melewati antrian'
            : action === 'RECALL_TO_PRE_RESERVED'
              ? 'Gagal mengembalikan antrian ke status konfirmasi'
              : 'Gagal memperbarui status panggilan')
      )
    }
  }

  const handleConfirmCalled = () => {
    if (!record) return

    modal.confirm({
      title: isSkipped ? 'Panggil Ulang Antrian' : 'Panggil Antrian',
      content: isSkipped
        ? `Antrian ${record.formattedQueueNumber} akan dikembalikan ke status konfirmasi. Lanjutkan?`
        : `Antrian ${record.formattedQueueNumber} akan dipanggil. Lanjutkan?`,
      okText: isSkipped ? 'Ya, Kembalikan' : 'Ya, Panggil',
      cancelText: 'Batal',
      onOk: async () => submitAction(isSkipped ? 'RECALL_TO_PRE_RESERVED' : 'CALL')
    })
  }

  const handleSkip = () => {
    if (!record) return

    modal.confirm({
      title: 'Skip Antrian',
      content: `Antrian ${record.formattedQueueNumber} akan dilewati sementara. Lanjutkan?`,
      okText: 'Ya, Skip',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => submitAction('SKIP')
    })
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
        !isSkipped ? (
          <Button danger key="skip" loading={updateStatusMutation.isPending} onClick={handleSkip}>
            Skip
          </Button>
        ) : null,
        <Button
          key="confirm"
          type="primary"
          loading={updateStatusMutation.isPending}
          onClick={handleConfirmCalled}
        >
          {isSkipped ? 'Kembalikan ke Konfirmasi' : 'Panggil'}
        </Button>
      ]}
    >
      <p>
        Pasien: <b>{record?.patientName || 'Belum ada pasien'}</b>
      </p>
      <p>
        No. Antrian: <b>{record?.formattedQueueNumber}</b>
      </p>
      <p>
        {isSkipped
          ? 'Antrian ini sebelumnya di-skip. Anda bisa mengembalikannya ke status konfirmasi.'
          : 'Konfirmasi hanya jika pasien benar-benar sudah siap untuk dipanggil.'}
      </p>
    </Modal>
  )
}
