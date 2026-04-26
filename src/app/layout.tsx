import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { UnhandledRejectionGuard } from "@/shared/components/UnhandledRejectionGuard";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fer & Gabe — 6 de junho de 2026",
  description:
    "Com muito amor, convidamos você a celebrar conosco o nosso casamento.",
  icons: {
    icon: "/brand/favicon.png",
    shortcut: "/brand/favicon.png",
    apple: "/brand/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen">
        <UnhandledRejectionGuard />
        {children}
      </body>
    </html>
  );
}
