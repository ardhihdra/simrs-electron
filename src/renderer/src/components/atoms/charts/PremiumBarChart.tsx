interface BarData {
  label: string
  value: number
  subValue?: number // e.g. BPJS vs Total
  color?: string
  subColor?: string
}

interface PremiumBarChartProps {
  data: BarData[]
  height?: number
}

export const PremiumBarChart = ({ data, height = 180 }: PremiumBarChartProps) => {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.subValue || 0))) || 1

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        height,
        padding: '8px 4px'
      }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            height: '100%'
          }}
        >
          <div
            style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 3
            }}
          >
            <div
              style={{
                flex: 1,
                height: `${(d.value / max) * 100}%`,
                background: d.color || 'var(--accent)',
                borderRadius: '3px 3px 0 0',
                minHeight: 2,
                transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            />
            {d.subValue !== undefined && (
              <div
                style={{
                  flex: 1,
                  height: `${(d.subValue / max) * 100}%`,
                  background: d.subColor || 'var(--accent-soft)',
                  borderRadius: '3px 3px 0 0',
                  border: `1px solid ${d.color || 'var(--accent)'}`,
                  minHeight: 2,
                  transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            )}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap'
            }}
          >
            {d.label}
          </div>
        </div>
      ))}
    </div>
  )
}
