import React from 'react'
import { Tooltip } from 'antd'

export type ToothStatus =
  | 'healthy'
  | 'caries'
  | 'filling'
  | 'missing'
  | 'bridge'
  | 'impacted'
  | 'root_canal'
  | 'veneer'
  | 'other'

export interface ToothSurface {
  top?: ToothStatus
  bottom?: ToothStatus
  left?: ToothStatus
  right?: ToothStatus
  center?: ToothStatus
  whole?: ToothStatus
}

interface ToothItemProps {
  toothNumber: string
  label: string
  surfaces: ToothSurface
  onSurfaceClick: (toothNumber: string, surface: keyof ToothSurface) => void
  isDeciduous?: boolean
}

const getStatusColor = (status?: ToothStatus): string => {
  switch (status) {
    case 'caries':
      return '#f5222d' // red
    case 'filling':
      return '#1890ff' // blue
    case 'root_canal':
      return '#722ed1' // purple
    case 'bridge':
      return '#faad14' // gold
    case 'missing':
      return '#d9d9d9' // light gray
    case 'impacted':
      return '#eb2f96' // pink
    case 'veneer':
      return '#52c41a' // green
    default:
      return '#ffffff'
  }
}

const ToothItem: React.FC<ToothItemProps> = ({
  toothNumber,
  label,
  surfaces,
  onSurfaceClick,
  isDeciduous
}) => {
  const size = isDeciduous ? 40 : 50
  const centerSize = size * 0.4
  const padding = size * 0.1

  const renderSurface = (surface: keyof ToothSurface, d: string) => {
    const status = surfaces[surface]
    return (
      <path
        d={d}
        fill={getStatusColor(status)}
        stroke="#595959"
        strokeWidth="1"
        className="cursor-pointer transition-colors hover:fill-blue-100"
        onClick={() => onSurfaceClick(toothNumber, surface)}
      />
    )
  }

  return (
    <div className="flex flex-col items-center p-1">
      <span className="text-[10px] font-bold text-gray-500 mb-1">{label}</span>
      <Tooltip title={`Gigi ${toothNumber}`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Top (Occlusal/Incisal) */}
          {renderSurface(
            'top',
            `M ${padding} ${padding} L ${size - padding} ${padding} L ${size - padding - centerSize / 1.5} ${padding + centerSize / 1.5} L ${padding + centerSize / 1.5} ${padding + centerSize / 1.5} Z`
          )}

          {/* Bottom (Lingual/Palatal) */}
          {renderSurface(
            'bottom',
            `M ${padding} ${size - padding} L ${size - padding} ${size - padding} L ${size - padding - centerSize / 1.5} ${size - padding - centerSize / 1.5} L ${padding + centerSize / 1.5} ${size - padding - centerSize / 1.5} Z`
          )}

          {/* Left (Mesial/Distal) */}
          {renderSurface(
            'left',
            `M ${padding} ${padding} L ${padding} ${size - padding} L ${padding + centerSize / 1.5} ${size - padding - centerSize / 1.5} L ${padding + centerSize / 1.5} ${padding + centerSize / 1.5} Z`
          )}

          {/* Right (Distal/Mesial) */}
          {renderSurface(
            'right',
            `M ${size - padding} ${padding} L ${size - padding} ${size - padding} L ${size - padding - centerSize / 1.5} ${size - padding - centerSize / 1.5} L ${size - padding - centerSize / 1.5} ${padding + centerSize / 1.5} Z`
          )}

          {/* Center (Occlusal Center) */}
          {renderSurface(
            'center',
            `M ${padding + centerSize / 1.5} ${padding + centerSize / 1.5} L ${size - padding - centerSize / 1.5} ${padding + centerSize / 1.5} L ${size - padding - centerSize / 1.5} ${size - padding - centerSize / 1.5} L ${padding + centerSize / 1.5} ${size - padding - centerSize / 1.5} Z`
          )}

          {/* Border for the whole tooth if status exists */}
          {surfaces.whole && (
            <rect
              x="2"
              y="2"
              width={size - 4}
              height={size - 4}
              fill="none"
              stroke={getStatusColor(surfaces.whole)}
              strokeWidth="3"
              strokeDasharray="4"
              className="pointer-events-none"
            />
          )}
        </svg>
      </Tooltip>
      <span className="text-[11px] font-mono mt-1">{toothNumber}</span>
    </div>
  )
}

