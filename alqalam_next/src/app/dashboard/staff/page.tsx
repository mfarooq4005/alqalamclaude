"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/modules/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createStaff, getStaff } from "@/lib/api";
import { getToken } from "@/features/auth/session";

export default function StaffPage() {
  const [items, setItems] = useState<any[]>([]);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getStaff(token);
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      await createStaff(token, { full_name, email, role_name: role });
      setFullName("");
      setEmail("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create staff failed");
    }
  };

  return (
    <AppShell title="Staff Management">
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1.6fr" }}>
        <Card title="Add Staff Member">
          <form className="grid" onSubmit={submit}>
            <Input label="Full Name" value={full_name} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Role (teacher/hr_manager/etc)" value={role} onChange={(e) => setRole(e.target.value)} />
            <Button disabled={!full_name || !email}>Create Staff</Button>
            {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
          </form>
        </Card>
        <Card title={`Staff (${items.length})`}>
          <div className="grid">
            {items.slice(0, 20).map((s) => (
              <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                <strong>{s.full_name}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                  Role: {s.role_name || "-"} | Phone: {s.phone || "-"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
