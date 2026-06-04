import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverSrc = readFileSync(join(root, "alqalam_node_server.js"), "utf8");

test("staff create uses teachers.salary not nonexistent basic_salary column", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("app.post('/staff'"),
    serverSrc.indexOf("app.put('/staff/:id'")
  );
  assert.match(block, /INSERT INTO teachers \(user_id, branch_id, qualification, joining_date, salary\)/);
  assert.doesNotMatch(block, /INSERT INTO teachers[^`]*basic_salary/);
});

test("staff update uses teachers.salary column", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("app.put('/staff/:id'"),
    serverSrc.indexOf("app.get('/salary/sheet'")
  );
  assert.match(block, /salary = COALESCE\(\?,salary\)/);
  assert.doesNotMatch(block, /basic_salary = COALESCE/);
});
