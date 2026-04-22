import React from 'react'

import { DesktopTriageBadge, type DesktopTriageBadgeTone } from '../atoms/DesktopTriageBadge'

export type DesktopCompactStatTone = 'accent' | 'success'

export interface DesktopCompactStatStripProps {
  totalActive: string
  triageLevels: Array<{
    label: string
    value: string
    tone: DesktopTriageBadgeTone
  }>
  bedAvailable: string
  bedTotal: string
  averageResponse: string
  totalToday: string
  statusBadges?: Array<{
    label: string
    tone: DesktopCompactStatTone
  }>
}

const STATUS_BADGE_CLASSNAME: Record<DesktopCompactStatTone, string> = {
  success:
    'border-[color-mix(in_srgb,var(--ds-color-success)_18%,white)] bg-[color-mix(in_srgb,var(--ds-color-success)_10%,white)] text-[var(--ds-color-success)]',
  accent:
    'border-[color-mix(in_srgb,var(--ds-color-accent)_18%,white)] bg-[var(--ds-color-accent-soft)] text-[var(--ds-color-accent)]'
}

export function DesktopCompactStatStrip({
  totalActive,
  triageLevels,
  bedAvailable,
  bedTotal,
  averageResponse,
  totalToday,
  statusBadges = []
}: DesktopCompactStatStripProps) {
  return (
    <div className="desktop-compact-stat-strip flex flex-wrap items-center gap-[18px] rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[16px] py-[11px] shadow-[var(--ds-shadow-xs)]">
      <div>
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
          Pasien Aktif
        </span>
        <b className="block font-mono text-[26px] leading-none text-[var(--ds-color-text)]">{totalActive}</b>
      </div>

      <div className="h-[40px] w-px bg-[var(--ds-color-border)]" />

      {triageLevels.map((level) => (
        <div key={level.label} className="flex flex-col items-center gap-[4px]">
          <DesktopTriageBadge tone={level.tone} compact>
            {level.label}
          </DesktopTriageBadge>
          <b className="font-mono text-[16px] leading-none text-[var(--ds-color-text)]">{level.value}</b>
        </div>
      ))}

      <div className="h-[40px] w-px bg-[var(--ds-color-border)]" />

      <div>
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
          Bed Tersedia
        </span>
        <div className="flex items-end gap-[3px]">
          <b className="font-mono text-[18px] leading-none text-[var(--ds-color-success)]">{bedAvailable}</b>
          <span className="text-[12px] text-[var(--ds-color-text-subtle)]">/{bedTotal}</span>
        </div>
      </div>

      <div>
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
          AVG. Response
        </span>
        <div className="flex items-end gap-[3px]">
          <b className="font-mono text-[18px] leading-none text-[var(--ds-color-text)]">{averageResponse}</b>
          <span className="text-[11px] text-[var(--ds-color-text-subtle)]">mnt</span>
        </div>
      </div>

      <div>
        <span className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
          Total Hari Ini
        </span>
        <b className="block font-mono text-[18px] leading-none text-[var(--ds-color-text)]">{totalToday}</b>
      </div>

      {statusBadges.length > 0 ? (
        <div className="ml-auto flex flex-wrap items-center gap-[8px]">
          {statusBadges.map((status) => (
            <span
              key={status.label}
              className={`inline-flex items-center gap-[5px] rounded-[999px] border px-[10px] py-[3px] text-[11px] font-semibold ${STATUS_BADGE_CLASSNAME[status.tone]}`}
            >
              <span
                className={`h-[6px] w-[6px] rounded-[999px] ${
                  status.tone === 'success' ? 'bg-[var(--ds-color-success)]' : 'bg-[var(--ds-color-accent)]'
                }`}
              />
              <span>{status.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
