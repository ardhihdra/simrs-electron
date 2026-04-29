import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('Doctor workspace uses reusable disposition workflow for finish examination actions', () => {
  const source = readFileSync(new URL('./doctor-workspace.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes('DesktopDispositionWorkflow'), true)
  assert.equal(source.includes('DischargeModal'), false)
  assert.equal(source.includes('openDispositionWorkflow'), true)
  assert.equal(source.includes('finishEncounterFromCloseReminder'), true)
  assert.equal(source.includes('openDispositionWorkflow(true)'), true)
})

test('Doctor patient list uses reusable disposition workflow for finish examination action', () => {
  const source = readFileSync(new URL('./doctor-patient-list.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes('Manajemen pelayanan pasien Rawat Jalan, Inap, dan IGD'), true)
  assert.equal(source.includes('DesktopDispositionWorkflow'), true)
  assert.equal(source.includes('DischargeModal'), false)
  assert.equal(source.includes('dispositionRecord'), true)
  assert.equal(source.includes('client.registration.dischargeEncounter.useMutation'), true)
})
