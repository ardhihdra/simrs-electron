import assert from 'node:assert/strict'
import test from 'node:test'

import {
  closeDashboardTab,
  isCloseActiveTabShortcut,
  ensureDashboardTab,
  resolveInitialDashboardTabs,
  syncDashboardTabsWithLocation,
  type DashboardTabItem
} from './Dashboard.shell.helpers.ts'

const registrationTab: DashboardTabItem = {
  key: '/dashboard/registration/manage',
  label: 'Pendaftaran'
}

const patientTab: DashboardTabItem = {
  key: '/dashboard/patient',
  label: 'Pasien'
}

test('ensureDashboardTab appends a missing tab and activates it', () => {
  const result = ensureDashboardTab([registrationTab], patientTab)

  assert.deepEqual(result.tabs, [registrationTab, patientTab])
  assert.equal(result.activeKey, patientTab.key)
})

test('ensureDashboardTab reuses an existing tab instead of duplicating it', () => {
  const result = ensureDashboardTab([registrationTab, patientTab], patientTab)

  assert.deepEqual(result.tabs, [registrationTab, patientTab])
  assert.equal(result.activeKey, patientTab.key)
})

test('resolveInitialDashboardTabs restores the active route into the tab list', () => {
  const result = resolveInitialDashboardTabs({
    pathname: patientTab.key,
    fallbackTab: registrationTab,
    findTab: (key) => (key === patientTab.key ? patientTab : undefined)
  })

  assert.deepEqual(result.tabs, [patientTab])
  assert.equal(result.activeKey, patientTab.key)
})

test('closeDashboardTab falls back to the previous sibling when closing the active tab', () => {
  const result = closeDashboardTab({
    tabs: [registrationTab, patientTab],
    activeKey: patientTab.key,
    closingKey: patientTab.key,
    fallbackTab: registrationTab
  })

  assert.deepEqual(result.tabs, [registrationTab])
  assert.equal(result.activeKey, registrationTab.key)
})

test('syncDashboardTabsWithLocation keeps the same state object when the active location tab is already selected', () => {
  const currentState = {
    tabs: [registrationTab, patientTab],
    activeKey: patientTab.key
  }

  const result = syncDashboardTabsWithLocation(currentState, patientTab)

  assert.equal(result, currentState)
})

test('syncDashboardTabsWithLocation activates an existing tab without duplicating it', () => {
  const currentState = {
    tabs: [registrationTab, patientTab],
    activeKey: registrationTab.key
  }

  const result = syncDashboardTabsWithLocation(currentState, patientTab)

  assert.notEqual(result, currentState)
  assert.deepEqual(result.tabs, [registrationTab, patientTab])
  assert.equal(result.activeKey, patientTab.key)
})

test('isCloseActiveTabShortcut returns true for Ctrl+W without extra modifiers', () => {
  assert.equal(
    isCloseActiveTabShortcut({
      key: 'w',
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false
    }),
    true
  )
})

test('isCloseActiveTabShortcut returns false when Ctrl is missing or extra modifiers are pressed', () => {
  assert.equal(
    isCloseActiveTabShortcut({
      key: 'w',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false
    }),
    false
  )
  assert.equal(
    isCloseActiveTabShortcut({
      key: 'w',
      ctrlKey: true,
      metaKey: false,
      altKey: true,
      shiftKey: false
    }),
    false
  )
})
