import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverSrc = readFileSync(join(__dirname, "../alqalam_node_server.js"), "utf8");

test("GET /students/:id requires staff roles and branch scope", () => {
  const marker = "app.get('/students/:id'";
  const start = serverSrc.indexOf(marker);
  assert.ok(start >= 0, "students/:id route missing");
  const block = serverSrc.slice(start, start + 650);
  assert.match(
    block,
    /auth\(\[\s*'super_admin'/,
    "students/:id should use same role guard as /students list"
  );
  assert.match(block, /WHERE s\.id = \? AND s\.branch_id = \?/);
});

test("POST /fee/collect resolves pending row via student branch", () => {
  assert.match(
    serverSrc,
    /SELECT fp\.id FROM fee_payments fp\s*\n\s*INNER JOIN students s ON fp\.student_id = s\.id/
  );
  assert.match(serverSrc, /s\.branch_id = \?\s*\n\s*ORDER BY fp\.due_date ASC LIMIT 1/);
  assert.match(serverSrc, /UPDATE fee_payments SET[\s\S]*WHERE id = \?/m);
});

test("POST /fee/advance verifies student belongs to branch", () => {
  const marker = "app.post('/fee/advance'";
  const start = serverSrc.indexOf(marker);
  assert.ok(start >= 0);
  const block = serverSrc.slice(start, start + 900);
  assert.match(block, /FROM students WHERE id = \? AND branch_id = \?/);
  assert.match(block, /Student not found/);
});
