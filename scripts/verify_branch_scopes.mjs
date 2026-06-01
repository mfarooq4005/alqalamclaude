/**
 * Static checks: critical routes must tie reads/writes to branch_id.
 * Run with: node scripts/verify_branch_scopes.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, "..", "alqalam_node_server.js"), "utf8");

const mustContain = [
  ["GET /students/:id branch filter", "WHERE s.id = ? AND s.branch_id = ?"],
  ["fee/collect pending lookup joins students", "fp.student_id = ? AND st.branch_id = ?"],
  ["fee/collect WhatsApp lookup scoped", "WHERE s.id=? AND s.branch_id=?"],
  ["fee/advance student branch check", "FROM students WHERE id = ? AND branch_id = ?"],
  ["attendance/bulk class branch check", "FROM classes WHERE id = ? AND branch_id = ?"],
  ["attendance/bulk students in class", "FROM students WHERE branch_id = ? AND class_id = ?"],
  ["sections POST class ownership", "FROM classes WHERE id = ? AND branch_id = ?"],
  ["library issue book branch", "library_books WHERE id=? AND branch_id=?"],
  ["library issue student branch", "FROM students WHERE id=? AND branch_id=?"],
  ["library return branch-scoped select", "b.branch_id = ?"],
  ["transport route students join routes", "JOIN transport_routes tr ON ts.route_id = tr.id"],
  ["transport enroll route branch", "transport_routes WHERE id = ? AND branch_id = ?"],
  ["exam schedule joins exams branch", "JOIN exams ex ON es.exam_id = ex.id"],
  ["exam results scope", "FROM exams e"],
  ["fee closing branch override super_admin only", "req.user.role === 'super_admin' && branch_id"],
];

let failed = 0;
for (const [label, needle] of mustContain) {
  if (!src.includes(needle)) {
    console.error(`FAIL: ${label} — missing substring:\n  ${needle}`);
    failed++;
  }
}

if (failed) process.exit(1);
console.log(`OK: ${mustContain.length} branch-scope checks passed`);
