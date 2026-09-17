import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Memo",
  description: "Interview notes powered by Next.js, Drizzle, and Cloudflare D1.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
