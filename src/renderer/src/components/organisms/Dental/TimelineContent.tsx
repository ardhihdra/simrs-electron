import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { Button, Card, Popconfirm, Tag, Tooltip } from 'antd'
import type { TimelineContentProps } from '.'
import type { ToothDetail } from './type'

const parseDate = (dateStr: string) => {
  const d = new Date(dateStr.split('-').reverse().join('-'))
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(),
    year: d.getFullYear()
  }
}

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
  const parsed = parseDate(date)

  return (
    <Card
      size="small"
      className="w-full transition-shadow hover:shadow-md"
      styles={{ body: { padding: 0 } }}
      onMouseEnter={() => setHoveredTeeth(tooth)}
      onMouseLeave={() => setHoveredTeeth([])}
    >
      <div className="flex items-stretch">
        <div className="flex flex-col items-center justify-center px-5 py-3 bg-blue-600 text-white min-w-[72px] rounded-l-lg">
          <span className="text-[10px] font-bold tracking-wider opacity-80">{parsed.month}</span>
          <span className="text-2xl font-bold leading-none">{parsed.day}</span>
          <span className="text-[10px] opacity-60">{parsed.year}</span>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 px-4 py-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
              Kondisi
            </span>
            <span className="text-sm font-medium truncate">{condition || '-'}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
              Tindakan
            </span>
            <Tooltip title={treatment}>
              <span className="text-sm font-medium truncate">{treatment || '-'}</span>
            </Tooltip>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
              Dokter Gigi
            </span>
            <span className="text-sm font-semibold truncate">{dentist || '-'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3">
          {status === 'done' ? (
            <Tag icon={<CheckCircleOutlined />} color="success" className="m-0 text-xs font-medium">
              Selesai
            </Tag>
          ) : (
            <Tag icon={<ClockCircleOutlined />} color="warning" className="m-0 text-xs font-medium">
              Menunggu
            </Tag>
          )}
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={onEdit}
              className="text-blue-500 hover:text-blue-600"
            />
          </Tooltip>
          <Popconfirm
            title="Hapus data ini?"
            description="Data yang dihapus tidak dapat dikembalikan"
            onConfirm={onDelete}
            okText="Ya"
            cancelText="Batal"
          >
            <Tooltip title="Hapus">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-white/10 bg-black/2 flex flex-wrap gap-x-6 gap-y-2 items-start text-sm">
        <div className="flex-1 min-w-[200px]">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50 block mb-1">
            Gigi Terpilih
          </span>
          <div className="flex flex-wrap gap-1">
            {tooth.map((t) => (
              <Tag key={t.id} className="m-0 text-xs">
                {t.id} <span className="opacity-60">{t.type}</span>
              </Tag>
            ))}
          </div>
        </div>
        {notes && (
          <div className="flex-1 min-w-[200px]">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50 block mb-1">
              Catatan
            </span>
            <span className="text-xs opacity-80 whitespace-pre-wrap">{notes}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
