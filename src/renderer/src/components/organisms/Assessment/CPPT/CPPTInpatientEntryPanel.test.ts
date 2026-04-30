/**
 * purpose: Validate static contracts for the new inpatient CPPT panel mockup parity and data-behavior markers.
 * main callers: test runner.
 * key dependencies: node:test, node:assert, node:fs.
 * main/public functions: static tests for `CPPTInpatientEntryPanel` source contracts.
 * important side effects: none.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('CPPT inpatient entry panel exposes required mockup sections', () => {
  const source = readFileSync(new URL('./CPPTInpatientEntryPanel.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes('Info Rawat Inap'), true)
  assert.equal(source.includes('Vital Sign Terkini'), true)
  assert.equal(source.includes('Alergi'), true)
  assert.equal(source.includes('Obat Aktif'), true)
  assert.equal(source.includes('CPPT / SOAP'), true)
  assert.equal(source.includes('Order Baru'), true)
  assert.equal(source.includes('Asuhan Keperawatan'), true)
  assert.equal(source.includes('Timeline'), true)
  assert.equal(source.includes('Tabel'), true)
  assert.equal(source.includes('Input CPPT Baru'), true)
})

test('CPPT inpatient entry panel maps active medication and encounter clinical data', () => {
  const source = readFileSync(new URL('./CPPTInpatientEntryPanel.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes("useQueryObservationByEncounter(encounterId)"), true)
  assert.equal(source.includes("useAllergyByEncounter(encounterId)"), true)
  assert.equal(source.includes("useMedicationRequestByEncounter(encounterId)"), true)
  assert.equal(source.includes("String(item?.status || '').toLowerCase() === 'active'"), true)
  assert.equal(source.includes('formatObservationSummary(observationData, conditionData)'), true)
})

test('CPPT inpatient entry panel keeps CPPT workflow markers (draft/final/edit/verify)', () => {
  const source = readFileSync(new URL('./CPPTInpatientEntryPanel.tsx', import.meta.url), 'utf8')

  assert.equal(source.includes("form.setFieldValue('status', 'preliminary')"), true)
  assert.equal(source.includes("form.setFieldValue('status', 'final')"), true)
  assert.equal(source.includes('const handleEdit = (record: CPPTCompositionRecord)'), true)
  assert.equal(source.includes('const handleVerify = async (record: CPPTCompositionRecord)'), true)
  assert.equal(source.includes('title === \'CPPT - Catatan Perkembangan Pasien Terintegrasi\''), true)
})
