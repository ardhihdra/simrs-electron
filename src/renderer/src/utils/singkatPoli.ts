export function singkatPoli(namaPoli?: string): string | undefined {
  if (!namaPoli) return undefined

  return namaPoli
    .trim()
    .split(/\s+/) // pisah berdasarkan spasi
    .map((kata) => kata[0]) // ambil huruf pertama
    .join('')
    .toUpperCase()
}
