export type KioskaPoliOption = {
  id: number
  name: string
  prefix?: string
}

export const KIOSKA_POLI_STORAGE_KEY = 'kioska-selected-poli'

export const POLI_COLORS: { key?: string; bg: string; icon: string; hover: string }[] = [
  { key: 'umum', bg: 'bg-blue-100', icon: 'text-blue-600', hover: 'group-hover:bg-blue-500' },
  { key: 'anak', bg: 'bg-sky-100', icon: 'text-sky-600', hover: 'group-hover:bg-sky-500' },
  {
    key: 'kandungan',
    bg: 'bg-pink-100',
    icon: 'text-pink-600',
    hover: 'group-hover:bg-pink-500'
  },
  {
    key: 'penyakit dalam',
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
    hover: 'group-hover:bg-amber-500'
  },
  { key: 'bedah', bg: 'bg-red-100', icon: 'text-red-600', hover: 'group-hover:bg-red-500' },
  { key: 'jantung', bg: 'bg-rose-100', icon: 'text-rose-600', hover: 'group-hover:bg-rose-500' },
  {
    key: 'saraf',
    bg: 'bg-violet-100',
    icon: 'text-violet-600',
    hover: 'group-hover:bg-violet-500'
  },
  { key: 'mata', bg: 'bg-cyan-100', icon: 'text-cyan-600', hover: 'group-hover:bg-cyan-500' },
  {
    key: 'tht',
    bg: 'bg-indigo-100',
    icon: 'text-indigo-600',
    hover: 'group-hover:bg-indigo-500'
  },
  {
    key: 'kulit',
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    hover: 'group-hover:bg-orange-500'
  },
  { key: 'gigi', bg: 'bg-lime-100', icon: 'text-lime-600', hover: 'group-hover:bg-lime-500' },
  {
    key: 'orthopedi',
    bg: 'bg-stone-100',
    icon: 'text-stone-600',
    hover: 'group-hover:bg-stone-500'
  },
  { key: 'paru', bg: 'bg-teal-100', icon: 'text-teal-600', hover: 'group-hover:bg-teal-500' },
  {
    key: 'jiwa',
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    hover: 'group-hover:bg-purple-500'
  },
  { key: 'gizi', bg: 'bg-green-100', icon: 'text-green-600', hover: 'group-hover:bg-green-500' },
  {
    key: 'urologi',
    bg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    hover: 'group-hover:bg-emerald-500'
  },
  {
    key: 'geriatri',
    bg: 'bg-yellow-100',
    icon: 'text-yellow-600',
    hover: 'group-hover:bg-yellow-500'
  },
  {
    key: 'rehabilitasi',
    bg: 'bg-fuchsia-100',
    icon: 'text-fuchsia-600',
    hover: 'group-hover:bg-fuchsia-500'
  },
  { key: 'kelamin', bg: 'bg-slate-100', icon: 'text-slate-600', hover: 'group-hover:bg-slate-500' },
  { key: 'otak', bg: 'bg-zinc-100', icon: 'text-zinc-600', hover: 'group-hover:bg-zinc-500' }
]

export function getPoliColor(poliName: string) {
  const lower = poliName.toLowerCase()
  const matched = POLI_COLORS.find((color) => color.key && lower.includes(color.key))
  if (matched) return matched

  let hash = 0
  for (let index = 0; index < poliName.length; index += 1) {
    hash = poliName.charCodeAt(index) + ((hash << 5) - hash)
  }

  return POLI_COLORS[Math.abs(hash) % POLI_COLORS.length]
}

export function readSelectedKioskaPoli(): KioskaPoliOption | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(KIOSKA_POLI_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as KioskaPoliOption
    if (!parsed || typeof parsed.id !== 'number' || !parsed.name) return null
    return parsed
  } catch {
    return null
  }
}

export function writeSelectedKioskaPoli(poli: KioskaPoliOption) {
  window.localStorage.setItem(KIOSKA_POLI_STORAGE_KEY, JSON.stringify(poli))
}

export function clearSelectedKioskaPoli() {
  window.localStorage.removeItem(KIOSKA_POLI_STORAGE_KEY)
}
