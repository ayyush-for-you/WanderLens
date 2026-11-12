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
 * - Bottom scroll indicator: mouse-style scroll cue with looping dot animation.
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

      {/* ── Bottom scroll cue ── */}
      <button
        type="button"
        className="hero-scroll-cue"
        onClick={onDiscover}
        aria-label="Scroll to discover"
      >
        <span className="hero-scroll-text">Scroll</span>
        <div className="hero-scroll-mouse" aria-hidden="true">
          <div className="hero-scroll-dot" />
        </div>
      </button>

      <style>{`
        section[aria-label="WanderLens heritage travel"] {
          height: 100svh;
        }

        .hero-scroll-cue {
          position: absolute;
          left: 50%;
          bottom: 32px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          animation: fadeUp 1s var(--ease) 0.9s both;
          z-index: 10;
        }

        @media (max-width: 860px) {
          .hero-scroll-cue {
            bottom: 24px;
          }
        }

        .hero-scroll-text {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.85);
          text-shadow: 0 1px 12px rgba(0, 0, 0, 0.35);
          line-height: 1;
        }

        .hero-scroll-mouse {
          width: 22px;
          height: 36px;
          border-radius: 999px;
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          background: transparent;
          position: relative;
          display: flex;
          justify-content: center;
          padding-top: 6px;
          box-sizing: border-box;
        }

        .hero-scroll-dot {
          width: 3px;
          height: 7px;
          border-radius: 999px;
          background: #ffffff;
          animation: scrollDot 1.8s var(--ease) infinite;
        }

        @keyframes scrollDot {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
          }
          80% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 0;
            transform: translateY(14px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-scroll-dot {
            animation: none;
            transform: translateY(7px);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
