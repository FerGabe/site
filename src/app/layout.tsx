import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Playfair_Display } from "next/font/google";
import { UnhandledRejectionGuard } from "@/shared/components/UnhandledRejectionGuard";
import { assetPath } from "@/shared/utils/assetPath";
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

/** Tipografia do nome no hero (Cormorant Garamond). */
const heroName = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-hero-name",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fer & Gabe — 6 de junho de 2026",
  description:
    "Com muito amor, convidamos você a celebrar conosco o nosso casamento.",
  icons: {
    icon: assetPath("/brand/favicon.png"),
    shortcut: assetPath("/brand/favicon.png"),
    apple: assetPath("/brand/favicon.png"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${heroName.variable}`}
    >
      <head>
        <link
          rel="preload"
          href={assetPath("/brand/monogram-transparent.png")}
          as="image"
          type="image/png"
        />
      </head>
      <body className="min-h-screen">
        <UnhandledRejectionGuard />
        {children}
      </body>
    </html>
  );
}
