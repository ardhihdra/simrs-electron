import { DEFAULT_THEME_KEY, THEME_REGISTRY } from '@renderer/themes/index'
import { ConfigProvider, theme } from 'antd'
import { useEffect, useState } from 'react'
import { ThemeContext, type ThemeMode } from './theme-context'

export function ThemeProvider({ children }: { children: any }) {
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
