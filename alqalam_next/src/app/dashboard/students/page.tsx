"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/modules/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createStudent, getStudents } from "@/lib/api";
import { getToken } from "@/features/auth/session";

export default function StudentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [full_name, setFullName] = useState("");
  const [class_id, setClassId] = useState("");

  const load = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getStudents(token);
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load students");
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
      await createStudent(token, { full_name, class_id });
      setFullName("");
      setClassId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create student failed");
    }
  };

  return (
    <AppShell title="Students Management">
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1.6fr" }}>
        <Card title="Add Student">
          <form className="grid" onSubmit={submit}>
            <Input label="Full Name" value={full_name} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Class ID" value={class_id} onChange={(e) => setClassId(e.target.value)} />
            <Button disabled={!full_name || !class_id}>Create Student</Button>
            {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
          </form>
        </Card>
        <Card title={`Students (${items.length})`}>
          <div className="grid">
            {items.slice(0, 20).map((s) => (
              <div key={s.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                <strong>{s.full_name}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                  Roll: {s.roll_number || "-"} | Class: {s.class_name || "-"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
