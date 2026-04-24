"use client";

import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { CountdownSection } from "./components/CountdownSection";
import { WelcomeSection } from "./components/WelcomeSection";
import { CoupleStorySection } from "./components/CoupleStorySection";
import { GiftListSection } from "@/features/gifts/components/GiftListSection";
import { RSVPSection } from "@/features/rsvp/components/RSVPSection";
import { Footer } from "./components/Footer";

export function WeddingShell() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CountdownSection />
        <WelcomeSection />
        <CoupleStorySection />
        <GiftListSection />
        <RSVPSection />
      </main>
      <Footer />
    </>
  );
}
