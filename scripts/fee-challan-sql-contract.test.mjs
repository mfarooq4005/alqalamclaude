/**
 * Static contract test: fee challan INSERT must match fee_payments schema.
 * Run: node scripts/fee-challan-sql-contract.test.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = readFileSync(join(root, 'alqalam_node_server.js'), 'utf8');
const schema = readFileSync(join(root, 'alqalam_database.sql'), 'utf8');

function parseTableColumns(sql, tableName) {
  const match = sql.match(new RegExp(`CREATE TABLE ${tableName} \\(([\\s\\S]*?)\\);`));
  if (!match) throw new Error(`Table ${tableName} not found in schema`);
  return [...match[1].matchAll(/^\s+(\w+)\s+/gm)].map((m) => m[1]);
}

function extractChallanInsertColumns(serverSource) {
  const block = serverSource.slice(
    serverSource.indexOf("app.post('/fee/challans/generate'"),
    serverSource.indexOf("app.post('/fee/advance'")
  );
  const insert = block.match(/INSERT INTO fee_payments \(([^)]+)\)/);
  if (!insert) throw new Error('Challan INSERT not found');
  return insert[1].split(',').map((c) => c.trim());
}

const feePaymentsCols = new Set(parseTableColumns(schema, 'fee_payments'));
const insertCols = extractChallanInsertColumns(server);

const forbidden = ['branch_id', 'month', 'created_by', 'updated_at'];
const missingRequired = ['fee_structure_id'].filter((c) => !insertCols.includes(c));
const unknownCols = insertCols.filter((c) => !feePaymentsCols.has(c));
const stillForbidden = insertCols.filter((c) => forbidden.includes(c));

const errors = [];
if (missingRequired.length) errors.push(`Missing required columns: ${missingRequired.join(', ')}`);
if (unknownCols.length) errors.push(`Unknown columns in INSERT: ${unknownCols.join(', ')}`);
if (stillForbidden.length) errors.push(`Forbidden legacy columns still present: ${stillForbidden.join(', ')}`);

if (!server.includes("IF(status IN ('pending','partial')")) {
  errors.push('ON DUPLICATE KEY UPDATE must not overwrite paid challans');
}

if (!server.includes('Class not found in your branch')) {
  errors.push('POST /sections must validate class belongs to user branch');
}

if (errors.length) {
  console.error('fee-challan-sql-contract.test.mjs FAILED');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log('fee-challan-sql-contract.test.mjs OK');
