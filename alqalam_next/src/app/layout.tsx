import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AL Qalam Ultimate School Platform",
  description: "Unified School ERP platform with STREAM-first experience",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
