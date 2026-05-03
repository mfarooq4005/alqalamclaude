"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/modules/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { collectFee, generateChallans, getArrears, getChallans } from "@/lib/api";
import { getToken } from "@/features/auth/session";

export default function FeePage() {
  const [challans, setChallans] = useState<any[]>([]);
  const [arrears, setArrears] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [month, setMonth] = useState("");
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const c = await getChallans(token);
      const a = await getArrears(token);
      setChallans(c.items || []);
      setArrears(a.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fee fetch failed");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      await generateChallans(token, { class_id: Number(classId), month });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Challan generation failed");
    }
  };

  const collect = async (e: FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    try {
      await collectFee(token, { student_id: Number(studentId), amount_paid: Number(amount), payment_method: "cash" });
      setStudentId("");
      setAmount("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fee collect failed");
    }
  };

  return (
    <AppShell title="Fee and Challan Operations">
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 1.6fr" }}>
        <Card title="Generate Challans">
          <form className="grid" onSubmit={generate}>
            <Input label="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} />
            <Input label="Month (YYYY-MM)" value={month} onChange={(e) => setMonth(e.target.value)} />
            <Button disabled={!classId || !month}>Generate</Button>
          </form>
          <form className="grid" style={{ marginTop: 14 }} onSubmit={collect}>
            <Input label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            <Input label="Amount Paid" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Button disabled={!studentId || !amount}>Collect Fee</Button>
          </form>
          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        </Card>

        <Card title={`Challans (${challans.length}) / Arrears (${arrears.length})`}>
          <div className="grid">
            {challans.slice(0, 12).map((row) => (
              <div key={row.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                <strong>{row.student_name || "Student"}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                  Due: {row.amount_due} | Paid: {row.amount_paid} | Status: {row.status}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
