import { useEffect, useState, ReactNode } from 'react'
import { ConfigProvider, theme } from 'antd'
import { ThemeContext, type ThemeMode } from './theme-context'
import { THEME_REGISTRY, DEFAULT_THEME_KEY } from '@renderer/themes/index'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode')
    return (saved && saved in THEME_REGISTRY ? saved : DEFAULT_THEME_KEY) as ThemeMode
  })

  useEffect(() => {
    localStorage.setItem('theme-mode', themeMode)
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const { defaultAlgorithm, darkAlgorithm } = theme
  const activeTheme = THEME_REGISTRY[themeMode] ?? THEME_REGISTRY[DEFAULT_THEME_KEY]

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, setThemeMode }}>
      <ConfigProvider
        theme={{
          algorithm: activeTheme.algorithm === 'dark' ? darkAlgorithm : defaultAlgorithm,
          token: activeTheme.token
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
