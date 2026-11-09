"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function BrandStorySection() {
  return (
    <section id="brand-story" className="theme-section-light py-28 md:py-36 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-px bg-[#B99A65]" />
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#B99A65] uppercase font-['Manrope']">
            The Philosophy of Exploration
          </span>
        </div>

        {/* Asymmetrical Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Oversized Editorial Statement */}
          <div className="lg:col-span-7 space-y-8">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal font-['Playfair_Display'] text-[#242321] leading-[1.15]">
              More Than Just{" "}
              <span className="italic font-['Cormorant_Garamond'] text-[#B99A65] font-light">
                a Journey.
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-[#242321]/80 font-light font-['Manrope'] leading-relaxed">
              Every monument has a story. Every journey creates a memory. WanderLens brings history, exploration and travel safety together in one connected, unforgettable experience.
            </p>

            <p className="text-sm text-[#242321]/70 leading-relaxed font-light">
              We believe travel should feel like stepping into a living, breathing history book — where ruins regain their grandeur through AI-driven era reconstructions, and where every traveler moves with complete peace of mind, connected to their companions through state-of-the-art telemetry.
            </p>

            {/* Three Brand Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#D9C7AC]/50">
              <div>
                <div className="text-2xl font-bold font-['Playfair_Display'] text-[#B99A65]">01</div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#242321] mt-1 font-['Manrope']">
                  Heritage Discovery
                </div>
                <p className="text-[11px] text-[#242321]/60 mt-1 leading-normal">
                  Instant visual monument recognition with era timelines and archival comparisons.
                </p>
              </div>

              <div>
                <div className="text-2xl font-bold font-['Playfair_Display'] text-[#B99A65]">02</div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#242321] mt-1 font-['Manrope']">
                  Dual Travel Modes
                </div>
                <p className="text-[11px] text-[#242321]/60 mt-1 leading-normal">
                  Tailored solo contemplative exploration and live synchronized group coordination.
                </p>
              </div>

              <div>
                <div className="text-2xl font-bold font-['Playfair_Display'] text-[#B99A65]">03</div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#242321] mt-1 font-['Manrope']">
                  Cloud Travel Safety
                </div>
                <p className="text-[11px] text-[#242321]/60 mt-1 leading-normal">
                  Hold-to-confirm emergency SOS, broadcast group alerts, and GPS peace of mind.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Asymmetrical Luxury Photography Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md">
              {/* Primary Architectural Image */}
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] relative">
                <img
                  src="https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80&auto=format&fit=crop"
                  alt="Humayun Tomb Mughal Symmetry"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-white text-xs font-serif italic">
                  Humayun's Tomb · Mughal Garden Symmetry
                </div>
              </div>

              {/* Overlapping Smaller Detail Card */}
              <div className="absolute -bottom-8 -left-8 sm:-left-12 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-[#D9C7AC]/40 max-w-[220px] hidden sm:block">
                <div className="flex items-center gap-2 text-[#B99A65] mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
                    Curated Archive
                  </span>
                </div>
                <div className="text-xs font-bold text-[#242321] font-['Playfair_Display']">
                  950+ Historic Casements
                </div>
                <p className="text-[10px] text-[#242321]/60 mt-1 font-['Manrope']">
                  Documented across 6 distinct architectural dynasties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
