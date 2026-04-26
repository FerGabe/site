import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Fer & Gabe",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen bg-cream text-texto">{children}</div>;
}
