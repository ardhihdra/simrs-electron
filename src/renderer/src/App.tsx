import { QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router'
import MainRoute from './route'
import { App as AntdApp } from 'antd'
import { queryClient } from './query-client'
import { useNotificationListener } from './hooks/useNotificationListener'

function App() {
  useNotificationListener()
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <MainRoute />
        </AntdApp>
      </QueryClientProvider>
    </HashRouter>
  )
}

export default App
