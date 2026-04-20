import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, useLocation } from 'react-router'
import MainRoute from '@renderer/route'
import { App as AntdApp } from 'antd'
import { queryClient } from '@renderer/query-client'
import { useNotificationListener } from '@renderer/hooks/useNotificationListener'
import { ThemeProvider } from '@renderer/providers/ThemeProvider'
import { DesignSystemThemeProvider } from '@renderer/providers/DesignSystemThemeProvider'
import { getAppShellKind } from '@renderer/app-shell'

function AppShell() {
  const location = useLocation()
  const shellKind = getAppShellKind(location.pathname)

  if (shellKind === 'design-system') {
    return (
      <DesignSystemThemeProvider>
        <AntdApp>
          <MainRoute />
        </AntdApp>
      </DesignSystemThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <AntdApp>
        <MainRoute />
      </AntdApp>
    </ThemeProvider>
  )
}

function App() {
  useNotificationListener()
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </HashRouter>
  )
}

export default App
