import { useEffect, useState, ReactNode } from 'react'
import { ConfigProvider, theme } from 'antd'
import { ThemeContext, type ThemeMode } from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode')
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme-mode', themeMode)
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const { defaultAlgorithm, darkAlgorithm } = theme

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm: themeMode === 'dark' ? darkAlgorithm : defaultAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