interface OdontogramProps {
  data: Record<string, ToothSurface>
  onChange: (toothNumber: string, surface: keyof ToothSurface) => void
}

export const Odontogram: React.FC<OdontogramProps> = ({ data, onChange }) => {
  // ISO/FDI Notation Numbers
  const quadrants = {
    upperRight: ['18', '17', '16', '15', '14', '13', '12', '11'],
    upperLeft: ['21', '22', '23', '24', '25', '26', '27', '28'],
    lowerLeft: ['31', '32', '33', '34', '35', '36', '37', '38'],
    lowerRight: ['48', '47', '46', '45', '44', '43', '42', '41'],
    deciduousUpperRight: ['55', '54', '53', '52', '51'],
    deciduousUpperLeft: ['61', '62', '63', '64', '65'],
    deciduousLowerLeft: ['71', '72', '73', '74', '75'],
    deciduousLowerRight: ['85', '84', '83', '82', '81']
  }

  const renderQuadrant = (teeth: string[], isDeciduous = false) => (
    <div className="flex gap-1">
      {teeth.map((t) => (
        <ToothItem
          key={t}
          toothNumber={t}
          label={t}
          surfaces={data[t] || {}}
          onSurfaceClick={onChange}
          isDeciduous={isDeciduous}
        />
      ))}
    </div>
  )

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 overflow-x-auto">
      <div className="min-w-[800px] flex flex-col gap-8">
        {/* Upper Arch */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold text-gray-400 text-center uppercase tracking-wider mb-2">
            Rahang Atas
          </div>

          {/* Permanent Upper */}
          <div className="flex justify-center border-b border-dashed border-gray-100 pb-4">
            <div className="flex gap-4">
              {renderQuadrant(quadrants.upperRight)}
              <div className="w-px bg-gray-200" />
              {renderQuadrant(quadrants.upperLeft)}
            </div>
          </div>

          {/* Deciduous Upper */}
          <div className="flex justify-center mt-2">
            <div className="flex gap-4">
              {renderQuadrant(quadrants.deciduousUpperRight, true)}
              <div className="w-px bg-gray-100" />
              {renderQuadrant(quadrants.deciduousUpperLeft, true)}
            </div>
          </div>
        </div>

        {/* Lower Arch */}
        <div className="flex flex-col gap-2">
          {/* Deciduous Lower */}
          <div className="flex justify-center mb-2">
            <div className="flex gap-4">
              {renderQuadrant(quadrants.deciduousLowerRight, true)}
              <div className="w-px bg-gray-100" />
              {renderQuadrant(quadrants.deciduousLowerLeft, true)}
            </div>
          </div>

          {/* Permanent Lower */}
          <div className="flex justify-center border-t border-dashed border-gray-100 pt-4">
            <div className="flex gap-4">
              {renderQuadrant(quadrants.lowerRight)}
              <div className="w-px bg-gray-200" />
              {renderQuadrant(quadrants.lowerLeft)}
            </div>
          </div>
          <div className="text-xs font-bold text-gray-400 text-center uppercase tracking-wider mt-2">
            Rahang Bawah
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 p-4 bg-gray-50 rounded-md border border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: getStatusColor('caries') }}
            />{' '}
            <span className="text-xs">Karies</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: getStatusColor('filling') }}
            />{' '}
            <span className="text-xs">Tumpatan</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: getStatusColor('root_canal') }}
            />{' '}
            <span className="text-xs">PSA</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: getStatusColor('bridge') }}
            />{' '}
            <span className="text-xs">Bridge</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: getStatusColor('missing') }}
            />{' '}
            <span className="text-xs">Hilang</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: getStatusColor('impacted') }}
            />{' '}
            <span className="text-xs">Impaksi</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: getStatusColor('veneer') }}
            />{' '}
            <span className="text-xs">Veneer</span>
          </div>
        </div>
      </div>
    </div>
  )
}
