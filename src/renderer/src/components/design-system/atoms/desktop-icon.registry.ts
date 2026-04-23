export type DesktopIconPathDefinition = {
  name: string
  paths: string[]
  circles?: Array<{ cx: number; cy: number; r: number }>
  rects?: Array<{ x: number; y: number; width: number; height: number; rx?: number }>
  polylines?: string[]
}

const DESKTOP_ICON_PATHS = {
  dashboard: {
    name: 'dashboard',
    rects: [
      { x: 3, y: 3, width: 7, height: 9, rx: 1.5 },
      { x: 14, y: 3, width: 7, height: 5, rx: 1.5 },
      { x: 14, y: 12, width: 7, height: 9, rx: 1.5 },
      { x: 3, y: 16, width: 7, height: 5, rx: 1.5 }
    ],
    paths: []
  },
  user: {
    name: 'user',
    circles: [{ cx: 12, cy: 8, r: 4 }],
    paths: ['M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8']
  },
  users: {
    name: 'users',
    circles: [
      { cx: 9, cy: 8, r: 3.5 },
      { cx: 17, cy: 7, r: 2.5 }
    ],
    paths: ['M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', 'M15 14h2a4 4 0 0 1 4 4']
  },
  bed: {
    name: 'bed',
    circles: [{ cx: 7, cy: 11, r: 2 }],
    paths: ['M3 10v9', 'M3 14h18', 'M21 19v-6a3 3 0 0 0-3-3H9v4']
  },
  stethoscope: {
    name: 'stethoscope',
    circles: [{ cx: 18, cy: 10, r: 2 }],
    paths: [
      'M6 3v6a4 4 0 0 0 8 0V3',
      'M8 3H6',
      'M12 3h2',
      'M10 13v3a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-2'
    ]
  },
  pill: {
    name: 'pill',
    rects: [{ x: 3, y: 10, width: 18, height: 8, rx: 4 }],
    paths: ['m8.5 8.5 7 7']
  },
  flask: {
    name: 'flask',
    paths: [
      'M9 3h6',
      'M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3',
      'M7 14h10'
    ]
  },
  receipt: {
    name: 'receipt',
    paths: [
      'M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3Z',
      'M8 8h8',
      'M8 12h8',
      'M8 16h5'
    ]
  },
  calendar: {
    name: 'calendar',
    rects: [{ x: 3, y: 4, width: 18, height: 17, rx: 2 }],
    paths: ['M3 9h18', 'M8 2v4', 'M16 2v4']
  },
  chart: {
    name: 'chart',
    rects: [
      { x: 5, y: 12, width: 3, height: 6 },
      { x: 11, y: 7, width: 3, height: 11 },
      { x: 17, y: 4, width: 3, height: 14 }
    ],
    paths: ['M3 20h18']
  },
  search: {
    name: 'search',
    circles: [{ cx: 11, cy: 11, r: 7 }],
    paths: ['m20 20-3.5-3.5']
  },
  bell: {
    name: 'bell',
    paths: ['M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z', 'M10 20a2 2 0 0 0 4 0']
  },
  settings: {
    name: 'settings',
    circles: [{ cx: 12, cy: 12, r: 3 }],
    paths: [
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z'
    ]
  },
  plus: {
    name: 'plus',
    paths: ['M12 5v14', 'M5 12h14']
  },
  filter: {
    name: 'filter',
    paths: ['M4 4h16l-6 8v6l-4 2v-8L4 4Z']
  },
  download: {
    name: 'download',
    paths: ['M12 3v12', 'M6 11l6 6 6-6', 'M4 21h16']
  },
  print: {
    name: 'print',
    rects: [{ x: 6, y: 14, width: 12, height: 7 }],
    paths: [
      'M6 9V3h12v6',
      'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'
    ]
  },
  more: {
    name: 'more',
    circles: [
      { cx: 5, cy: 12, r: 1.5 },
      { cx: 12, cy: 12, r: 1.5 },
      { cx: 19, cy: 12, r: 1.5 }
    ],
    paths: []
  },
  'chevron-down': {
    name: 'chevron-down',
    paths: ['m6 9 6 6 6-6']
  },
  'chevron-left': {
    name: 'chevron-left',
    paths: ['m15 6-6 6 6 6']
  },
  'chevron-right': {
    name: 'chevron-right',
    paths: ['m9 6 6 6-6 6']
  },
  check: {
    name: 'check',
    paths: ['m4 12 5 5 11-11']
  },
  x: {
    name: 'x',
    paths: ['M6 6l12 12', 'M18 6 6 18']
  },
  clock: {
    name: 'clock',
    circles: [{ cx: 12, cy: 12, r: 9 }],
    paths: ['M12 7v5l3 2']
  },
  'arrow-right': {
    name: 'arrow-right',
    paths: ['M4 12h16', 'M13 5l7 7-7 7']
  },
  'arrow-left': {
    name: 'arrow-left',
    paths: ['M20 12H4', 'M11 19l-7-7 7-7']
  },
  'arrow-up': {
    name: 'arrow-up',
    paths: ['m6 9 6-6 6 6', 'M12 3v18']
  },
  'arrow-down': {
    name: 'arrow-down',
    paths: ['m6 15 6 6 6-6', 'M12 3v18']
  },
  'check-circle': {
    name: 'check-circle',
    circles: [{ cx: 12, cy: 12, r: 9 }],
    paths: ['m8.5 12 2.5 2.5 4.5-5']
  },
  alert: {
    name: 'alert',
    paths: ['m12 3 10 18H2L12 3Z', 'M12 10v4', 'M12 18v.01']
  },
  shield: {
    name: 'shield',
    paths: ['M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z']
  },
  heart: {
    name: 'heart',
    paths: ['M12 21s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 11-8 11Z', 'M3 12h4l2-3 3 6 2-4h7']
  },
  activity: {
    name: 'activity',
    paths: ['M3 12h4l2-6 4 12 2-6h6']
  },
  qr: {
    name: 'qr',
    rects: [
      { x: 3, y: 3, width: 7, height: 7 },
      { x: 14, y: 3, width: 7, height: 7 },
      { x: 3, y: 14, width: 7, height: 7 },
      { x: 14, y: 14, width: 3, height: 3 }
    ],
    paths: ['M20 14v3', 'M14 20h3', 'M20 20v1']
  },
  building: {
    name: 'building',
    rects: [{ x: 4, y: 3, width: 16, height: 18 }],
    paths: [
      'M9 7h2',
      'M13 7h2',
      'M9 11h2',
      'M13 11h2',
      'M9 15h2',
      'M13 15h2',
      'M10 21v-3h4v3'
    ]
  },
  folder: {
    name: 'folder',
    paths: ['M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z']
  },
  id: {
    name: 'id',
    rects: [{ x: 3, y: 5, width: 18, height: 14, rx: 2 }],
    circles: [{ cx: 9, cy: 12, r: 2.5 }],
    paths: ['M14 10h5', 'M14 14h3', 'M5 16c0-2 2-3 4-3s4 1 4 3']
  },
  logout: {
    name: 'logout',
    paths: ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'M10 17l-5-5 5-5', 'M15 12H5']
  },
  sparkles: {
    name: 'sparkles',
    paths: [
      'M12 3v4',
      'M12 17v4',
      'M3 12h4',
      'M17 12h4',
      'M6 6l2.5 2.5',
      'M15.5 15.5 18 18',
      'M6 18l2.5-2.5',
      'M15.5 8.5 18 6'
    ]
  },
  'circle-help': {
    name: 'circle-help',
    circles: [{ cx: 12, cy: 12, r: 9 }],
    paths: ['M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3', 'M12 17h.01']
  }
} satisfies Record<string, DesktopIconPathDefinition>

export type DesktopIconName = keyof typeof DESKTOP_ICON_PATHS

export const DESKTOP_ICON_NAMES = Object.freeze(
  Object.keys(DESKTOP_ICON_PATHS) as DesktopIconName[]
)

export function hasDesktopIcon(name: string): name is DesktopIconName {
  return name in DESKTOP_ICON_PATHS
}

export function getDesktopIconPath(name: string): DesktopIconPathDefinition {
  return DESKTOP_ICON_PATHS[name as DesktopIconName] ?? DESKTOP_ICON_PATHS['circle-help']
}
