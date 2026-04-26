"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MonogramMark } from "@/shared/components/MonogramMark";

const links = [
  { href: "#historia", label: "História" },
  { href: "#presentes", label: "Presentes" },
  { href: "#rsvp", label: "Presença" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-cream/85 backdrop-blur-md shadow-sm border-b border-bege-claro/60"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 gap-x-4 px-5 py-4 md:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl transition-opacity hover:opacity-85"
          aria-label="Área administrativa"
        >
          <MonogramMark size={52} className="h-11 w-auto md:h-12" />
        </Link>
        <nav className="flex flex-1 justify-center md:justify-end items-center gap-4 md:gap-8 text-xs md:text-sm tracking-wide text-texto/80 overflow-x-auto no-scrollbar">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="shrink-0 hover:text-oliva transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-oliva after:transition-all hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
