import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mapCitoToServiceRequestPriority,
  resolveActiveServiceRequestCategory
} from './CreateServiceRequestForm.helpers'

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

test('mapCitoToServiceRequestPriority maps false to routine and true to stat', () => {
  assert.equal(mapCitoToServiceRequestPriority(false), 'routine')
  assert.equal(mapCitoToServiceRequestPriority(true), 'stat')
})
