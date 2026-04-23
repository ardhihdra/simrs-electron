import { useNotificationListener } from '@renderer/hooks/useNotificationListener'
import { DesignSystemThemeProvider } from '@renderer/providers/DesignSystemThemeProvider'
import { queryClient } from '@renderer/query-client'
import MainRoute from '@renderer/route'
import { QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { HashRouter } from 'react-router'

function AppShell() {
  // const location = useLocation()
  // const shellKind = getAppShellKind(location.pathname)

  // if (shellKind === 'design-system') {
  //   return (
  //     <DesignSystemThemeProvider>
  //       <AntdApp>
  //         <MainRoute />
  //       </AntdApp>
  //     </DesignSystemThemeProvider>
  //   )
  // }

  return (
    <DesignSystemThemeProvider>
      <AntdApp>
        <MainRoute />
      </AntdApp>
    </DesignSystemThemeProvider>
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
