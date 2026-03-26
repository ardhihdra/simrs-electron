export const CATEGORY_TYPES = [
  'obat',
  'non-obat',
  'alkes',
  'bmhp',
  'reagen',
  'umum',
  'kosmetik',
  'rumahtangga',
  'makanan',
  'minuman',
  'bahan_baku',
  'bpjs'
] as const

export type CategoryType = typeof CATEGORY_TYPES[number]

export const CategoryTypeLabels: Record<CategoryType, string> = {
  'obat': 'Obat',
  'non-obat': 'Non Obat',
  'alkes': 'Alat Kesehatan',
  'bmhp': 'BMHP',
  'reagen': 'Reagen',
  'umum': 'Umum',
  'kosmetik': 'Kosmetik',
  'rumahtangga': 'Rumah Tangga',
  'makanan': 'Makanan',
  'minuman': 'Minuman',
  'bahan_baku': 'Bahan Baku',
  'bpjs': 'BPJS'
}
