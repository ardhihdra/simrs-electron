export function singkatPoli(namaPoli?: string): string | undefined {
  if (!namaPoli) return undefined

  let cleanName = namaPoli.trim()
  if (cleanName.toLowerCase().startsWith('poli ')) {
    cleanName = cleanName.substring(5).trim()
  }

  const words = cleanName.split(/\s+/)
  if (words.length === 1) {
    return cleanName.substring(0, 3).toUpperCase()
  }

  return words
    .map((kata) => kata[0]) // ambil huruf pertama
    .join('')
    .toUpperCase()
}
