import { client } from '@renderer/utils/client'
import { Descriptions, Empty, Modal, Spin } from 'antd'

type SampleModalProps = {
  id?: string | null
  onClose: () => void
}

export const SampleModal = ({ id, onClose }: SampleModalProps) => {
  const { data, isLoading } = client.query.entity.useQuery(
    {
      model: 'servicerequest',
      method: 'get',
      path: `/${id}/read`
    },
    {
      enabled: Boolean(id),
      queryKey: ['servicerequest', { method: 'get', model: 'servicerequest' }]
    }
  )

  const descriptionItems =
    data?.result?.flatMap((item) =>
      item.collectedSpecimens.flatMap((specimen) =>
        item.codes.map((code) => ({
          key: `${specimen.id}-${code.code}`,
          label: `${code.code} - ${code.display}`,
          value: `Kode Label: ${specimen.labelNumber}`
        }))
      )
    ) ?? []

  return (
    <Modal
      open={Boolean(id)}
      onCancel={onClose}
      footer={null}
      title="Detail Specimen"
      destroyOnClose
      centered
    >
      <Spin spinning={isLoading}>
        {descriptionItems.length > 0 ? (
          <Descriptions bordered column={1} size="middle">
            {descriptionItems.map((item) => (
              <Descriptions.Item key={item.key} label={item.label}>
                {item.value}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : (
          <Empty description="Tidak ada data specimen" />
        )}
      </Spin>
    </Modal>
  )
}
