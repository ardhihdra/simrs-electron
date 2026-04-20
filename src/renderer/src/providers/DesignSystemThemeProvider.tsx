import { THEME_REGISTRY, type ThemeMode } from '@renderer/themes/index'
import {
  buildDesktopCssVariables,
  desktopThemeTokens
} from '@renderer/components/design-system/foundation/desktop-theme'
import { ConfigProvider, theme } from 'antd'
import { useEffect, useState } from 'react'
import { ThemeContext } from './theme-context'

const DESIGN_SYSTEM_THEME_KEY = 'design-system-theme-mode'
const DESIGN_SYSTEM_DEFAULT_THEME: ThemeMode = 'desktop'

function normalizeDesignSystemTheme(_: ThemeMode | null): ThemeMode {
  return DESIGN_SYSTEM_DEFAULT_THEME
}

export function DesignSystemThemeProvider({ children }: { children: any }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(DESIGN_SYSTEM_THEME_KEY)
    const nextTheme =
      saved && saved in THEME_REGISTRY ? (saved as ThemeMode) : DESIGN_SYSTEM_DEFAULT_THEME
    return normalizeDesignSystemTheme(nextTheme)
  })

  useEffect(() => {
    localStorage.setItem(DESIGN_SYSTEM_THEME_KEY, themeMode)
    document.documentElement.dataset.designSystemTheme = themeMode

    return () => {
      delete document.documentElement.dataset.designSystemTheme
    }
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode(DESIGN_SYSTEM_DEFAULT_THEME)
  }

  const { defaultAlgorithm, darkAlgorithm } = theme
  const activeTheme = THEME_REGISTRY[themeMode] ?? THEME_REGISTRY[DESIGN_SYSTEM_DEFAULT_THEME]
  const cssVariables = buildDesktopCssVariables(desktopThemeTokens)

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        toggleTheme,
        setThemeMode: (mode) => setThemeMode(normalizeDesignSystemTheme(mode))
      }}
    >
      <ConfigProvider
        theme={{
          algorithm: activeTheme.algorithm === 'dark' ? darkAlgorithm : defaultAlgorithm,
          token: activeTheme.token
        }}
      >
        <div
          className="desktop-theme-scope min-h-screen"
          style={{
            ...cssVariables,
            fontFamily: `var(--ds-font-sans), var(--ds-font-sans-fallback)`,
            backgroundColor: 'var(--ds-color-background)',
            color: 'var(--ds-color-text)'
          }}
        >
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
