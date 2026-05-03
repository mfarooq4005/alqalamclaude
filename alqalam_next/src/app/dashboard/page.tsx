"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getHealth } from "@/lib/api";
import { AppShell } from "@/components/modules/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clearSession, getToken, getUser } from "@/features/auth/session";

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("User");
  const [role, setRole] = useState("-");
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    setName(user.full_name || user.username || "User");
    setRole(user.role || "-");

    getHealth()
      .then(setHealth)
      .catch((e) => setError(e?.message || "Health check failed"));
  }, [router]);

  const logout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <AppShell title="Admin Dashboard">
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", marginBottom: 14 }}>
        <StatCard label="Active User" value={name} />
        <StatCard label="Role" value={role} tone="var(--brand)" />
        <StatCard label="Platform" value="Next + Node" tone="var(--success)" />
      </div>
      <Card title="Backend Health" right={<Button variant="danger" onClick={logout}>Logout</Button>}>
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(health, null, 2)}</pre>
      </Card>
    </AppShell>
  );
}
