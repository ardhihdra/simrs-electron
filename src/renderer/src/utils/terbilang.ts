/**
 * Fungsi untuk mengubah angka menjadi kata-kata (Terbilang) dalam Bahasa Indonesia.
 */
export function terbilang(n: number): string {
    if (n === 0) return 'Nol Rupiah'

    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
    
    const konversi = (num: number): string => {
        let result = ''
        if (num < 12) {
            result = units[num]
        } else if (num < 20) {
            result = konversi(num - 10) + ' Belas'
        } else if (num < 100) {
            result = konversi(Math.floor(num / 10)) + ' Puluh ' + konversi(num % 10)
        } else if (num < 200) {
            result = 'Seratus ' + konversi(num - 100)
        } else if (num < 1000) {
            result = konversi(Math.floor(num / 100)) + ' Ratus ' + konversi(num % 100)
        } else if (num < 2000) {
            result = 'Seribu ' + konversi(num - 1000)
        } else if (num < 1000000) {
            result = konversi(Math.floor(num / 1000)) + ' Ribu ' + konversi(num % 1000)
        } else if (num < 1000000000) {
            result = konversi(Math.floor(num / 1000000)) + ' Juta ' + konversi(num % 1000000)
        } else if (num < 1000000000000) {
            result = konversi(Math.floor(num / 1000000000)) + ' Miliar ' + konversi(num % 1000000000)
        } else if (num < 1000000000000000) {
            result = konversi(Math.floor(num / 1000000000000)) + ' Triliun ' + konversi(num % 1000000000000)
        }
        return result.trim()
    }

    const output = konversi(Math.floor(n))
    return (output + ' Rupiah').replace(/\s+/g, ' ')
}
