import { Card } from "@/components/ui/Card";

const STREAM = [
  { key: "Science", desc: "Robo labs, eco experiments, and discovery challenges." },
  { key: "Technology", desc: "Coding clubs, AI demos, and hardware tinkering." },
  { key: "Reading", desc: "Story theatre, reading marathon, and publishing corner." },
  { key: "Engineering", desc: "Bridge builds, model city projects, design sprint." },
  { key: "Arts", desc: "Digital art, stage acts, and culture creation studios." },
  { key: "Mathematics", desc: "Puzzle arena, speed logic, and practical numeracy." },
];

export function StreamActivities() {
  return (
    <section className="container" style={{ marginTop: 30 }}>
      <h2 style={{ marginBottom: 6 }}>STREAM Front Experience</h2>
      <p style={{ marginTop: 0, color: "var(--muted)" }}>
        Landing page activities designed for kids and parents to enjoy together.
      </p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {STREAM.map((item) => (
          <Card key={item.key} title={item.key}>
            <p style={{ margin: 0, color: "var(--muted)" }}>{item.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
