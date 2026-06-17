'use strict';

const assert = require('assert');
const bcrypt = require('bcryptjs');
const { verifyStoredPassword } = require('../password_verify');

(async () => {
  const hash = await bcrypt.hash('SecretPass9', 4);
  assert.strictEqual(await verifyStoredPassword('SecretPass9', hash), true);
  assert.strictEqual(await verifyStoredPassword('wrong', hash), false);
  assert.strictEqual(await verifyStoredPassword('plain.demo', 'plain.demo'), true);
  assert.strictEqual(await verifyStoredPassword('x', 'plain.demo'), false);
  assert.strictEqual(await verifyStoredPassword('x', ''), false);
  assert.strictEqual(await verifyStoredPassword('x', null), false);
  console.log('password_verify tests OK');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
