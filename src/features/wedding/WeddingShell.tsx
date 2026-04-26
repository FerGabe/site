"use client";

import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { CountdownSection } from "./components/CountdownSection";
import { CoupleStorySection } from "./components/CoupleStorySection";
import { GiftListSection } from "@/features/gifts/components/GiftListSection";
import { RSVPSection } from "@/features/rsvp/components/RSVPSection";
import { Footer } from "./components/Footer";
import { MotionHero, MotionReveal } from "@/shared/components/MotionReveal";

export function WeddingShell() {
  return (
    <>
      <Header />
      <main>
        <MotionHero>
          <HeroSection />
        </MotionHero>
        <MotionReveal>
          <CountdownSection />
        </MotionReveal>
        <MotionReveal delay={0.08}>
          <CoupleStorySection />
        </MotionReveal>
        <MotionReveal delay={0.06}>
          <GiftListSection />
        </MotionReveal>
        <MotionReveal delay={0.06}>
          <RSVPSection />
        </MotionReveal>
      </main>
      <MotionReveal delay={0.04}>
        <Footer />
      </MotionReveal>
    </>
  );
}
