export function resolveActiveServiceRequestCategory(
  availableCategories: string[],
  currentCategory?: string | null
): string | undefined {
  if (currentCategory && availableCategories.includes(currentCategory)) {
    return currentCategory
  }

  return availableCategories[0]
}

export function mapCitoToServiceRequestPriority(cito?: boolean | null): 'routine' | 'stat' {
  return cito ? 'stat' : 'routine'
}
