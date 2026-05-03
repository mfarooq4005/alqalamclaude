import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({ variant = "primary", style, ...props }: Props) {
  const base: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    color: "var(--text)",
    cursor: "pointer",
    fontWeight: 600,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "linear-gradient(120deg, var(--brand), var(--accent))", color: "#071324" },
    ghost: { background: "rgba(255,255,255,0.04)" },
    danger: { background: "rgba(255,109,109,0.2)", border: "1px solid rgba(255,109,109,0.45)" },
  };

  return <button style={{ ...base, ...variants[variant], ...style }} {...props} />;
}
