import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="container" style={{ padding: "24px 0 40px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>AL Qalam Ultimate School Platform</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/dashboard/students"><Button variant="ghost">Students</Button></Link>
          <Link href="/dashboard/staff"><Button variant="ghost">Staff</Button></Link>
          <Link href="/dashboard/attendance"><Button variant="ghost">Attendance</Button></Link>
          <Link href="/dashboard/fee"><Button variant="ghost">Fee</Button></Link>
        </div>
      </header>
      {children}
    </main>
  );
}
