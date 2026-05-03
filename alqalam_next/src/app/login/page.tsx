"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { login } from "@/lib/api";
import { saveSession } from "@/features/auth/session";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(username.trim(), password);
      saveSession(data.token, data.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ paddingTop: 50 }}>
      <Card title="Portal Login">
        <form onSubmit={submit} className="grid">
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button disabled={loading || !username || !password}>
            {loading ? "Signing in..." : "Login"}
          </Button>
          {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
        </form>
      </Card>
    </main>
  );
}
