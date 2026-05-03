import React from "react";

export function Card({
  title,
  children,
  right,
}: {
  title?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "linear-gradient(180deg, var(--panel), var(--panel-2))",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 16,
      }}
    >
      {(title || right) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
