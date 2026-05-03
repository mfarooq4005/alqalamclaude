const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:3000";
const username = process.env.SMOKE_USERNAME;
const password = process.env.SMOKE_PASSWORD;

if (!username || !password) {
  console.error("Missing SMOKE_USERNAME or SMOKE_PASSWORD");
  process.exit(1);
}

async function req(path, options = {}, token) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`${path} failed: ${json.error || res.statusText}`);
  }
  return json.data;
}

const run = async () => {
  const auth = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  const token = auth.token;
  await req("/auth/me", {}, token);
  await req("/students", {}, token);
  await req("/staff", {}, token);
  await req("/attendance/today", {}, token);
  await req("/fee/challans", {}, token);
  await req("/fee/arrears", {}, token);
  console.log("Smoke OK");
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
