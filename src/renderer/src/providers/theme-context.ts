import { createContext, useContext } from 'react'
import type { ThemeMode } from '@renderer/themes/index'

export type { ThemeMode }

export interface ThemeContextType {
  themeMode: ThemeMode
  toggleTheme: () => void
  setThemeMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

