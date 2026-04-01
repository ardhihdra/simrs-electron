export const formatEnum = (v: string | null | undefined): string => {
    if (!v) return '-'
    return v
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
