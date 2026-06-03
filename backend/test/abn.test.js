'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { validateAbn } = require('../src/services/abnService');

test('validateAbn — known valid ABN (51 824 753 556)', () => {
  const result = validateAbn('51824753556');
  assert.equal(result.isValid, true);
  assert.equal(result.formatted, '51 824 753 556');
});

test('validateAbn — invalid ABN returns false', () => {
  assert.equal(validateAbn('12345678901').isValid, false);
});

test('validateAbn — wrong length returns false', () => {
  assert.equal(validateAbn('1234567890').isValid, false);
});

test('validateAbn — strips spaces before validation', () => {
  const result = validateAbn('51 824 753 556');
  assert.equal(result.isValid, true);
});
