

export function convertFDIToNotation(fdi: string, notation: 'FDI' | 'Universal' | 'Palmer') {
    const num = fdi.replace('teeth-', '')

    const fdiToUniversal: Record<string, number> = {
        '11': 8,
        '12': 7,
        '13': 6,
        '14': 5,
        '15': 4,
        '16': 3,
        '17': 2,
        '18': 1,
        '21': 9,
        '22': 10,
        '23': 11,
        '24': 12,
        '25': 13,
        '26': 14,
        '27': 15,
        '28': 16,
        '31': 24,
        '32': 23,
        '33': 22,
        '34': 21,
        '35': 20,
        '36': 19,
        '37': 18,
        '38': 17,
        '41': 25,
        '42': 26,
        '43': 27,
        '44': 28,
        '45': 29,
        '46': 30,
        '47': 31,
        '48': 32
    }

    if (notation === 'Universal') {
        return String(fdiToUniversal[num] ?? num)
    }

    if (notation === 'Palmer') {
        const quadrant = num[0]
        const tooth = num[1]
        const symbols: Record<string, string> = {
            '1': 'UR', // upper right
            '2': 'UL', // upper left
            '3': 'LL', // lower left
            '4': 'LR' // lower right
        }
        return `${tooth}${symbols[quadrant] ?? ''}`
    }

    return num
}

export function getToothNotations(fdi: string) {
    const num = fdi.replace('teeth-', '')
    const universal = convertFDIToNotation(fdi, 'Universal')
    const palmer = convertFDIToNotation(fdi, 'Palmer')
    return {
        fdi: num,
        universal,
        palmer
    }
}

export function mapToCssVars(colors: Record<string, string | undefined>) {
    const cssVars: Record<string, string> = {}
    if (colors.darkBlue) {
        cssVars['--dark-blue'] = colors.darkBlue
    }
    if (colors.baseBlue) {
        cssVars['--base-blue'] = colors.baseBlue
    }
    if (colors.lightBlue) {
        cssVars['--light-blue'] = colors.lightBlue
    }
    return cssVars
}
