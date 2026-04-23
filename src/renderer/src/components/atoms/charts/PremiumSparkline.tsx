interface PremiumSparklineProps {
  values: number[]
  color?: string
  height?: number
  width?: number
}

export const PremiumSparkline = ({
  values,
  color = 'var(--accent)',
  height = 36,
  width = 100
}: PremiumSparklineProps) => {
  if (!values || values.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  const areaPts = `0,${height} ${pts} ${width},${height}`

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={areaPts} fill={color} opacity="0.12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
