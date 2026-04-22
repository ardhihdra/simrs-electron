import { Spin, Table } from 'antd'
import type { TableProps } from 'antd'

export interface DesktopTableProps<T extends object> extends TableProps<T> {
  loadingOverlay?: boolean
}

export function DesktopTable<T extends object>({
  className = '',
  loading,
  loadingOverlay = true,
  pagination = false,
  size = 'small',
  ...props
}: DesktopTableProps<T>) {
  const resolvedLoading =
    typeof loading === 'boolean' ? loading : (loading?.spinning ?? false)

  return (
    <div
      className={`desktop-table relative overflow-hidden rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)] ${className}`.trim()}
    >
      {loadingOverlay && resolvedLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--ds-color-scrim)]">
          <Spin size="large" />
        </div>
      ) : null}
      <Table<T> {...props} loading={loading} pagination={pagination} size={size} />
    </div>
  )
}
