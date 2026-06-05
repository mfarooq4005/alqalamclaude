import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverSrc = readFileSync(join(root, "alqalam_node_server.js"), "utf8");

test("fee challan generate uses schema-aligned fee_payments columns", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("app.post('/fee/challans/generate'"),
    serverSrc.indexOf("app.post('/fee/advance'")
  );
  assert.match(block, /fee_structure_id/);
  assert.doesNotMatch(block, /INSERT INTO fee_payments \(student_id, branch_id/);
  assert.doesNotMatch(block, /updated_at=NOW\(\)/);
});

test("fee challan regenerate does not overwrite paid challan amounts", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("ON DUPLICATE KEY UPDATE"),
    serverSrc.indexOf("io.emit('challans_generated'")
  );
  assert.match(block, /IF\(status IN \('pending','partial','overdue'\)/);
});

test("section create validates class belongs to requester branch", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("app.post('/sections'"),
    serverSrc.indexOf("// ══════════════════════════════════════════════════════════════\n//  ROUTE: FEE")
  );
  assert.match(block, /classes WHERE id = \? AND branch_id = \?/);
});

test("student detail is scoped by branch", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("app.get('/students/:id'"),
    serverSrc.indexOf("app.post('/students'")
  );
  assert.match(block, /s\.branch_id = \?/);
});
