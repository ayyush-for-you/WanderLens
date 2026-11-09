"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="relative py-32 md:py-44 px-6 overflow-hidden flex items-center justify-center text-center">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1920&q=80&auto=format&fit=crop"
          alt="Ancient Palace at Dusk"
          className="w-full h-full object-cover filter brightness-[0.4] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101B2B] via-[#101B2B]/70 to-[#101B2B]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#B99A65]/40 bg-black/50 backdrop-blur-md text-[#D9C7AC] text-xs font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-[#B99A65]" />
          <span>Begin Your Heritage Chapter</span>
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-normal font-['Playfair_Display'] text-[#F5F0E7] leading-tight">
          Every Journey{" "}
          <span className="italic font-['Cormorant_Garamond'] text-[#B99A65] font-light">
            Has a Story.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-[#D9C7AC]/90 font-light font-['Manrope'] max-w-2xl mx-auto leading-relaxed">
          Discover the places that shaped history. Create memories along the way. And travel with the confidence of intelligent telemetry.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="px-10 py-4 rounded-full btn-luxury-gold flex items-center gap-3 text-xs shadow-2xl active:scale-95 group font-['Manrope']"
          >
            <span>Start Your Journey</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
