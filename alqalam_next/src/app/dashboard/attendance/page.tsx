"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/modules/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAttendanceToday, markAttendance } from "@/lib/api";
import { getToken } from "@/features/auth/session";

export default function AttendancePage() {
  const [classId, setClassId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState("present");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await getAttendanceToday(token, classId || undefined);
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Attendance fetch failed");
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
      await markAttendance(token, {
        class_id: classId,
        records: [{ student_id: Number(studentId), status }],
      });
      setStudentId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Attendance mark failed");
    }
  };

  return (
    <AppShell title="Attendance Operations">
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1.6fr" }}>
        <Card title="Mark Attendance">
          <form className="grid" onSubmit={submit}>
            <Input label="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} />
            <Input label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            <Input label="Status (present/absent/late)" value={status} onChange={(e) => setStatus(e.target.value)} />
            <Button disabled={!classId || !studentId}>Save Attendance</Button>
            <Button type="button" variant="ghost" onClick={load}>Refresh Today</Button>
            {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
          </form>
        </Card>
        <Card title={`Today Records (${items.length})`}>
          <div className="grid">
            {items.slice(0, 30).map((a, idx) => (
              <div key={`${a.student_id}-${idx}`} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                <strong>{a.full_name || a.student_id}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                  Status: {a.status} | Class: {a.class_name || "-"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
