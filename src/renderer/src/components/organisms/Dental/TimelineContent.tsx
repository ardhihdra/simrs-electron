import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  SnippetsOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { Button, Card, Popconfirm } from 'antd'
import type { TimelineContentProps } from '.'
import type { ToothDetail } from './type'

export const TimelineContent = ({
  date,
  treatment,
  condition,
  dentist,
  tooth,
  status,
  notes,
  onEdit,
  setHoveredTeeth,
  onDelete
}: TimelineContentProps & {
  onEdit?: () => void
  setHoveredTeeth: (teeth: ToothDetail[]) => void
  onDelete?: () => void
}) => {
  return (
    <Card
      className="w-full min-w-lg relative"
      onMouseEnter={() => {
        setHoveredTeeth(tooth)
      }}
      onMouseLeave={() => setHoveredTeeth([])}
    >
      <div className="flex items-center justify-start gap-8 border-b border-b-zinc-300 pb-4 pr-4 mb-4">
        <div>
          <span className="text-zinc-500 uppercase">
            {new Date(date.split('-').reverse().join('-')).toLocaleDateString('id-ID', {
              month: 'short'
            })}
          </span>
          <br />
          <span>{new Date(date.split('-').reverse().join('-')).getDate()}</span>
        </div>
        <div>
          <span className="text-zinc-500">KONDISI</span>
          <br />
          <span>{condition}</span>
        </div>
        <div>
          <span className="text-zinc-500">TINDAKAN</span>
          <br />
          <span>{treatment}</span>
        </div>
        <div>
          <span className="text-zinc-500">DOKTER GIGI</span>
          <br />
          <span className="font-bold">{dentist}</span>
        </div>
        <div className="ml-auto flex gap-4 items-center">
          {status === 'done' ? (
            <div className=" text-green-500">
              <CheckCircleOutlined /> Selesai
            </div>
          ) : (
            <div className=" text-yellow-500">
              <ClockCircleOutlined /> Menunggu
            </div>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={onEdit}>
            Edit
          </Button>
          <Popconfirm
            title="Hapus data ini?"
            description="Data yang dihapus tidak dapat dikembalikan"
            onConfirm={onDelete}
            okText="Ya"
            cancelText="Batal"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Hapus
            </Button>
          </Popconfirm>
        </div>
      </div>
      <div className="bg-zinc-100 p-4 pl-12 rounded-md relative pb-8">
        <div className="absolute left-4 top-4 text-xl text-zinc-400">
          <SnippetsOutlined />
        </div>
        <div>
          <span className="text-zinc-500">Gigi Terpilih</span>
          <br />
          <span>{tooth.map((item) => `${item.id} ${item.type}`).join(', ')}</span>
          <br />
          {notes && <span className="text-zinc-500">Catatan: {notes}</span>}
        </div>
      </div>
    </Card>
  )
}
