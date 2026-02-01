import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router'
import MainRoute from '@renderer/route'
import { App as AntdApp } from 'antd'
import { queryClient } from '@renderer/query-client'
import { useNotificationListener } from '@renderer/hooks/useNotificationListener'
import { ThemeProvider } from '@renderer/providers/ThemeProvider'

function App() {
  useNotificationListener()
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AntdApp>
            <MainRoute />
          </AntdApp>
        </ThemeProvider>
      </QueryClientProvider>
    </HashRouter>
  )
}

export default App
