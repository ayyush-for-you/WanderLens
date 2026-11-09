"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, MapPin } from "lucide-react";

interface HeroSectionProps {
  onDiscover: () => void;
  isLoggedIn?: boolean;
}

export default function HeroSection({ onDiscover, isLoggedIn }: HeroSectionProps) {
  return (
    <section className="relative h-screen min-h-[750px] w-full flex items-center justify-center overflow-hidden">
      {/* Cinematic Background Image with Slow Parallax Zoom */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: "easeOut" }}
      >
        <img
          src="https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1920&q=85&auto=format&fit=crop"
          alt="Jaipur Heritage Architecture at Golden Hour"
          className="w-full h-full object-cover object-center filter brightness-[0.62] contrast-[1.08]"
        />
        {/* Subtle Luxury Gradient Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101B2B] via-transparent to-[#101B2B]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101B2B]/80 via-transparent to-[#101B2B]/70" />
      </motion.div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center flex flex-col items-center">
        {/* Editorial Subtitle Label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-[#B99A65]/40 bg-[#101B2B]/60 backdrop-blur-md mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B99A65] animate-ping" />
          <span className="text-[11px] font-bold tracking-[0.25em] text-[#D9C7AC] uppercase font-['Manrope']">
            Your Journey. Your Discovery.
          </span>
        </motion.div>

        {/* Oversized Editorial Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal font-['Playfair_Display'] text-[#F5F0E7] tracking-tight leading-[1.08] max-w-5xl"
        >
          Discover History.{" "}
          <span className="italic font-['Cormorant_Garamond'] text-[#B99A65] font-light">
            Experience
          </span>{" "}
          the Journey.
        </motion.h1>

        {/* Supporting Editorial Prose */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-sm sm:text-base md:text-lg text-[#D9C7AC]/90 max-w-2xl font-light font-['Manrope'] leading-relaxed"
        >
          Explore extraordinary heritage destinations, uncover stories hidden in history, and experience every journey with the confidence of intelligent travel safety.
        </motion.p>

        {/* Primary and Secondary Luxury CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
        >
          <Link
            href={isLoggedIn ? "/mode-select" : "/signup"}
            className="px-8 py-4 rounded-full btn-luxury-gold flex items-center gap-3 text-xs shadow-xl active:scale-95 group"
          >
            <span>{isLoggedIn ? "Select Travel Mode" : "Begin Exploring"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={onDiscover}
            className="px-8 py-4 rounded-full btn-luxury-outline flex items-center gap-2 text-xs active:scale-95"
          >
            <span>Discover WanderLens</span>
          </button>
        </motion.div>
      </div>

      {/* Floating Heritage Coordinates Metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-10 left-8 hidden lg:flex items-center gap-3 text-[11px] font-mono text-[#D9C7AC]/70 tracking-widest uppercase"
      >
        <MapPin className="w-3.5 h-3.5 text-[#B99A65]" />
        <span>Hawa Mahal, Jaipur · 26.9239° N, 75.8267° E</span>
      </motion.div>

      {/* Animated Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 right-8 flex flex-col items-center gap-2 cursor-pointer text-[#D9C7AC]/70 hover:text-[#B99A65] transition-colors"
        onClick={onDiscover}
      >
        <span className="text-[10px] tracking-[0.2em] uppercase font-mono">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
