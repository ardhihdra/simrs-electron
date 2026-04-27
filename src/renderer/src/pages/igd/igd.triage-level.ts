import type { DesktopBadgeTone } from '../../components/design-system/atoms/DesktopBadge'
import type { DesktopTriageBadgeTone } from '../../components/design-system/atoms/DesktopTriageBadge'

export type IgdTriageLevel = 0 | 1 | 2 | 3 | 4

export type IgdTriageLevelMeta = {
  level: IgdTriageLevel
  label: `L${IgdTriageLevel}`
  name: string
  colorName: string
  badgeTone: DesktopTriageBadgeTone
  statTone: DesktopBadgeTone
  priority: boolean
  color: string
  foreground: string
  background: string
  borderColor: string
  badgeStyle: {
    backgroundColor: string
    borderColor: string
    color: string
  }
}

export const IGD_TRIAGE_LEVELS: IgdTriageLevel[] = [0, 1, 2, 3, 4]

export const IGD_TRIAGE_LEVEL_META = {
  0: {
    level: 0,
    label: 'L0',
    name: 'Resusitasi',
    colorName: 'HITAM',
    badgeTone: 'neutral',
    statTone: 'neutral',
    priority: true,
    color: '#111827',
    foreground: '#ffffff',
    background: '#111827',
    borderColor: '#000000',
    badgeStyle: {
      backgroundColor: '#111827',
      borderColor: '#000000',
      color: '#ffffff'
    }
  },
  1: {
    level: 1,
    label: 'L1',
    name: 'Emergensi',
    colorName: 'MERAH',
    badgeTone: 'danger',
    statTone: 'danger',
    priority: true,
    color: '#dc2626',
    foreground: '#ffffff',
    background: '#dc2626',
    borderColor: '#991b1b',
    badgeStyle: {
      backgroundColor: '#dc2626',
      borderColor: '#991b1b',
      color: '#ffffff'
    }
  },
  2: {
    level: 2,
    label: 'L2',
    name: 'Urgen',
    colorName: 'KUNING',
    badgeTone: 'warning',
    statTone: 'warning',
    priority: false,
    color: '#facc15',
    foreground: '#111827',
    background: '#facc15',
    borderColor: '#ca8a04',
    badgeStyle: {
      backgroundColor: '#facc15',
      borderColor: '#ca8a04',
      color: '#111827'
    }
  },
  3: {
    level: 3,
    label: 'L3',
    name: 'Semi-Urgen',
    colorName: 'HIJAU',
    badgeTone: 'success',
    statTone: 'success',
    priority: false,
    color: '#16a34a',
    foreground: '#ffffff',
    background: '#16a34a',
    borderColor: '#15803d',
    badgeStyle: {
      backgroundColor: '#16a34a',
      borderColor: '#15803d',
      color: '#ffffff'
    }
  },
  4: {
    level: 4,
    label: 'L4',
    name: 'Tidak Urgen',
    colorName: 'PUTIH',
    badgeTone: 'neutral',
    statTone: 'neutral',
    priority: false,
    color: '#ffffff',
    foreground: '#111827',
    background: '#ffffff',
    borderColor: '#9ca3af',
    badgeStyle: {
      backgroundColor: '#ffffff',
      borderColor: '#9ca3af',
      color: '#111827'
    }
  }
} satisfies Record<IgdTriageLevel, IgdTriageLevelMeta>

export function getIgdTriageLevelMeta(level: IgdTriageLevel): IgdTriageLevelMeta {
  return IGD_TRIAGE_LEVEL_META[level]
}

export function formatIgdTriageLevel(level: IgdTriageLevel): `L${IgdTriageLevel}` {
  return getIgdTriageLevelMeta(level).label
}
