interface DonutSegment {
  value: number
  color: string
  label: string
}

interface PremiumDonutProps {
  segments: DonutSegment[]
  size?: number
  centerLabel?: string
  centerSubLabel?: string
}

export const PremiumDonut = ({
  segments,
  size = 140,
  centerLabel,
  centerSubLabel = 'PASIEN'
}: PremiumDonutProps) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const r = size / 2 - 12
  const c = 2 * Math.PI * r
  let offset = 0

  const displayTotal = centerLabel !== undefined ? centerLabel : total.toString()

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
      {segments.map((seg, i) => {
        const len = (seg.value / (total || 1)) * c
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
          />
        )
        offset += len
        return el
      })}
      <text
        x={size / 2}
        y={size / 2 - 2}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fontFamily="var(--font-mono)"
        fill="var(--text)"
        dominantBaseline="middle"
      >
        {displayTotal}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 16}
        textAnchor="middle"
        fontSize="10"
        fill="var(--text-3)"
        letterSpacing="0.1em"
      >
        {centerSubLabel}
      </text>
    </svg>
  )
}
