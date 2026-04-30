/**
 * purpose: Validate dashboard shell helper behavior for tabs, shortcuts, and content-only route detection.
 * main callers: test runner.
 * key dependencies: Node assert/test and `Dashboard.shell.helpers` exports.
 * main/public functions: test cases for helper contracts.
 * important side effects: none.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  closeDashboardTab,
  isCloseActiveTabShortcut,
  isDashboardContentOnlyRoute,
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

test('ensureDashboardTab keeps at most five tabs by replacing the oldest inactive tab', () => {
  const billingTab: DashboardTabItem = {
    key: '/dashboard/non-medic-queue/billing',
    label: 'Billing'
  }
  const cashierTab: DashboardTabItem = {
    key: '/dashboard/non-medic-queue/cashier',
    label: 'Kasir'
  }
  const pharmacyTab: DashboardTabItem = {
    key: '/dashboard/non-medic-queue/pharmacy',
    label: 'Farmasi'
  }
  const queueTab: DashboardTabItem = {
    key: '/dashboard/queue',
    label: 'Monitor Antrian'
  }
  const doctorScheduleTab: DashboardTabItem = {
    key: '/dashboard/registration/doctor-schedule',
    label: 'Jadwal Dokter'
  }

  const result = ensureDashboardTab(
    [registrationTab, patientTab, billingTab, cashierTab, pharmacyTab],
    doctorScheduleTab,
    registrationTab.key
  )

  assert.deepEqual(result.tabs, [
    registrationTab,
    billingTab,
    cashierTab,
    pharmacyTab,
    doctorScheduleTab
  ])
  assert.equal(result.activeKey, doctorScheduleTab.key)
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

test('syncDashboardTabsWithLocation keeps at most five tabs when location changes to a new route', () => {
  const billingTab: DashboardTabItem = {
    key: '/dashboard/non-medic-queue/billing',
    label: 'Billing'
  }
  const cashierTab: DashboardTabItem = {
    key: '/dashboard/non-medic-queue/cashier',
    label: 'Kasir'
  }
  const pharmacyTab: DashboardTabItem = {
    key: '/dashboard/non-medic-queue/pharmacy',
    label: 'Farmasi'
  }
  const queueTab: DashboardTabItem = {
    key: '/dashboard/queue',
    label: 'Monitor Antrian'
  }

  const currentState = {
    tabs: [registrationTab, patientTab, billingTab, cashierTab, pharmacyTab],
    activeKey: registrationTab.key
  }

  const result = syncDashboardTabsWithLocation(currentState, queueTab)

  assert.deepEqual(result.tabs, [registrationTab, billingTab, cashierTab, pharmacyTab, queueTab])
  assert.equal(result.activeKey, queueTab.key)
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

test('isDashboardContentOnlyRoute returns true for dashboard content fullscreen query', () => {
  assert.equal(
    isDashboardContentOnlyRoute('/dashboard/rawat-inap/bed-map', '?contentFullscreen=1'),
    true
  )
  assert.equal(
    isDashboardContentOnlyRoute('/dashboard/rawat-inap/bed-map', '?foo=bar&contentFullscreen=true'),
    true
  )
})

test('isDashboardContentOnlyRoute keeps doctor workspace routes content-only', () => {
  assert.equal(isDashboardContentOnlyRoute('/dashboard/doctor/enc-1', ''), true)
  assert.equal(
    isDashboardContentOnlyRoute('/dashboard/nurse-calling/medical-record/enc-1', ''),
    true
  )
  assert.equal(isDashboardContentOnlyRoute('/dashboard/rawat-inap/daftar-pasien/enc-1', ''), true)
  assert.equal(
    isDashboardContentOnlyRoute('/dashboard/rawat-inap/daftar-pasien/enc-1/cppt', ''),
    true
  )
  assert.equal(
    isDashboardContentOnlyRoute('/dashboard/rawat-inap/daftar-pasien/enc-1/vital-signs', ''),
    true
  )
})

test('isDashboardContentOnlyRoute returns false for regular dashboard routes', () => {
  assert.equal(isDashboardContentOnlyRoute('/dashboard/rawat-inap/bed-map', ''), false)
  assert.equal(isDashboardContentOnlyRoute('/dashboard/rawat-inap/bed-map', '?contentFullscreen=0'), false)
  assert.equal(isDashboardContentOnlyRoute('/dashboard/rawat-inap/bed-map', '?contentFullscreen=false'), false)
})
