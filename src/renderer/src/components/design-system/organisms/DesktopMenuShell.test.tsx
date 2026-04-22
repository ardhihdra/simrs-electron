import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'

import { DesktopMenuShell } from './DesktopMenuShell.tsx'

test('DesktopMenuShell renders the status bar outside the sidebar/content split so it spans the full shell width', () => {
  const markup = renderToStaticMarkup(
    <DesktopMenuShell
      moduleItems={[{ key: 'dashboard', label: 'Dashboard' }]}
      activeModuleKey="dashboard"
      sidebarItems={[
        {
          key: 'pages',
          label: 'Pages',
          items: [{ key: 'queue', label: 'Queue' }]
        }
      ]}
      activeSidebarKey="queue"
      tabs={[{ key: 'queue', label: 'Queue', closable: true }]}
      activeTabKey="queue"
      statusBar={<div data-testid="status-bar">Status Bar</div>}
    >
      <div data-testid="content">Dashboard Content</div>
    </DesktopMenuShell>
  )

  assert.match(
    markup,
    /<div data-testid="content">Dashboard Content<\/div><\/div><\/div><div data-testid="status-bar">Status Bar<\/div>/
  )
})
