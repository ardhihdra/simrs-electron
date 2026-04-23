import { getDesktopIconPath, type DesktopIconName } from './desktop-icon.registry'

export interface DesktopIconProps {
  name: DesktopIconName | string
  size?: number
  strokeWidth?: number
  className?: string
}

export function DesktopIcon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className = ''
}: DesktopIconProps) {
  const definition = getDesktopIconPath(name)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {definition.rects?.map((rect, index) => (
        <rect key={`rect-${index}`} {...rect} />
      ))}
      {definition.circles?.map((circle, index) => (
        <circle key={`circle-${index}`} {...circle} />
      ))}
      {definition.paths.map((path, index) => (
        <path key={`path-${index}`} d={path} />
      ))}
      {definition.polylines?.map((polyline, index) => (
        <polyline key={`polyline-${index}`} points={polyline} />
      ))}
    </svg>
  )
}
