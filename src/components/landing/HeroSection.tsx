"use client";

/**
 * HeroSection — Phase 3 redesign.
 *
 * SPEC (DESIGN_SPEC.md, PHASE 3 HERO):
 * - Full-viewport section, position relative, 100vh / 100svh, min-height 560px,
 *   overflow hidden, isolation isolate.
 * - .hero-bg: absolute inset 0, z-index -2, background #1b2a30 + HERO_IMAGE,
 *   animation heroIn 2.4s var(--ease) both.
 * - ::after gradient overlay (via inner div): two layered gradients.
 * - Scroll cue only: centred, absolute, fadeUp 1s var(--ease) 0.9s both.
 * - NO headline, no subtitle, no CTAs.
 *
 * Props kept identical (onDiscover, isLoggedIn) so HomeClient.tsx is untouched.
 * The onDiscover callback still fires when the scroll cue is clicked.
 */

import React from "react";
import { HERO_IMAGE } from "@/constants/nav-images";

interface HeroSectionProps {
  onDiscover: () => void;
  isLoggedIn?: boolean;
}

export default function HeroSection({ onDiscover }: HeroSectionProps) {
  return (
    <section
      className="wl-scope"
      aria-label="WanderLens heritage travel"
      style={{
        position: "relative",
        height: "100vh",
        /* 100svh overrides on browsers that support it */
        minHeight: 560,
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* ── Background image with heroIn animation ── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div
        role="img"
        aria-label="Ancient Indian heritage monument at golden hour"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -2,
          background: `#1b2a30 url(${HERO_IMAGE}) center 45% / cover no-repeat`,
          animation: "heroIn 2.4s var(--ease) both",
        }}
      />

      {/* ── Overlay gradients (simulates ::after) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
          background: `
            linear-gradient(to bottom, rgba(6,10,12,0.35) 0%, rgba(6,10,12,0) 22%),
            linear-gradient(to top, rgba(6,9,11,0.8) 0%, rgba(6,9,11,0.25) 30%, rgba(6,9,11,0) 55%)
          `,
        }}
      />

      {/* ── Scroll cue ── */}
      <button
        aria-hidden="true"
        onClick={onDiscover}
        tabIndex={-1}
        style={{
          position: "absolute",
          left: "50%",
          top: "44%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 13.5,
          letterSpacing: "0.01em",
          color: "rgba(255,255,255,0.92)",
          textShadow: "0 1px 12px rgba(0,0,0,0.35)",
          animation: "fadeUp 1s var(--ease) 0.9s both",
          background: "none",
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ opacity: 0.8 }}>(</span>
        <span>scroll down</span>
        <span style={{ opacity: 0.8 }}>)</span>
      </button>

      {/* svh override via inline style injected into head is not needed —
          we use a small trick: a 100svh pseudo-layer. */}
      <style>{`
        section[aria-label="WanderLens heritage travel"] {
          height: 100svh;
        }
      `}</style>
    </section>
  );
}
