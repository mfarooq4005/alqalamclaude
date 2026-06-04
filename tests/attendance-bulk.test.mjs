import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverSrc = readFileSync(join(root, "alqalam_node_server.js"), "utf8");

test("attendance bulk inserts required section_id column", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("app.post('/attendance/bulk'"),
    serverSrc.indexOf("app.post('/staff/checkin'")
  );
  assert.match(block, /INSERT INTO student_attendance \(student_id, section_id/);
  assert.doesNotMatch(block, /INSERT INTO student_attendance \(student_id, date, status/);
});

test("attendance bulk validates students belong to class and branch", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("app.post('/attendance/bulk'"),
    serverSrc.indexOf("app.post('/staff/checkin'")
  );
  assert.match(block, /WHERE branch_id = \? AND class_id = \? AND id IN/);
});
