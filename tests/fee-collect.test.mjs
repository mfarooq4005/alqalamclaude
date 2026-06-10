import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverSrc = readFileSync(join(root, "alqalam_node_server.js"), "utf8");

test("fee collect accumulates partial payments instead of overwriting", () => {
  const block = serverSrc.slice(
    serverSrc.indexOf("app.post('/fee/collect'"),
    serverSrc.indexOf("app.get('/fee/arrears'")
  );
  assert.match(block, /amount_paid = amount_paid \+ \?/);
  assert.match(block, /IF\(amount_paid \+ \? >= amount_due/);
  assert.doesNotMatch(block, /SET amount_paid=\?,/);
});
