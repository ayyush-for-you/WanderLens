"use client";

import React from "react";
import type { Profile } from "@/types/database";

import HeroSection from "@/components/landing/HeroSection";
import BrandStorySection from "@/components/landing/BrandStorySection";
import HeritageDiscoverySection from "@/components/landing/HeritageDiscoverySection";
import InteractiveMapSection from "@/components/landing/InteractiveMapSection";
import SoloExperienceSection from "@/components/landing/SoloExperienceSection";
import GroupExperienceSection from "@/components/landing/GroupExperienceSection";
import TravelSafetySection from "@/components/landing/TravelSafetySection";
import StorytellingSection from "@/components/landing/StorytellingSection";
import GlobeExplorationSection from "@/components/landing/GlobeExplorationSection";
import CtaSection from "@/components/landing/CtaSection";
import EditorialFooter from "@/components/landing/EditorialFooter";

interface HomeClientProps {
  profile: Profile | null;
}

export default function HomeClient({ profile }: HomeClientProps) {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", background: "var(--ink)", color: "var(--text)", overflowX: "hidden" }}>
      {/* 1. Full-Viewport Cinematic Hero Section */}
      <HeroSection
        onDiscover={() => scrollToSection("brand-story")}
        isLoggedIn={!!profile}
      />

      {/* 2. Introductory Brand Story Section */}
      <BrandStorySection />

      {/* 3. Heritage Discovery Section - Digital Travel Magazine */}
      <HeritageDiscoverySection />

      {/* 4. Interactive Map Experience Section */}
      <InteractiveMapSection />

      {/* 5. Solo Travel Experience Section */}
      <SoloExperienceSection />

      {/* 6. Group Travel Experience Section */}
      <GroupExperienceSection />

      {/* 7. Travel Safety & Technology Section */}
      <TravelSafetySection />

      {/* 8. Historical Storytelling Experience ("Every Stone Has a Story") */}
      <StorytellingSection />

      {/* 9. Interactive Globe / Subcontinent Exploration */}
      <GlobeExplorationSection />

      {/* 10. Final Call-to-Action Section */}
      {!profile && <CtaSection />}

      {/* 11. Editorial Footer */}
      <EditorialFooter />
    </div>
  );
}
