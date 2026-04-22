import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPatientListParams } from './visit-management'

test('visit management patient list params include birthDate and age', () => {
  const params = buildPatientListParams({
    name: 'Budi',
    birthDate: '1996-04-20',
    age: 30
  })

  assert.equal(params.get('name'), 'Budi')
  assert.equal(params.get('birthDate'), '1996-04-20')
  assert.equal(params.get('age'), '30')
})

test('visit management patient list params omit empty birthDate and undefined age', () => {
  const params = buildPatientListParams({
    name: '',
    birthDate: '',
    age: undefined
  })

  assert.equal(params.has('name'), false)
  assert.equal(params.has('birthDate'), false)
  assert.equal(params.has('age'), false)
})
