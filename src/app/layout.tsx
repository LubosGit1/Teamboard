import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Teamboard", template: "%s | Teamboard" },
  description: "A shared Kanban board for small teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
