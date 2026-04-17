import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveActiveServiceRequestCategory } from './CreateServiceRequestForm.helpers'

test('resolveActiveServiceRequestCategory keeps current category when still available', () => {
  assert.equal(
    resolveActiveServiceRequestCategory(['hematology', 'chemistry'], 'chemistry'),
    'chemistry'
  )
})

test('resolveActiveServiceRequestCategory falls back to first available category when needed', () => {
  assert.equal(
    resolveActiveServiceRequestCategory(['hematology', 'chemistry'], 'microbiology'),
    'hematology'
  )
  assert.equal(resolveActiveServiceRequestCategory([], 'chemistry'), undefined)
})
