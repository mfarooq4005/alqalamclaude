import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, style, ...props }: Props) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {label ? <span style={{ fontSize: 13, color: "var(--muted)" }}>{label}</span> : null}
      <input
        {...props}
        style={{
          padding: "11px 12px",
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "rgba(8,14,31,0.85)",
          color: "var(--text)",
          ...style,
        }}
      />
    </label>
  );
}
