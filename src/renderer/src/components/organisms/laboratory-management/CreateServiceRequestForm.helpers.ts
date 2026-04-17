export function resolveActiveServiceRequestCategory(
  availableCategories: string[],
  currentCategory?: string | null
): string | undefined {
  if (currentCategory && availableCategories.includes(currentCategory)) {
    return currentCategory
  }

  return availableCategories[0]
}
