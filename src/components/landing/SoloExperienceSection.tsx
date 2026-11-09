"use client";

import React from "react";
import Link from "next/link";
import { Compass, ShieldAlert, Bookmark, Radio, ArrowRight } from "lucide-react";

export default function SoloExperienceSection() {
  return (
    <section id="solo-experience" className="theme-section-sandstone py-28 md:py-36 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Imagery & Visual Telemetry */}
          <div className="lg:col-span-6 relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-[#F5F0E7] aspect-[4/3] relative">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80&auto=format&fit=crop"
                alt="Solo Traveler Orienting with Map"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 text-white space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#B99A65]">
                  Private Exploration Stream
                </span>
                <div className="text-xl font-bold font-['Playfair_Display']">
                  Independent Contemplation
                </div>
              </div>
            </div>

            {/* Overlapping Floating Feature Card */}
            <div className="absolute -bottom-6 -right-4 sm:-right-8 bg-[#101B2B] text-white p-5 rounded-2xl shadow-2xl border border-[#B99A65]/30 max-w-[240px]">
              <div className="flex items-center gap-2 text-[#00C9A7] text-xs font-semibold mb-1">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>Zero Location Leaks</span>
              </div>
              <p className="text-[11px] text-[#D9C7AC]/70 leading-normal font-['Manrope']">
                Your coordinates remain completely private on your device unless you trigger the emergency SOS.
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-[#242321]" />
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#242321] uppercase font-['Manrope']">
                Solo Travel Mode
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal font-['Playfair_Display'] text-[#242321] leading-tight">
              Your Journey.{" "}
              <span className="italic font-['Cormorant_Garamond'] text-[#8C6D3B] font-light">
                Your Own Way.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#242321]/80 font-light font-['Manrope'] leading-relaxed">
              Explore at your own pace. Discover hidden places, understand their history, save your favorite destinations and stay protected wherever you go.
            </p>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[#242321]/85 pt-2 font-['Manrope']">
              <li className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-[#8C6D3B] flex-shrink-0" />
                <span>Orient yourself with high-contrast Google and CartoDB DarkMatter maps.</span>
              </li>
              <li className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-[#8C6D3B] flex-shrink-0" />
                <span>Save iconic ruins and hidden gems to your personal travel journal.</span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-[#8C6D3B] flex-shrink-0" />
                <span>1-second press-and-hold Emergency SOS distress trigger with audit logging.</span>
              </li>
            </ul>

            <div className="pt-4">
              <Link
                href="/solo"
                className="px-8 py-4 rounded-full bg-[#101B2B] hover:bg-[#1a2b45] text-[#F5F0E7] font-['Manrope'] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-3 shadow-xl transition-all active:scale-95 group"
              >
                <span>Explore Solo Mode</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#B99A65]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
