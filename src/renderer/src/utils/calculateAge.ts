export function calculateAge(input: string | Date): string {
  if (!input) {
    return '-'
  }

  let birth: Date

  if (typeof input === 'string') {
    // Validasi format YYYY-MM-DD
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(input)
    if (!isValidFormat) {
      throw new Error('Invalid date format. Use YYYY-MM-DD')
    }

    const [year, month, day] = input.split('-').map(Number)
    birth = new Date(year, month - 1, day)
  } else if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error('Invalid Date object')
    }

    // Normalize ke local date (hindari efek timezone jam)
    birth = new Date(input.getFullYear(), input.getMonth(), input.getDate())
  } else {
    throw new Error('Invalid input type')
  }

  const today = new Date()

  if (birth > today) {
    throw new Error('birthDate cannot be in the future')
  }

  let ageYears = today.getFullYear() - birth.getFullYear()
  let ageMonths = today.getMonth() - birth.getMonth()
  const ageDays = today.getDate() - birth.getDate()

  // Koreksi jika hari belum lewat
  if (ageDays < 0) {
    ageMonths -= 1
  }

  // Koreksi jika bulan negatif
  if (ageMonths < 0) {
    ageYears -= 1
    ageMonths += 12
  }

  return `${ageYears} tahun ${ageMonths} bulan`
}
