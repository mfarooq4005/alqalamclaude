import Link from "next/link";
import { StreamActivities } from "@/components/modules/StreamActivities";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <main>
      <section className="container" style={{ padding: "48px 0 18px" }}>
        <p style={{ margin: 0, color: "var(--brand)", fontWeight: 700 }}>AL Qalam International</p>
        <h1 style={{ margin: "6px 0 10px", fontSize: 44, lineHeight: 1.1 }}>
          Ultimate Schooling Platform
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 760 }}>
          Interactive, colorful, and future-ready school ERP for management, teachers, students, and parents.
          Core academics, attendance, staff, fee challan generation, and real-time sync all in one place.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <Link href="/login"><Button>Start Portal Login</Button></Link>
          <Link href="/dashboard"><Button variant="ghost">View Admin Console</Button></Link>
        </div>
      </section>

      <section className="container grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <Card title="3D-ready Learning Experience">
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Landing and activity zones are structured for motion/3D module enhancement without blocking low-end devices.
          </p>
        </Card>
        <Card title="Unified Core Modules">
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Students, staff, attendance, fee operations, and reports are synced through one API contract.
          </p>
        </Card>
        <Card title="Separate Deployments">
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Frontend and backend run independently with environment-driven API base URL for clean deployment ops.
          </p>
        </Card>
      </section>

      <StreamActivities />
    </main>
  );
}
