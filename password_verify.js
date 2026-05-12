'use strict';

const bcrypt = require('bcryptjs');

/** Matches login: bcrypt hashes or legacy/demo plaintext stored in password_hash. */
async function verifyStoredPassword(plain, password_hash) {
  if (password_hash == null || password_hash === '') return false;
  if (String(password_hash).startsWith('$2')) return bcrypt.compare(plain, password_hash);
  return plain === password_hash;
}

module.exports = { verifyStoredPassword };
