import { ReactNode } from 'react'

export type TableHeaderStatsVariant = 'default' | 'primary' | 'success' | 'warning' | 'info'

export interface TableHeaderStatsProps {
  icon?: ReactNode
  value: ReactNode
  label: string
  variant?: TableHeaderStatsVariant
}

export const TableHeaderStats = ({
  icon,
  value,
  label,
  variant = 'default'
}: TableHeaderStatsProps) => {
  const variantStyles: Record<TableHeaderStatsVariant, { bg: string; color: string }> = {
    default: { bg: 'rgba(255,255,255,0.1)', color: '#fff' },
    primary: { bg: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa' }, // blue
    success: { bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }, // green
    warning: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }, // amber
    info: { bg: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' } // cyan
  }

  const currentStyle = variantStyles[variant]

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.15)'
      }}
    >
      {icon && (
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: currentStyle.bg, color: '#fff' }}
        >
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
          {label}
        </div>
      </div>
    </div>
  )
}
