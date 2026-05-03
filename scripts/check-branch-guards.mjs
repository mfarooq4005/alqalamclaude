/**
 * Static checks that critical routes scope data by branch (no DB required).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, "..", "alqalam_node_server.js"), "utf8");

const idxGetStudent = src.indexOf("app.get('/students/:id'");
assert.ok(idxGetStudent >= 0, "GET /students/:id route missing");
const getStudentBlock = src.slice(idxGetStudent, idxGetStudent + 800);
assert.match(
  getStudentBlock,
  /WHERE s\.id = \? AND s\.branch_id = \?/,
  "GET /students/:id must filter by s.branch_id"
);

const idxPostSections = src.indexOf("app.post('/sections'");
assert.ok(idxPostSections >= 0, "POST /sections route missing");
const postSectionsBlock = src.slice(idxPostSections, idxPostSections + 900);
assert.ok(
  postSectionsBlock.includes("req.user.branch_id"),
  "POST /sections must verify class belongs to caller branch"
);

console.log("branch guard checks: OK");
