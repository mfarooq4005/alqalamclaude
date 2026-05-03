import { Card } from "./Card";

export function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <Card>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{label}</p>
      <p style={{ margin: "8px 0 0", fontWeight: 800, fontSize: 24, color: tone || "var(--text)" }}>{value}</p>
    </Card>
  );
}
